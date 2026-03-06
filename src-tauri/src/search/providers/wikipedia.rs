use async_trait::async_trait;
use crate::search::{SearchProvider, SearchResult, SearchOptions, SearchError};
use reqwest::Client;

pub struct WikipediaProvider {
    pub client: Client,
}

#[async_trait]
impl SearchProvider for WikipediaProvider {
    fn name(&self) -> &'static str {
        "wikipedia"
    }

    async fn search(&self, query: &str, options: &SearchOptions) -> Result<Vec<SearchResult>, SearchError> {
        let limit_str = options.num_results.to_string();
        // First search for titles
        let resp = self.client.get("https://en.wikipedia.org/w/api.php")
            .query(&[
                ("action", "query"),
                ("list", "search"),
                ("srsearch", query),
                ("format", "json"),
                ("srlimit", &limit_str),
            ])
            .send()
            .await
            .map_err(|e| SearchError::Network(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(SearchError::Api(format!("Wikipedia API returned status {}", resp.status())));
        }

        let json: serde_json::Value = resp.json().await.map_err(|e| SearchError::Api(e.to_string()))?;
        let mut results = Vec::new();

        if let Some(sr_arr) = json["query"]["search"].as_array() {
            for item in sr_arr {
                let title = item["title"].as_str().unwrap_or("");
                let snippet = item["snippet"].as_str().unwrap_or("").replace("<span class=\"searchmatch\">", "").replace("</span>", "");
                let page_id = item["pageid"].as_u64().unwrap_or(0);
                
                results.push(SearchResult {
                    title: title.to_string(),
                    url: format!("https://en.wikipedia.org/?curid={}", page_id),
                    snippet,
                    provider: "wikipedia".to_string(),
                    score: 0.0,
                });
            }
        }

        Ok(results)
    }
}
