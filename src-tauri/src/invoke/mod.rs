#[tauri::command]
pub fn open_webview_devtools(webview_window: tauri::WebviewWindow) {
  webview_window.open_devtools();
}