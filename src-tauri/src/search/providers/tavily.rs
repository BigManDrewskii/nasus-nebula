use async_trait::async_trait;
use crate::search::{SearchProvider, SearchResult, SearchOptions, SearchError};
use reqwest::Client;
use serde_json::json;

pub struct TavilyProvider {
    pub api_key: String,
    pub client: Client,
}

#[async_trait]
impl SearchProvider for TavilyProvider {
    fn name(&self) -> &'static str {
        "tavily"
    }

    async fn search(&self, query: &str, options: &SearchOptions) -> Result<Vec<SearchResult>, SearchError> {
        let resp = self.client.post("https://api.tavily.com/search")
            .header("Content-Type", "application/json")
            .json(&json!({
                "api_key": &self.api_key,
                "query": query,
                "max_results": options.num_results,
                "search_depth": "basic"
            }))
            .send()
            .await
            .map_err(|e| SearchError::Network(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(SearchError::Api(format!("Tavily API returned status {}", resp.status())));
        }

        let json: serde_json::Value = resp.json().await.map_err(|e| SearchError::Api(e.to_string()))?;
        let mut results = Vec::new();

        if let Some(res_arr) = json["results"].as_array() {
            for item in res_arr {
                results.push(SearchResult {
                    title: item["title"].as_str().unwrap_or("").to_string(),
                    url: item["url"].as_str().unwrap_or("").to_string(),
                    snippet: item["content"].as_str().unwrap_or("").to_string(),
                    provider: "tavily".to_string(),
                    score: 0.0,
                });
            }
        }

        Ok(results)
    }
}
