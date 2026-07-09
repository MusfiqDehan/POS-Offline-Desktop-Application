#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use tauri::{image::Image, Manager};

    // 128x128 is reliable for GTK/Wayland dock icons; 512x512 can fail silently on Linux.
    const APP_ICON: Image<'static> = tauri::include_image!("icons/128x128.png");

    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            for window in app.webview_windows().values() {
                let _ = window.set_icon(APP_ICON.clone());
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
