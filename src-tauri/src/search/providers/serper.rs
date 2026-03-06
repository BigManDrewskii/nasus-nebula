use async_trait::async_trait;
use crate::search::{SearchProvider, SearchResult, SearchOptions, SearchError};
use reqwest::Client;
use serde_json::json;

pub struct SerperProvider {
    pub api_key: String,
    pub client: Client,
}

#[async_trait]
impl SearchProvider for SerperProvider {
    fn name(&self) -> &'static str {
        "serper"
    }

    async fn search(&self, query: &str, options: &SearchOptions) -> Result<Vec<SearchResult>, SearchError> {
        let resp = self.client.post("https://google.serper.dev/search")
            .header("X-API-KEY", &self.api_key)
            .header("Content-Type", "application/json")
            .json(&json!({
                "q": query,
                "num": options.num_results
            }))
            .send()
            .await
            .map_err(|e| SearchError::Network(e.to_string()))?;

        let json = crate::search::handle_response(resp, "Serper").await?;
        let mut results = Vec::new();

        if let Some(organic) = json["organic"].as_array() {
            for item in organic {
                results.push(SearchResult {
                    title: item["title"].as_str().unwrap_or("").to_string(),
                    url: item["link"].as_str().unwrap_or("").to_string(),
                    snippet: item["snippet"].as_str().unwrap_or("").to_string(),
                    provider: "serper".to_string(),
                    score: 0.0, // Will be calculated by RRF
                });
            }
        }

        Ok(results)
    }
}
