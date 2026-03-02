use async_trait::async_trait;
use crate::search::{SearchProvider, SearchResult, SearchOptions, SearchError};
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ExaRequest {
    query: String,
    #[serde(rename = "numResults")]
    num_results: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    r#type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ExaResponse {
    results: Vec<ExaResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ExaResult {
    id: String,
    title: String,
    url: String,
    #[serde(default, rename = "publishedDate")]
    published_date: Option<String>,
    #[serde(default)]
    author: Option<String>,
    #[serde(default)]
    score: Option<f32>,
    #[serde(default)]
    highlights: Vec<String>,
}

pub struct ExaProvider {
    pub api_key: String,
    pub client: Client,
}

#[async_trait]
impl SearchProvider for ExaProvider {
    fn name(&self) -> &'static str {
        "exa"
    }

    async fn search(&self, query: &str, options: &SearchOptions) -> Result<Vec<SearchResult>, SearchError> {
        println!("[Exa] Searching: query='{}', num_results={}, key_length={}",
                 query, options.num_results, self.api_key.len());

        let req_body = ExaRequest {
            query: query.to_string(),
            num_results: options.num_results,
            r#type: Some("auto".to_string()),
        };

        let req_json = serde_json::to_string(&req_body).unwrap_or_else(|_| "invalid".to_string());
        println!("[Exa] Request body: {}", req_json);

        let resp = self.client
            .post("https://api.exa.ai/search")
            .header("x-api-key", &self.api_key)
            .header("Content-Type", "application/json")
            .json(&req_body)
            .send()
            .await
            .map_err(|e| {
                println!("[Exa] Network error: {}", e);
                SearchError::Network(e.to_string())
            })?;

        let status = resp.status();
        println!("[Exa] Response status: {}", status);

        if !status.is_success() {
            let body = resp.text().await.unwrap_or_else(|_| "unable to read body".to_string());
            println!("[Exa] Error response body: {}", body);
            return Err(SearchError::Api(format!("Exa API returned status {}: {}", status, body)));
        }

        // Log raw response body for debugging
        let raw_body = resp.text().await.unwrap_or_else(|_| "unable to read body".to_string());
        println!("[Exa] Raw response body: {}", raw_body);

        let json: ExaResponse = serde_json::from_str(&raw_body).map_err(|e| {
            println!("[Exa] JSON parse error: {}", e);
            println!("[Exa] Failed to parse body of length {}", raw_body.len());
            SearchError::Api(format!("JSON parse error: {}", e))
        })?;

        println!("[Exa] Got {} results from API", json.results.len());

        let mut results = Vec::new();

        for item in json.results {
            results.push(SearchResult {
                title: item.title,
                url: item.url,
                snippet: if item.highlights.is_empty() {
                    String::new()
                } else {
                    item.highlights.join(" ")
                },
                provider: "exa".to_string(),
                score: item.score.unwrap_or(0.0),
            });
        }

        Ok(results)
    }
}
