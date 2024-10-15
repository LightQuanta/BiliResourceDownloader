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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![create_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
