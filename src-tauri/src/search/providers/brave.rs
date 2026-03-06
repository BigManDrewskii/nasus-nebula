use async_trait::async_trait;
use crate::search::{SearchProvider, SearchResult, SearchOptions, SearchError};
use reqwest::Client;

pub struct BraveProvider {
    pub api_key: String,
    pub client: Client,
}

#[async_trait]
impl SearchProvider for BraveProvider {
    fn name(&self) -> &'static str {
        "brave"
    }

    async fn search(&self, query: &str, options: &SearchOptions) -> Result<Vec<SearchResult>, SearchError> {
        let count_str = options.num_results.to_string();
        let resp = self.client.get("https://api.search.brave.com/res/v1/web/search")
            .header("X-Subscription-Token", &self.api_key)
            .header("Accept", "application/json")
            .query(&[
                ("q", query),
                ("count", &count_str),
            ])
            .send()
            .await
            .map_err(|e| SearchError::Network(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(SearchError::Api(format!("Brave API returned status {}", resp.status())));
        }

        let json: serde_json::Value = resp.json().await.map_err(|e| SearchError::Api(e.to_string()))?;
        let mut results = Vec::new();

        if let Some(web) = json["web"]["results"].as_array() {
            for item in web {
                results.push(SearchResult {
                    title: item["title"].as_str().unwrap_or("").to_string(),
                    url: item["url"].as_str().unwrap_or("").to_string(),
                    snippet: item["description"].as_str().unwrap_or("").to_string(),
                    provider: "brave".to_string(),
                    score: 0.0,
                });
            }
        }

        Ok(results)
    }
}
