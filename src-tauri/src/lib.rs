mod window_config;
mod window_manager;

use std::path::PathBuf;
use tauri::Manager;

use window_config::WindowConfigStore;
use window_manager::WindowManagerState;

fn get_db_path(app: &tauri::App) -> Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    // 确保目录存在
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;

    Ok(app_data_dir.join("i-notes.db"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                app.handle().plugin(tauri_plugin_log::Builder::default().build())?;
            }

            // 初始化窗口管理器
            let db_path = get_db_path(app)?;
            let config_store = WindowConfigStore::new(db_path)
                .map_err(|e| Box::<dyn std::error::Error>::from(e))?;
            let wm_state = WindowManagerState::new(config_store);
            app.manage(wm_state);


            // 为主窗口应用保存的配置
            if let Some(main_window) = app.get_webview_window("main") {
                let state = app.state::<WindowManagerState>();
                if let Ok(Some(config)) = state.config_store.get("main") {
                    let _ = main_window.set_size(tauri::LogicalSize::new((config.width as f64).max(300.0), (config.height as f64).max(400.0)));
                    if let (Some(x), Some(y)) = (config.x, config.y) {
                        let _ = main_window.set_position(tauri::LogicalPosition::new(x as f64, y as f64));
                    }
                }
            }


            // 启动防抖保存定时器
            window_manager::start_debounce_timer(app.handle().clone());

            Ok(())
        })
        .on_window_event(|window, event| {
            window_manager::handle_window_event(window, event);
        })
        .invoke_handler(tauri::generate_handler![
            window_manager::open_editor,
            window_manager::open_image_preview,
            window_manager::close_current_window,
            window_manager::set_always_on_top,
            window_manager::delete_window_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
