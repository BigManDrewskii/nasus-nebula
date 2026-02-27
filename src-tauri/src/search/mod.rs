use serde::{Deserialize, Serialize};
use async_trait::async_trait;
use thiserror::Error;

pub mod providers;
pub mod pipeline;
pub mod cache;
pub mod service;
pub mod keys;

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
    async fn search(&self, query: &str, options: &SearchOptions) -> Result<Vec<SearchResult>, SearchError>;
}
