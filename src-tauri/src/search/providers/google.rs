use async_trait::async_trait;
use crate::search::{SearchProvider, SearchResult, SearchOptions, SearchError};
use reqwest::Client;

pub struct GoogleCSEProvider {
    pub api_key: String,
    pub cse_id: String,
    pub client: Client,
}

#[async_trait]
impl SearchProvider for GoogleCSEProvider {
    fn name(&self) -> &'static str {
        "google"
    }

    async fn search(&self, query: &str, options: &SearchOptions) -> Result<Vec<SearchResult>, SearchError> {
        let num_str = options.num_results.to_string();
        let resp = self.client.get("https://www.googleapis.com/customsearch/v1")
            .query(&[
                ("key", &self.api_key),
                ("cx", &self.cse_id),
                ("q", &query.to_string()),
                ("num", &num_str),
            ])
            .send()
            .await
            .map_err(|e| SearchError::Network(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(SearchError::Api(format!("Google API returned status {}", resp.status())));
        }

        let json: serde_json::Value = resp.json().await.map_err(|e| SearchError::Api(e.to_string()))?;
        let mut results = Vec::new();

        if let Some(items) = json["items"].as_array() {
            for item in items {
                results.push(SearchResult {
                    title: item["title"].as_str().unwrap_or("").to_string(),
                    url: item["link"].as_str().unwrap_or("").to_string(),
                    snippet: item["snippet"].as_str().unwrap_or("").to_string(),
                    provider: "google".to_string(),
                    score: 0.0,
                });
            }
        }

        Ok(results)
    }
}
