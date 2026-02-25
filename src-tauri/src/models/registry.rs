use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ToolCallingSupport {
    Strong,
    Moderate,
    Weak,
    Unknown,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum CostTier {
    Free,
    Budget,
    Standard,
    Premium,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum Provider {
    Anthropic,
    OpenAI,
    Google,
    DeepSeek,
    Meta,
    Mistral,
    XAI,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelCapabilities {
    pub reasoning: f32,
    pub coding: f32,
    pub writing: f32,
    pub speed: f32,
    pub instruction_following: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub display_name: String,
    pub provider: Provider,
    pub capabilities: ModelCapabilities,
    pub tool_calling: ToolCallingSupport,
    pub cost_tier: CostTier,
    pub context_window: u32,
    pub enabled: bool,
}
