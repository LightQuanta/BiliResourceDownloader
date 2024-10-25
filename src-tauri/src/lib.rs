use base64::prelude::BASE64_STANDARD;
use base64::Engine;
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
use std::fs;

#[tauri::command]
fn create_dir(path: &str) -> &str {
    let result = fs::create_dir_all(path);
    if result.is_err() {
        return "error";
    }
    "ok"
}

#[tauri::command]
fn save_data_url<'a>(path: &'a str, data: &'a str) -> String {
    let base64 = data.split(',').collect::<Vec<&str>>()[1];
    let bytes = BASE64_STANDARD.decode(base64).unwrap_or(vec![]);

    let result = fs::write(path, bytes);
    if let Err(e) = result {
        return e.to_string();
    }
    "ok".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![create_dir, save_data_url])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
