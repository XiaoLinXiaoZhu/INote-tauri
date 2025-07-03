#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_sql::Builder::default().build())
    .setup(|app| {
      #[cfg(debug_assertions)]
      {
        app.handle().plugin(tauri_plugin_log::Builder::default().build())?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
