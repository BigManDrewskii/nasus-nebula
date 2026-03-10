use reqwest::Client;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use futures::StreamExt;
use crate::commands::design::ChatMessage;

#[derive(Debug, Error)]
pub enum OpenRouterError {
    #[error("HTTP request failed: {0}")]
    RequestFailed(#[from] reqwest::Error),
    #[error("API error {status}: {message}")]
    ApiError { status: u16, message: String },
    #[error("Stream parse error: {0}")]
    ParseError(String),
}

#[derive(Debug, Serialize)]
struct CompletionRequest {
    model: String,
    messages: Vec<ChatMessage>,
    max_tokens: u32,
    stream: bool,
    temperature: f32,
}

#[derive(Debug, Deserialize)]
struct StreamChunk {
    choices: Vec<StreamChoice>,
}

#[derive(Debug, Deserialize)]
struct StreamChoice {
    delta: Delta,
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct Delta {
    content: Option<String>,
}

pub async fn stream_completion(
    api_key: &str,
    model: &str,
    messages: Vec<ChatMessage>,
    max_tokens: u32,
    on_token: impl Fn(String),
) -> Result<(), OpenRouterError> {
    let client = Client::new();

    let request_body = CompletionRequest {
        model: model.to_string(),
        messages,
        max_tokens,
        stream: true,
        temperature: 0.7,
    };

    let response = client
        .post("https://openrouter.ai/api/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .header("HTTP-Referer", "https://nasus.app")
        .header("X-Title", "Nasus Web Designer")
        .json(&request_body)
        .send()
        .await?;

    let status = response.status();
    if !status.is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(OpenRouterError::ApiError {
            status: status.as_u16(),
            message: error_text,
        });
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk?;
        let text = String::from_utf8_lossy(&chunk);
        buffer.push_str(&text);

        while let Some(newline_pos) = buffer.find("\n") {
            let line = buffer[..newline_pos].trim().to_string();
            buffer = buffer[newline_pos + 1..].to_string();

            if line.starts_with("data: ") {
                let data = &line["data: ".len()..];
                if data == "[DONE]" {
                    return Ok(());
                }
                if data.is_empty() {
                    continue;
                }
                match serde_json::from_str::<StreamChunk>(data) {
                    Ok(chunk) => {
                        for choice in chunk.choices {
                            if let Some(content) = choice.delta.content {
                                if !content.is_empty() {
                                    on_token(content);
                                }
                            }
                            if choice.finish_reason.is_some() {
                                return Ok(());
                            }
                        }
                    }
                    Err(_) => {
                        // Skip malformed chunks silently
                    }
                }
            }
        }
    }

    Ok(())
}
