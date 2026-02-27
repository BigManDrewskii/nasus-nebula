use async_trait::async_trait;
use crate::search::{SearchProvider, SearchResult, SearchOptions, SearchError};
use reqwest::Client;
use urlencoding::encode;

pub struct DuckDuckGoProvider {
    pub client: Client,
}

#[async_trait]
impl SearchProvider for DuckDuckGoProvider {
    fn name(&self) -> &'static str {
        "ddg"
    }

    async fn search(&self, query: &str, options: &SearchOptions) -> Result<Vec<SearchResult>, SearchError> {
        let encoded = encode(query);
        let url = format!("https://api.duckduckgo.com/?q={}&format=json&no_redirect=1&no_html=1&skip_disambig=1", encoded);
        
        let resp = self.client.get(&url)
            .header("User-Agent", "Mozilla/5.0 (compatible; Nasus/1.0)")
            .send()
            .await
            .map_err(|e| SearchError::Network(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(SearchError::Api(format!("DuckDuckGo returned status {}", resp.status())));
        }

        let json: serde_json::Value = resp.json().await.map_err(|e| SearchError::Api(e.to_string()))?;
        let mut results = Vec::new();

        if let Some(abs) = json["AbstractText"].as_str() {
            if !abs.is_empty() {
                results.push(SearchResult {
                    title: json["Heading"].as_str().unwrap_or("Instant Answer").to_string(),
                    url: json["AbstractURL"].as_str().unwrap_or("").to_string(),
                    snippet: abs.to_string(),
                    provider: "ddg-instant".to_string(),
                    score: 1.0, // Give high score to instant answers
                });
            }
        }

        if let Some(related) = json["RelatedTopics"].as_array() {
            for r in related.iter().take(options.num_results) {
                if let (Some(text), Some(url)) = (r["Text"].as_str(), r["FirstURL"].as_str()) {
                    results.push(SearchResult {
                        title: text.split(" - ").next().unwrap_or(text).to_string(),
                        url: url.to_string(),
                        snippet: text.to_string(),
                        provider: "ddg".to_string(),
                        score: 0.0,
                    });
                }
            }
        }

        Ok(results)
    }
}
