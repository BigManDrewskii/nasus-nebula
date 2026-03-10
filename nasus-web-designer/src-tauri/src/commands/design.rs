use tauri::{State, Window};
use crate::AppState;
use crate::ai::{deepseek, openrouter, prompts};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct TokenEvent {
    pub token: String,
}

fn get_max_tokens(state: &AppState) -> u32 {
    *state.max_tokens.lock().unwrap()
}

fn build_design_messages(prompt: &str) -> Vec<ChatMessage> {
    vec![
        ChatMessage {
            role: "system".to_string(),
            content: prompts::WEB_DESIGNER_SYSTEM_PROMPT.to_string(),
        },
        ChatMessage {
            role: "user".to_string(),
            content: prompt.to_string(),
        },
    ]
}

fn build_refine_messages(original_code: &str, instruction: &str) -> Vec<ChatMessage> {
    vec![
        ChatMessage {
            role: "system".to_string(),
            content: prompts::REFINER_SYSTEM_PROMPT.to_string(),
        },
        ChatMessage {
            role: "user".to_string(),
            content: format!(
                "Here is the existing code:\n\n```html\n{}\n```\n\nInstruction: {}",
                original_code, instruction
            ),
        },
    ]
}

#[tauri::command]
pub async fn generate_design(
    prompt: String,
    model: String,
    stream: bool,
    state: State<'_, AppState>,
    window: Window,
) -> Result<String, String> {
    // Reset cancel flag
    *state.cancel_flag.lock().unwrap() = false;

    let messages = build_design_messages(&prompt);
    let max_tokens = get_max_tokens(&state);
    let mut accumulated = String::new();

    let cancel_flag = state.cancel_flag.clone();
    let window_clone = window.clone();

    let on_token = move |token: String| {
        if *cancel_flag.lock().unwrap() {
            return;
        }
        let _ = window_clone.emit("ai-token", TokenEvent { token: token.clone() });
        accumulated.push_str(&token);
    };

    if model.starts_with("deepseek") {
        let api_key = state.deepseek_api_key.lock().unwrap().clone();
        if api_key.is_empty() {
            return Err("DeepSeek API key is not configured. Please add it in Settings.".to_string());
        }
        let mut result = String::new();
        let cancel = state.cancel_flag.clone();
        let win = window.clone();
        deepseek::stream_completion(&api_key, &model, messages, max_tokens, |tok| {
            if !*cancel.lock().unwrap() {
                let _ = win.emit("ai-token", TokenEvent { token: tok.clone() });
                result.push_str(&tok);
            }
        })
        .await
        .map_err(|e| e.to_string())?;
        Ok(result)
    } else {
        let api_key = state.openrouter_api_key.lock().unwrap().clone();
        if api_key.is_empty() {
            return Err("OpenRouter API key is not configured. Please add it in Settings.".to_string());
        }
        let mut result = String::new();
        let cancel = state.cancel_flag.clone();
        let win = window.clone();
        openrouter::stream_completion(&api_key, &model, messages, max_tokens, |tok| {
            if !*cancel.lock().unwrap() {
                let _ = win.emit("ai-token", TokenEvent { token: tok.clone() });
                result.push_str(&tok);
            }
        })
        .await
        .map_err(|e| e.to_string())?;
        Ok(result)
    }
}

#[tauri::command]
pub async fn refine_design(
    original_code: String,
    instruction: String,
    model: String,
    state: State<'_, AppState>,
    window: Window,
) -> Result<String, String> {
    // Reset cancel flag
    *state.cancel_flag.lock().unwrap() = false;

    let messages = build_refine_messages(&original_code, &instruction);
    let max_tokens = get_max_tokens(&state);

    if model.starts_with("deepseek") {
        let api_key = state.deepseek_api_key.lock().unwrap().clone();
        if api_key.is_empty() {
            return Err("DeepSeek API key is not configured. Please add it in Settings.".to_string());
        }
        let mut result = String::new();
        let cancel = state.cancel_flag.clone();
        let win = window.clone();
        deepseek::stream_completion(&api_key, &model, messages, max_tokens, |tok| {
            if !*cancel.lock().unwrap() {
                let _ = win.emit("ai-token", TokenEvent { token: tok.clone() });
                result.push_str(&tok);
            }
        })
        .await
        .map_err(|e| e.to_string())?;
        Ok(result)
    } else {
        let api_key = state.openrouter_api_key.lock().unwrap().clone();
        if api_key.is_empty() {
            return Err("OpenRouter API key is not configured. Please add it in Settings.".to_string());
        }
        let mut result = String::new();
        let cancel = state.cancel_flag.clone();
        let win = window.clone();
        openrouter::stream_completion(&api_key, &model, messages, max_tokens, |tok| {
            if !*cancel.lock().unwrap() {
                let _ = win.emit("ai-token", TokenEvent { token: tok.clone() });
                result.push_str(&tok);
            }
        })
        .await
        .map_err(|e| e.to_string())?;
        Ok(result)
    }
}

#[tauri::command]
pub async fn cancel_generation(state: State<'_, AppState>) -> Result<(), String> {
    *state.cancel_flag.lock().unwrap() = true;
    Ok(())
}
