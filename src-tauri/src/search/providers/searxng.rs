use async_trait::async_trait;
use crate::search::{SearchProvider, SearchResult, SearchOptions, SearchError};
use reqwest::Client;

pub struct SearxngProvider {
    pub url: String,
    pub client: Client,
}

#[async_trait]
impl SearchProvider for SearxngProvider {
    fn name(&self) -> &'static str {
        "searxng"
    }

    async fn search(&self, query: &str, options: &SearchOptions) -> Result<Vec<SearchResult>, SearchError> {
        let resp = self.client.get(format!("{}/search", self.url.trim_end_matches('/')))
            .query(&[
                ("q", query),
                ("format", "json"),
                ("language", "en-US"),
            ])
            .send()
            .await
            .map_err(|e| SearchError::Network(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(SearchError::Api(format!("SearXNG returned status {}", resp.status())));
        }

        let json: serde_json::Value = resp.json().await.map_err(|e| SearchError::Api(e.to_string()))?;
        let mut results = Vec::new();

        if let Some(res_arr) = json["results"].as_array() {
            for item in res_arr.iter().take(options.num_results) {
                results.push(SearchResult {
                    title: item["title"].as_str().unwrap_or("").to_string(),
                    url: item["url"].as_str().unwrap_or("").to_string(),
                    snippet: item["content"].as_str().unwrap_or("").to_string(),
                    provider: "searxng".to_string(),
                    score: 0.0,
                });
            }
        }

        Ok(results)
    }
}
