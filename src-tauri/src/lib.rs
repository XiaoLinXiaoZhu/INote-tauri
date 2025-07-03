use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, WindowEvent};

#[derive(Default)]
struct AppState {
    window_count: Arc<Mutex<i32>>,
    main_window_closed: Arc<Mutex<bool>>,
}

#[tauri::command]
fn register_editor_window(app_handle: AppHandle, state: tauri::State<AppState>) {
    let mut count = state.window_count.lock().unwrap();
    *count += 1;
    println!("Editor window opened, total count: {}", *count);
}

#[tauri::command]
fn unregister_editor_window(app_handle: AppHandle, state: tauri::State<AppState>) {
    let mut count = state.window_count.lock().unwrap();
    *count -= 1;
    let main_closed = *state.main_window_closed.lock().unwrap();
    
    println!("Editor window closed, remaining count: {}", *count);
    
    // 如果没有编辑器窗口了，且主窗口已关闭，重新打开主窗口
    if *count == 0 && main_closed {
        println!("Reopening main window");
        if let Some(main_window) = app_handle.get_webview_window("main") {
            let _ = main_window.show();
            let _ = main_window.set_focus();
            // 重新加载页面以确保内容正确显示
            let _ = main_window.eval("window.location.reload()");
        } else {
            // 如果主窗口不存在，创建新的主窗口
            let _ = tauri::WebviewWindowBuilder::new(&app_handle, "main", tauri::WebviewUrl::App("/#".into()))
                .title("I便笺")
                .inner_size(400.0, 600.0)
                .min_inner_size(300.0, 400.0)
                .decorations(false)
                .build();
        }
        let mut main_closed = state.main_window_closed.lock().unwrap();
        *main_closed = false;
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let app_state = AppState::default();
  
  tauri::Builder::default()
    .manage(app_state)
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
      Ok(())
    })
    .on_window_event(|window, event| {
      let app_state = window.app_handle().state::<AppState>();
      
      match event {
        WindowEvent::CloseRequested { api, .. } => {
          if window.label() == "main" {
            let mut main_closed = app_state.main_window_closed.lock().unwrap();
            *main_closed = true;
            
            let count = *app_state.window_count.lock().unwrap();
            if count == 0 {
              // 如果没有编辑器窗口，允许退出
              window.app_handle().exit(0);
            } else {
              // 如果有编辑器窗口，阻止默认关闭行为并隐藏窗口
              api.prevent_close();
              let _ = window.hide();
            }
          }
        }
        _ => {}
      }
    })
    .invoke_handler(tauri::generate_handler![register_editor_window, unregister_editor_window])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
