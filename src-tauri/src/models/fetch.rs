//! Dynamic model fetching from OpenRouter API
//!
//! Fetches available models from https://openrouter.ai/api/v1/models
//! and converts them to our internal ModelInfo format.

use super::registry::{
    CostTier, ModelCapabilities, ModelInfo, Provider, ToolCallingSupport,
};
use serde::Deserialize;

/// OpenRouter models API response
#[derive(Debug, Deserialize)]
pub struct OpenRouterModelsResponse {
    pub data: Vec<OpenRouterModel>,
}

#[derive(Debug, Deserialize)]
pub(crate) struct OpenRouterModel {
    id: String,
    name: String,
    #[serde(default)]
    description: String,
    #[serde(default)]
    context_length: u32,
    #[serde(default)]
    pricing: Option<Pricing>,
    #[serde(default)]
    architecture: Option<Architecture>,
    #[serde(default)]
    supported_parameters: Option<Vec<String>>,
    #[serde(default)]
    supported_features: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
struct Pricing {
    #[serde(default)]
    prompt: String,
    #[serde(default)]
    #[allow(dead_code)]
    completion: String,
    #[serde(default)]
    #[allow(dead_code)]
    request: String,
}

#[derive(Debug, Deserialize)]
struct Architecture {
    #[serde(default)]
    #[allow(dead_code)]
    instruct_type: Option<String>,
}

/// Known model capability profiles
/// These are hand-tuned for popular models since the API doesn't provide capability scores
const KNOWN_CAPABILITIES: &[(&str, ModelCapabilities, ToolCallingSupport)] = &[
    // Claude models
    (
        "anthropic/claude-opus-4-5",
        ModelCapabilities {
            reasoning: 0.98,
            coding: 0.95,
            writing: 0.97,
            speed: 0.30,
            instruction_following: 0.97,
        },
        ToolCallingSupport::Strong,
    ),
    (
        "anthropic/claude-sonnet-4-5",
        ModelCapabilities {
            reasoning: 0.93,
            coding: 0.94,
            writing: 0.92,
            speed: 0.70,
            instruction_following: 0.95,
        },
        ToolCallingSupport::Strong,
    ),
    (
        "anthropic/claude-3.7-sonnet",
        ModelCapabilities {
            reasoning: 0.91,
            coding: 0.93,
            writing: 0.90,
            speed: 0.72,
            instruction_following: 0.93,
        },
        ToolCallingSupport::Strong,
    ),
    (
        "anthropic/claude-3-5-haiku",
        ModelCapabilities {
            reasoning: 0.78,
            coding: 0.80,
            writing: 0.77,
            speed: 0.95,
            instruction_following: 0.82,
        },
        ToolCallingSupport::Strong,
    ),
    // Gemini models
    (
        "google/gemini-2.5-pro",
        ModelCapabilities {
            reasoning: 0.92,
            coding: 0.90,
            writing: 0.88,
            speed: 0.78,
            instruction_following: 0.90,
        },
        ToolCallingSupport::Strong,
    ),
    (
        "google/gemini-2.5-flash",
        ModelCapabilities {
            reasoning: 0.85,
            coding: 0.84,
            writing: 0.80,
            speed: 0.92,
            instruction_following: 0.84,
        },
        ToolCallingSupport::Strong,
    ),
    (
        "google/gemini-2.0-flash",
        ModelCapabilities {
            reasoning: 0.82,
            coding: 0.82,
            writing: 0.78,
            speed: 0.90,
            instruction_following: 0.80,
        },
        ToolCallingSupport::Moderate,
    ),
    // OpenAI models
    (
        "openai/gpt-4.1",
        ModelCapabilities {
            reasoning: 0.92,
            coding: 0.93,
            writing: 0.90,
            speed: 0.70,
            instruction_following: 0.93,
        },
        ToolCallingSupport::Strong,
    ),
    (
        "openai/gpt-4.1-mini",
        ModelCapabilities {
            reasoning: 0.82,
            coding: 0.82,
            writing: 0.80,
            speed: 0.92,
            instruction_following: 0.82,
        },
        ToolCallingSupport::Strong,
    ),
    (
        "openai/o3-mini",
        ModelCapabilities {
            reasoning: 0.90,
            coding: 0.88,
            writing: 0.80,
            speed: 0.60,
            instruction_following: 0.85,
        },
        ToolCallingSupport::Moderate,
    ),
    // DeepSeek
    (
        "deepseek/deepseek-chat",
        ModelCapabilities {
            reasoning: 0.88,
            coding: 0.90,
            writing: 0.82,
            speed: 0.80,
            instruction_following: 0.85,
        },
        ToolCallingSupport::Moderate,
    ),
    (
        "deepseek/deepseek-r1",
        ModelCapabilities {
            reasoning: 0.95,
            coding: 0.85,
            writing: 0.75,
            speed: 0.40,
            instruction_following: 0.80,
        },
        ToolCallingSupport::Moderate,
    ),
    // Meta Llama
    (
        "meta-llama/llama-3.3-70b-instruct",
        ModelCapabilities {
            reasoning: 0.82,
            coding: 0.80,
            writing: 0.78,
            speed: 0.85,
            instruction_following: 0.80,
        },
        ToolCallingSupport::Moderate,
    ),
    (
        "meta-llama/llama-3.1-405b-instruct",
        ModelCapabilities {
            reasoning: 0.88,
            coding: 0.85,
            writing: 0.82,
            speed: 0.70,
            instruction_following: 0.85,
        },
        ToolCallingSupport::Moderate,
    ),
];

/// Provider detection from model ID
fn detect_provider(model_id: &str) -> Provider {
    if model_id.starts_with("anthropic/") {
        Provider::Anthropic
    } else if model_id.starts_with("openai/") {
        Provider::OpenAI
    } else if model_id.starts_with("google/") {
        Provider::Google
    } else if model_id.starts_with("deepseek/") {
        Provider::DeepSeek
    } else if model_id.starts_with("meta-llama/") {
        Provider::Meta
    } else if model_id.starts_with("mistralai/") {
        Provider::Mistral
    } else if model_id.starts_with("x-ai/") {
        Provider::XAI
    } else {
        Provider::Other
    }
}

/// Cost tier detection from pricing
fn detect_cost_tier(model_id: &str, pricing: Option<&Pricing>) -> CostTier {
    // Check for explicit free tier
    if model_id.ends_with(":free") {
        return CostTier::Free;
    }

    // Check pricing
    if let Some(p) = pricing {
        // Parse prompt price (remove $ if present, convert to per-million)
        let prompt_price = p
            .prompt
            .strip_prefix('$')
            .unwrap_or(&p.prompt)
            .parse::<f64>()
            .unwrap_or(0.0);

        // Free tier is essentially 0
        if prompt_price == 0.0 {
            return CostTier::Free;
        }

        // Budget tier: under $1 per million
        if prompt_price < 1.0 {
            return CostTier::Budget;
        }

        // Standard tier: $1-$5 per million
        if prompt_price <= 5.0 {
            return CostTier::Standard;
        }

        // Premium tier: over $5 per million
        return CostTier::Premium;
    }

    // Fallback based on provider
    match detect_provider(model_id) {
        Provider::Anthropic => CostTier::Standard,
        Provider::OpenAI => CostTier::Standard,
        Provider::Google => CostTier::Budget,
        Provider::DeepSeek => CostTier::Budget,
        Provider::Meta => CostTier::Free,
        _ => CostTier::Budget,
    }
}

/// Check if model supports tools based on supported_features
fn detect_tool_calling(
    model_id: &str,
    features: &Option<Vec<String>>,
    params: &Option<Vec<String>>,
) -> ToolCallingSupport {
    // Check known models first
    if let Some((_, _, tc)) = KNOWN_CAPABILITIES.iter().find(|(id, _, _)| model_id.starts_with(id))
    {
        return *tc;
    }

    // Check for explicit "tools" feature
    if let Some(f) = features {
        if f.iter().any(|f| f == "tools" || f == "function_calling") {
            return ToolCallingSupport::Strong;
        }
    }

    // Check for tool-related parameters
    if let Some(p) = params {
        if p.iter().any(|p| p == "tools" || p == "functions") {
            return ToolCallingSupport::Strong;
        }
    }

    // Fallback: assume no tool support
    ToolCallingSupport::Unknown
}

/// Get capabilities for a model
fn get_capabilities(model_id: &str) -> ModelCapabilities {
    // Check known models first
    if let Some((_, caps, _)) = KNOWN_CAPABILITIES.iter().find(|(id, _, _)| model_id.starts_with(id))
    {
        return *caps;
    }

    // Estimate based on provider
    match detect_provider(model_id) {
        Provider::Anthropic => ModelCapabilities {
            reasoning: 0.85,
            coding: 0.85,
            writing: 0.85,
            speed: 0.75,
            instruction_following: 0.85,
        },
        Provider::OpenAI => ModelCapabilities {
            reasoning: 0.85,
            coding: 0.85,
            writing: 0.82,
            speed: 0.78,
            instruction_following: 0.85,
        },
        Provider::Google => ModelCapabilities {
            reasoning: 0.82,
            coding: 0.80,
            writing: 0.78,
            speed: 0.85,
            instruction_following: 0.80,
        },
        Provider::DeepSeek => ModelCapabilities {
            reasoning: 0.85,
            coding: 0.88,
            writing: 0.80,
            speed: 0.78,
            instruction_following: 0.82,
        },
        Provider::Meta => ModelCapabilities {
            reasoning: 0.75,
            coding: 0.75,
            writing: 0.75,
            speed: 0.80,
            instruction_following: 0.75,
        },
        _ => ModelCapabilities {
            reasoning: 0.70,
            coding: 0.70,
            writing: 0.70,
            speed: 0.75,
            instruction_following: 0.70,
        },
    }
}

/// Fetch models from OpenRouter API
pub async fn fetch_openrouter_models(
    api_key: &str,
) -> Result<Vec<ModelInfo>, String> {
    let client = reqwest::Client::new();

    let response = client
        .get("https://openrouter.ai/api/v1/models")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("HTTP-Referer", "https://nasus.ai")
        .header("X-Title", "Nasus")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch models: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "API returned error: {}",
            response.status().as_u16()
        ));
    }

    let or_response: OpenRouterModelsResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    // Convert to our ModelInfo format
    let models = or_response
        .data
        .into_iter()
        .map(|m| convert_to_model_info(m))
        .collect();

    Ok(models)
}

/// Convert OpenRouter model to our ModelInfo format
fn convert_to_model_info(m: OpenRouterModel) -> ModelInfo {
    let cost_tier = detect_cost_tier(&m.id, m.pricing.as_ref());
    let provider = detect_provider(&m.id);
    let tool_calling = detect_tool_calling(&m.id, &m.supported_features, &m.supported_parameters);
    let capabilities = get_capabilities(&m.id);

    ModelInfo {
        id: m.id.clone(),
        display_name: m.name,
        provider,
        capabilities,
        tool_calling,
        cost_tier,
        context_window: m.context_length.max(1),
        enabled: true,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_provider_detection() {
        assert_eq!(detect_provider("anthropic/claude-3.5-sonnet"), Provider::Anthropic);
        assert_eq!(detect_provider("openai/gpt-4"), Provider::OpenAI);
        assert_eq!(detect_provider("google/gemini-pro"), Provider::Google);
        assert_eq!(detect_provider("deepseek/deepseek-chat"), Provider::DeepSeek);
        assert_eq!(detect_provider("meta-llama/llama-3"), Provider::Meta);
        assert_eq!(detect_provider("unknown/model"), Provider::Other);
    }

    #[test]
    fn test_free_detection() {
        assert_eq!(
            detect_cost_tier("google/gemini-2.5-flash:free", None),
            CostTier::Free
        );
        assert_eq!(
            detect_cost_tier("deepseek/deepseek-chat:free", None),
            CostTier::Free
        );
    }
}
