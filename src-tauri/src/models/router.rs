use serde::{Deserialize, Serialize};
use super::classifier::{Capability, TaskClassification, TaskComplexity};
use super::registry::{CostTier, ModelInfo, ToolCallingSupport};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum BudgetMode {
    Free,
    Paid,
}

/// How the user has configured model selection.
#[derive(Debug, Clone, PartialEq)]
pub enum ModelSelectionMode {
    /// Nasus picks automatically
    Auto,
    /// User locked to a specific model ID
    Manual { model_id: String },
}

impl Serialize for ModelSelectionMode {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        match self {
            ModelSelectionMode::Auto => serializer.serialize_str("auto"),
            ModelSelectionMode::Manual { model_id } => serializer.serialize_str(model_id),
        }
    }
}

impl<'de> Deserialize<'de> for ModelSelectionMode {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        if s == "auto" {
            Ok(ModelSelectionMode::Auto)
        } else {
            Ok(ModelSelectionMode::Manual { model_id: s })
        }
    }
}

/// Full router configuration — loaded from settings, passed into every LLM call.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RouterConfig {
    pub mode: ModelSelectionMode,
    pub budget: BudgetMode,
    pub registry: Vec<ModelInfo>,
}

/// The output of the router — what to send to OpenRouter.
#[derive(Debug, Clone, Serialize)]
pub struct RoutingDecision {
    /// OpenRouter model ID to use in the API request
    pub model_id: String,
    /// Human-readable reason shown in the UI tooltip
    pub reason: String,
    /// Display name for the in-chat model badge
    pub display_name: String,
}

impl Default for RouterConfig {
    fn default() -> Self {
        RouterConfig {
            mode: ModelSelectionMode::Auto,
            budget: BudgetMode::Paid,
            registry: super::defaults::default_model_registry(),
        }
    }
}

impl RouterConfig {
    /// Top-level routing entry point.
    pub fn route(&self, classification: &TaskClassification) -> RoutingDecision {
        // Manual mode: always use the specified model
        if let ModelSelectionMode::Manual { model_id } = &self.mode {
            let name = self
                .registry
                .iter()
                .find(|m| &m.id == model_id)
                .map(|m| m.display_name.clone())
                .unwrap_or_else(|| model_id.clone());
            return RoutingDecision {
                model_id: model_id.clone(),
                display_name: name.clone(),
                reason: format!("{name} (manually selected)"),
            };
        }

        // Auto mode
        match self.budget {
            BudgetMode::Free => self.route_free(classification),
            BudgetMode::Paid => self.route_paid(classification),
        }
    }

    fn route_free(&self, classification: &TaskClassification) -> RoutingDecision {
        let candidates: Vec<&ModelInfo> = self
            .registry
            .iter()
            .filter(|m| m.cost_tier == CostTier::Free && m.enabled)
            .filter(|m| m.tool_calling != ToolCallingSupport::Weak)
            .collect();

        if candidates.is_empty() {
            return RoutingDecision {
                model_id: "openrouter/auto".into(),
                display_name: "Auto (Free)".into(),
                reason: "Auto router — no free models configured".into(),
            };
        }

        let best = self.best_from(&candidates, classification);
        RoutingDecision {
            model_id: best.id.clone(),
            display_name: best.display_name.clone(),
            reason: format!(
                "{} — best free model for {} task",
                best.display_name,
                format_task_type(classification),
            ),
        }
    }

    fn route_paid(&self, classification: &TaskClassification) -> RoutingDecision {
        match classification.complexity {
            TaskComplexity::Low => self.pick_from_tiers(
                classification,
                &[CostTier::Budget, CostTier::Standard],
                "fast & cost-effective for simple task",
            ),
            TaskComplexity::Medium => self.pick_from_tiers(
                classification,
                &[CostTier::Standard, CostTier::Budget],
                "balanced for medium-complexity task",
            ),
            TaskComplexity::High => self.pick_from_tiers(
                classification,
                &[CostTier::Standard, CostTier::Premium],
                "strongest model for complex task",
            ),
        }
    }

    fn pick_from_tiers(
        &self,
        classification: &TaskClassification,
        tiers: &[CostTier],
        reason_suffix: &str,
    ) -> RoutingDecision {
        let mut candidates: Vec<&ModelInfo> = self
            .registry
            .iter()
            .filter(|m| tiers.contains(&m.cost_tier) && m.enabled)
            .filter(|m| m.tool_calling != ToolCallingSupport::Weak)
            .collect();

        // Expand to all non-free if nothing found
        if candidates.is_empty() {
            candidates = self
                .registry
                .iter()
                .filter(|m| m.cost_tier != CostTier::Free && m.enabled)
                .filter(|m| m.tool_calling != ToolCallingSupport::Weak)
                .collect();
        }

        if candidates.is_empty() {
            return RoutingDecision {
                model_id: "openrouter/auto".into(),
                display_name: "Auto".into(),
                reason: "Auto router — no matching models configured".into(),
            };
        }

        let best = self.best_from(&candidates, classification);
        RoutingDecision {
            model_id: best.id.clone(),
            display_name: best.display_name.clone(),
            reason: format!("{} — {reason_suffix}", best.display_name),
        }
    }

    fn best_from<'a>(
        &self,
        candidates: &[&'a ModelInfo],
        classification: &TaskClassification,
    ) -> &'a ModelInfo {
        candidates
            .iter()
            .copied()
            .max_by(|a, b| {
                let sa = self.score_model(a, classification);
                let sb = self.score_model(b, classification);
                sa.partial_cmp(&sb).unwrap_or(std::cmp::Ordering::Equal)
            })
            .expect("candidates is non-empty")
    }

    fn score_model(&self, model: &ModelInfo, classification: &TaskClassification) -> f32 {
        let c = &model.capabilities;
        let primary = match classification.primary_capability {
            Capability::Reasoning => c.reasoning,
            Capability::Coding => c.coding,
            Capability::Writing => c.writing,
            Capability::Speed => c.speed,
            Capability::InstructionFollowing => c.instruction_following,
        };
        let tool_score = match model.tool_calling {
            ToolCallingSupport::Strong => 1.0,
            ToolCallingSupport::Moderate => 0.7,
            ToolCallingSupport::Weak => 0.3,
            ToolCallingSupport::Unknown => 0.5,
        };
        let base = (primary * 0.6)
            + (c.instruction_following * 0.2)
            + (c.speed * 0.1)
            + (tool_score * 0.1);
        let bonus = if model.tool_calling == ToolCallingSupport::Strong {
            0.05
        } else {
            0.0
        };
        base + bonus
    }

    /// Merge per-model `enabled` overrides from a JSON map (id → bool).
    pub fn apply_enabled_overrides(&mut self, overrides: &std::collections::HashMap<String, bool>) {
        for m in &mut self.registry {
            if let Some(&enabled) = overrides.get(&m.id) {
                m.enabled = enabled;
            }
        }
    }
}

fn format_task_type(c: &TaskClassification) -> &'static str {
    use super::classifier::TaskType;
    match c.task_type {
        TaskType::WebDev => "web development",
        TaskType::Coding => "coding",
        TaskType::Writing => "writing",
        TaskType::Research => "research",
        TaskType::DataAnalysis => "data analysis",
        TaskType::SimpleQA => "quick answer",
        TaskType::General => "general",
    }
}

/// Build a fallback chain for a routing decision.
/// Passed as `models` + `route: "fallback"` to OpenRouter so it automatically
/// retries on rate-limit or model outage.
pub fn build_fallback_chain(primary: &str, budget: BudgetMode) -> Vec<String> {
    match budget {
        BudgetMode::Free => vec![
            primary.to_string(),
            "google/gemini-2.0-flash-exp:free".to_string(),
            "deepseek/deepseek-chat:free".to_string(),
            "meta-llama/llama-3.3-70b-instruct:free".to_string(),
        ],
        BudgetMode::Paid => vec![
            primary.to_string(),
            "anthropic/claude-3.7-sonnet".to_string(),
            "openai/gpt-4.1".to_string(),
            "google/gemini-2.5-pro-preview".to_string(),
        ],
    }
}

/// Cost tracking per LLM call
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TaskCostTracker {
    pub calls: Vec<CallCost>,
    pub total_input_tokens: u64,
    pub total_output_tokens: u64,
    /// Estimated cost in USD (requires model pricing — approximated from token counts)
    pub total_cost_usd: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CallCost {
    pub model_id: String,
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub cost_usd: f64,
}

/// Per-model pricing table (USD per million tokens)
/// These are approximate and only used for client-side cost display.
/// Source: OpenRouter model pages, 2025-06.
pub fn pricing_usd_per_million(model_id: &str) -> (f64, f64) {
    // (input_price, output_price) per million tokens
    match model_id {
        id if id.ends_with(":free") => (0.0, 0.0),
        "anthropic/claude-opus-4-5" => (15.0, 75.0),
        "anthropic/claude-sonnet-4-20250514" => (3.0, 15.0),
        "anthropic/claude-sonnet-4-5" => (3.0, 15.0),
        "anthropic/claude-3.7-sonnet" => (3.0, 15.0),
        "anthropic/claude-3-5-haiku" => (0.80, 4.0),
        "openai/gpt-4.1" => (2.0, 8.0),
        "openai/gpt-4.1-mini" => (0.40, 1.60),
        "google/gemini-2.5-pro-preview" => (1.25, 10.0),
        "google/gemini-2.0-flash-001" => (0.10, 0.40),
        "deepseek/deepseek-chat" => (0.27, 1.10),
        "deepseek/deepseek-r1" => (0.55, 2.19),
        "deepseek/deepseek-r1-0528" => (0.55, 2.19),
        _ => (1.0, 5.0), // generic fallback estimate
    }
}

impl TaskCostTracker {
    pub fn record(&mut self, model_id: &str, input_tokens: u64, output_tokens: u64) {
        let (in_price, out_price) = pricing_usd_per_million(model_id);
        let cost = (input_tokens as f64 / 1_000_000.0) * in_price
            + (output_tokens as f64 / 1_000_000.0) * out_price;
        self.calls.push(CallCost {
            model_id: model_id.to_string(),
            input_tokens,
            output_tokens,
            cost_usd: cost,
        });
        self.total_input_tokens += input_tokens;
        self.total_output_tokens += output_tokens;
        self.total_cost_usd += cost;
    }
}

/// Daily free-model rate limit tracker
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitTracker {
    pub free_requests_today: u32,
    pub reset_at_unix_secs: i64,
    pub daily_limit: u32,
}

impl Default for RateLimitTracker {
    fn default() -> Self {
        RateLimitTracker {
            free_requests_today: 0,
            reset_at_unix_secs: next_midnight_unix(),
            daily_limit: 50,
        }
    }
}

impl RateLimitTracker {
    pub fn ensure_reset(&mut self) {
        let now = chrono::Utc::now().timestamp();
        if now >= self.reset_at_unix_secs {
            self.free_requests_today = 0;
            self.reset_at_unix_secs = next_midnight_unix();
        }
    }

    pub fn can_use_free(&mut self, estimated_calls: u32) -> bool {
        self.ensure_reset();
        (self.free_requests_today + estimated_calls) <= self.daily_limit
    }

    pub fn record_free_call(&mut self) {
        self.ensure_reset();
        self.free_requests_today += 1;
    }

    pub fn remaining(&mut self) -> u32 {
        self.ensure_reset();
        self.daily_limit.saturating_sub(self.free_requests_today)
    }
}

fn next_midnight_unix() -> i64 {
    use chrono::{TimeZone, Utc};
    let now = Utc::now();
    let tomorrow = now.date_naive().succ_opt().unwrap_or(now.date_naive());
    Utc.from_utc_datetime(&tomorrow.and_hms_opt(0, 0, 0).unwrap())
        .timestamp()
}
