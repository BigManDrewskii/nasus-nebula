// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::{Arc, Mutex};
use tauri::Manager;

pub mod commands;
pub mod ai;
pub mod utils;

#[derive(Default)]
pub struct AppState {
    pub deepseek_api_key: Arc<Mutex<String>>,
    pub openrouter_api_key: Arc<Mutex<String>>,
    pub default_model: Arc<Mutex<String>>,
    pub cancel_flag: Arc<Mutex<bool>>,
    pub max_tokens: Arc<Mutex<u32>>,
}

fn main() {
    // Load .env file if present
    let _ = dotenv::dotenv();

    let deepseek_key = std::env::var("DEEPSEEK_API_KEY").unwrap_or_default();
    let openrouter_key = std::env::var("OPENROUTER_API_KEY").unwrap_or_default();
    let default_model = std::env::var("DEFAULT_MODEL").unwrap_or_else(|_| "deepseek-chat".to_string());
    let max_tokens: u32 = std::env::var("MAX_TOKENS")
        .unwrap_or_else(|_| "8192".to_string())
        .parse()
        .unwrap_or(8192);

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            deepseek_api_key: Arc::new(Mutex::new(deepseek_key)),
            openrouter_api_key: Arc::new(Mutex::new(openrouter_key)),
            default_model: Arc::new(Mutex::new(default_model)),
            cancel_flag: Arc::new(Mutex::new(false)),
            max_tokens: Arc::new(Mutex::new(max_tokens)),
        })
        .invoke_handler(tauri::generate_handler![
            commands::design::generate_design,
            commands::design::refine_design,
            commands::design::cancel_generation,
            commands::ai::get_models,
            commands::ai::update_settings,
            commands::ai::get_settings,
            commands::export::export_project,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Nasus Web Designer");
}
