// src-tauri/src/gateway.rs
//
// Gateway abstraction for multi-provider LLM routing.
//
// This module provides:
//  - GatewayConfig / GatewayType types
//  - Gateway-aware LLM call with automatic failover
//  - Health tracking per gateway
//  - Tauri commands for gateway management from the frontend

use crate::{NasusError, NasusResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

// ─── Types ──────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum GatewayType {
    Openrouter,
    /// Requesty LLM router (OpenAI-compatible)
    Requesty,
    /// DeepSeek direct API (https://api.deepseek.com/v1)
    Deepseek,
    /// Anthropic direct API (https://api.anthropic.com/v1)
    Anthropic,
    Litellm,
    Direct,
    Ollama,
    Custom,
    /// Vercel AI Gateway (OpenAI-compatible proxy)
    Vercel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GatewayConfig {
    pub id: String,
    pub gateway_type: GatewayType,
    pub label: String,
    pub api_base: String,
    pub api_key: String,
    pub priority: u8,
    pub enabled: bool,
    pub native_routing: bool,
    pub max_retries: u8,
    pub timeout_ms: u64,
    #[serde(default)]
    pub extra_headers: HashMap<String, String>,
}

impl Default for GatewayConfig {
    fn default() -> Self {
        Self {
            id: "deepseek".to_string(),
            gateway_type: GatewayType::Deepseek,
            label: "DeepSeek (Direct)".to_string(),
            api_base: "https://api.deepseek.com/v1".to_string(),
            api_key: String::new(),
            priority: 0,
            enabled: true,
            native_routing: false,
            max_retries: 2,
            timeout_ms: 180_000,
            extra_headers: HashMap::new(),
        }
    }
}

// ─── Health Tracking ────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GatewayHealth {
    pub gateway_id: String,
    pub status: String, // "healthy" | "degraded" | "down" | "unknown"
    pub consecutive_failures: u32,
    pub success_rate: f64,
    pub avg_latency_ms: f64,
    pub retry_after_ms: Option<u64>,
}

const CIRCUIT_BREAK_THRESHOLD: u32 = 3;
const CIRCUIT_BREAK_COOLDOWN_MS: u64 = 60_000;

#[derive(Debug)]
struct HealthState {
    consecutive_failures: u32,
    successes: u32,
    total: u32,
    avg_latency_ms: f64,
    last_failure: Option<Instant>,
    retry_after: Option<Instant>,
}

impl Default for HealthState {
    fn default() -> Self {
        Self {
            consecutive_failures: 0,
            successes: 0,
            total: 0,
            avg_latency_ms: 0.0,
            last_failure: None,
            retry_after: None,
        }
    }
}

// ─── Gateway Manager ────────────────────────────────────────────────────────

pub struct GatewayManager {
    gateways: Vec<GatewayConfig>,
    health: HashMap<String, HealthState>,
}

impl GatewayManager {
    pub fn new(gateways: Vec<GatewayConfig>) -> Self {
        let mut health = HashMap::new();
        for gw in &gateways {
            health.insert(gw.id.clone(), HealthState::default());
        }
        Self { gateways, health }
    }

    /// Update the gateway list (e.g., from settings)
    pub fn update_gateways(&mut self, gateways: Vec<GatewayConfig>) {
        for gw in &gateways {
            self.health.entry(gw.id.clone()).or_default();
        }
        self.gateways = gateways;
    }

    /// Get eligible gateways for a request (sorted by priority, excluding circuit-broken)
    pub fn eligible(&self) -> Vec<&GatewayConfig> {
        let now = Instant::now();
        let mut active: Vec<&GatewayConfig> = self
            .gateways
            .iter()
            .filter(|gw| gw.enabled && !gw.api_base.is_empty())
            .filter(|gw| {
                let health = self.health.get(&gw.id);
                match health {
                    Some(h) if h.consecutive_failures >= CIRCUIT_BREAK_THRESHOLD => {
                        // Check if cooldown elapsed
                        h.retry_after.map_or(true, |t| now >= t)
                    }
                    _ => true,
                }
            })
            .collect();

        active.sort_by_key(|gw| gw.priority);
        active
    }

    /// Record a successful call
    pub fn record_success(&mut self, gateway_id: &str, latency_ms: f64) {
        if let Some(h) = self.health.get_mut(gateway_id) {
            h.consecutive_failures = 0;
            h.successes += 1;
            h.total += 1;
            h.retry_after = None;
            h.avg_latency_ms = if h.avg_latency_ms == 0.0 {
                latency_ms
            } else {
                h.avg_latency_ms * 0.8 + latency_ms * 0.2
            };
        }
    }

    /// Record a failed call
    pub fn record_failure(&mut self, gateway_id: &str) {
        if let Some(h) = self.health.get_mut(gateway_id) {
            h.consecutive_failures += 1;
            h.total += 1;
            h.last_failure = Some(Instant::now());

            if h.consecutive_failures >= CIRCUIT_BREAK_THRESHOLD {
                let backoff = CIRCUIT_BREAK_COOLDOWN_MS
                    * 2u64.pow(
                        h.consecutive_failures
                            .saturating_sub(CIRCUIT_BREAK_THRESHOLD)
                            .min(4),
                    );
                let backoff = backoff.min(300_000); // Cap at 5 minutes
                h.retry_after = Some(Instant::now() + Duration::from_millis(backoff));
            }
        }
    }

    /// Get health status for the frontend
    pub fn health_report(&self) -> Vec<GatewayHealth> {
        self.gateways
            .iter()
            .filter_map(|gw| {
                let h = self.health.get(&gw.id)?;
                let success_rate = if h.total > 0 {
                    h.successes as f64 / h.total as f64
                } else {
                    1.0
                };
                let status = if h.consecutive_failures >= CIRCUIT_BREAK_THRESHOLD {
                    "down"
                } else if h.consecutive_failures > 0 {
                    "degraded"
                } else if h.total == 0 {
                    "unknown"
                } else {
                    "healthy"
                };
                Some(GatewayHealth {
                    gateway_id: gw.id.clone(),
                    status: status.to_string(),
                    consecutive_failures: h.consecutive_failures,
                    success_rate,
                    avg_latency_ms: h.avg_latency_ms,
                    retry_after_ms: h.retry_after.and_then(|t| {
                        let remaining = t.saturating_duration_since(Instant::now()).as_millis() as u64;
                        if remaining > 0 { Some(remaining) } else { None }
                    }),
                })
            })
            .collect()
    }

    /// Build headers for a specific gateway
    pub fn build_headers(&self, gw: &GatewayConfig) -> HashMap<String, String> {
        let mut headers = HashMap::new();

        match gw.gateway_type {
            GatewayType::Openrouter | GatewayType::Requesty => {
                headers.insert("HTTP-Referer".to_string(), "https://nasus.app".to_string());
                headers.insert("X-Title".to_string(), "Nasus".to_string());
                headers.insert("X-Allow-Fallbacks".to_string(), "true".to_string());
            }
            GatewayType::Deepseek => {
                // DeepSeek direct API — no special headers required beyond Authorization
            }
            GatewayType::Vercel => {
                // Vercel AI Gateway — OpenAI-compatible, no extra headers needed
            }
            _ => {}
        }

        // User-configured extra headers
        for (k, v) in &gw.extra_headers {
            headers.insert(k.clone(), v.clone());
        }

        headers
    }
}

// ─── Thread-safe wrapper for Tauri state ────────────────────────────────────

pub struct GatewayState {
    pub manager: Arc<Mutex<GatewayManager>>,
}

impl GatewayState {
    pub fn new(gateways: Vec<GatewayConfig>) -> Self {
        Self {
            manager: Arc::new(Mutex::new(GatewayManager::new(gateways))),
        }
    }

    /// Load gateways from the tauri-plugin-store config
    pub fn from_store(store: &impl StoreRead) -> Self {
        // Try to load saved gateways; fall back to defaults
        let gateways = store
            .get("gateways")
            .and_then(|v| serde_json::from_value::<Vec<GatewayConfig>>(v).ok())
            .unwrap_or_else(default_gateways);

        Self::new(gateways)
    }
}

/// Trait for reading from tauri-plugin-store (avoids tight coupling)
pub trait StoreRead {
    fn get(&self, key: &str) -> Option<serde_json::Value>;
}

pub fn default_gateways() -> Vec<GatewayConfig> {
    vec![
        GatewayConfig {
            id: "deepseek".to_string(),
            gateway_type: GatewayType::Deepseek,
            label: "DeepSeek (Direct)".to_string(),
            api_base: "https://api.deepseek.com/v1".to_string(),
            api_key: String::new(),
            priority: 0,
            enabled: true,
            native_routing: false,
            max_retries: 2,
            timeout_ms: 180_000,
            extra_headers: HashMap::new(),
        },
        GatewayConfig {
            id: "anthropic".to_string(),
            gateway_type: GatewayType::Anthropic,
            label: "Anthropic (Claude)".to_string(),
            api_base: "https://api.anthropic.com/v1".to_string(),
            api_key: String::new(),
            priority: 5,
            enabled: false,
            native_routing: false,
            max_retries: 2,
            timeout_ms: 180_000,
            extra_headers: HashMap::new(),
        },
        GatewayConfig {
            id: "ollama".to_string(),
            gateway_type: GatewayType::Ollama,
            label: "Ollama (Local)".to_string(),
            api_base: "http://localhost:11434/v1".to_string(),
            api_key: String::new(),
            priority: 10,
            enabled: false,
            native_routing: false,
            max_retries: 1,
            timeout_ms: 300_000,
            extra_headers: HashMap::new(),
        },
        GatewayConfig {
            id: "custom".to_string(),
            gateway_type: GatewayType::Custom,
            label: "Custom".to_string(),
            api_base: String::new(),
            api_key: String::new(),
            priority: 20,
            enabled: false,
            native_routing: false,
            max_retries: 2,
            timeout_ms: 180_000,
            extra_headers: HashMap::new(),
        },
    ]
}

// ─── Tauri Commands ─────────────────────────────────────────────────────────

/// Get the current gateway configuration, merging from persisted store if available
#[tauri::command]
pub fn get_gateways(
    app: tauri::AppHandle,
    state: tauri::State<'_, GatewayState>,
) -> Vec<GatewayConfig> {
    // Try to load persisted gateway config (including API keys) from tauri-plugin-store
    if let Ok(store) = tauri_plugin_store::StoreExt::store(&app, "nasus_config.json") {
        if let Some(saved) = store.get("gateways") {
            if let Ok(saved_gateways) = serde_json::from_value::<Vec<GatewayConfig>>(saved.clone())
            {
                // Update in-memory manager to stay in sync
                let mut manager = state.manager.lock().unwrap_or_else(|e| e.into_inner());
                manager.update_gateways(saved_gateways.clone());
                return saved_gateways;
            }
        }
    }

    let manager = state.manager.lock().unwrap_or_else(|e| e.into_inner());
    manager.gateways.clone()
}

/// Update gateways from the frontend and persist to tauri-plugin-store
#[tauri::command]
pub fn save_gateways(
    app: tauri::AppHandle,
    state: tauri::State<'_, GatewayState>,
    gateways: Vec<GatewayConfig>,
) {
    // Update in-memory manager
    {
        let mut manager = state.manager.lock().unwrap_or_else(|e| e.into_inner());
        manager.update_gateways(gateways.clone());
    }

    // Persist to tauri-plugin-store including API keys.
    // nasus_config.json lives in the app's private data directory and is not
    // web-accessible, so this is safe for a desktop app.
    if let Ok(store) = tauri_plugin_store::StoreExt::store(&app, "nasus_config.json") {
        let serialized = serde_json::to_value(&gateways).unwrap_or_default();
        store.set("gateways", serialized);
        let _ = store.save();
    }
}

/// Get health status
#[tauri::command]
pub fn get_gateway_health(state: tauri::State<'_, GatewayState>) -> Vec<GatewayHealth> {
    let manager = state.manager.lock().unwrap_or_else(|e| e.into_inner());
    manager.health_report()
}

/// Quick connectivity test for a single gateway
#[tauri::command]
pub async fn test_gateway(api_base: String, api_key: String) -> NasusResult<serde_json::Value> {
    let url = format!("{}/models", api_base.trim_end_matches('/'));
    // Validate URL to prevent SSRF — same rules as http_fetch
    crate::validate_url_for_fetch(&url).map_err(NasusError::Config)?;
    let client = &*crate::HTTP_CLIENT;
    let mut req = client
        .get(&url)
        .header("Content-Type", "application/json")
        .timeout(Duration::from_secs(10));

    if !api_key.is_empty() {
        if api_base.contains("api.anthropic.com") {
            req = req
                .header("x-api-key", &api_key)
                .header("anthropic-version", "2023-06-01");
        } else {
            req = req.header("Authorization", format!("Bearer {api_key}"));
        }
    }

    let resp = req
        .send()
        .await
        .map_err(|e| NasusError::Command(format!("Connection failed: {e}")))?;

    if !resp.status().is_success() {
        return Err(NasusError::Command(format!("HTTP {}", resp.status())));
    }

    let json: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| NasusError::Command(e.to_string()))?;
    let model_count = json["data"].as_array().map(|a| a.len()).unwrap_or(0);

    Ok(serde_json::json!({
        "ok": true,
        "modelCount": model_count,
    }))
}
