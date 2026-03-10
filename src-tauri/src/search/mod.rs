use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use thiserror::Error;

pub mod cache;
pub mod pipeline;
pub mod providers;
pub mod service;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub title: String,
    pub url: String,
    pub snippet: String,
    pub provider: String,
    pub score: f32,
}

#[derive(Debug, Clone)]
pub struct SearchOptions {
    pub num_results: usize,
}

#[derive(Error, Debug)]
pub enum SearchError {
    #[error("Network error: {0}")]
    Network(String),
    #[error("API error: {0}")]
    Api(String),
    #[error("Config error: {0}")]
    Config(String),
    #[error("Internal error: {0}")]
    Internal(String),
}

#[async_trait]
pub trait SearchProvider: Send + Sync {
    fn name(&self) -> &'static str;
    async fn search(
        &self,
        query: &str,
        options: &SearchOptions,
    ) -> Result<Vec<SearchResult>, SearchError>;
}

pub async fn handle_response(
    resp: reqwest::Response,
    provider_name: &str,
) -> Result<serde_json::Value, SearchError> {
    if !resp.status().is_success() {
        return Err(SearchError::Api(format!(
            "{} API returned status {}",
            provider_name,
            resp.status()
        )));
    }
    resp.json()
        .await
        .map_err(|e| SearchError::Api(e.to_string()))
}
