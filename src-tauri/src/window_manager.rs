use std::sync::Mutex;
use std::time::{Duration, Instant};
use std::collections::HashMap;

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

use crate::window_config::{WindowConfig, WindowConfigStore};

/// 防抖保存状态
struct DebouncedSave {
    last_config: WindowConfig,
    last_update: Instant,
}

pub struct WindowManagerState {
    pub config_store: WindowConfigStore,
    pending_saves: Mutex<HashMap<String, DebouncedSave>>,
}

impl WindowManagerState {
    pub fn new(config_store: WindowConfigStore) -> Self {
        Self {
            config_store,
            pending_saves: Mutex::new(HashMap::new()),
        }
    }

    /// 记录窗口配置变更（防抖：只保留最新值，由 flush 时写入）
    pub fn record_config_change(&self, config: WindowConfig) {
        if let Ok(mut pending) = self.pending_saves.lock() {
            pending.insert(config.window_id.clone(), DebouncedSave {
                last_config: config,
                last_update: Instant::now(),
            });
        }
    }

    /// 将超过 debounce 时间的变更写入数据库
    pub fn flush_pending(&self, debounce: Duration) {
        let mut to_save = Vec::new();

        if let Ok(mut pending) = self.pending_saves.lock() {
            let now = Instant::now();
            let expired_keys: Vec<String> = pending.iter()
                .filter(|(_, v)| now.duration_since(v.last_update) >= debounce)
                .map(|(k, _)| k.clone())
                .collect();

            for key in expired_keys {
                if let Some(entry) = pending.remove(&key) {
                    to_save.push(entry.last_config);
                }
            }
        }

        for config in to_save {
            if let Err(e) = self.config_store.save(&config) {
                eprintln!("Failed to save window config for {}: {}", config.window_id, e);
            }
        }
    }

    /// 立即保存指定窗口的待处理配置（窗口关闭时调用）
    pub fn flush_window(&self, window_id: &str) {
        let config = if let Ok(mut pending) = self.pending_saves.lock() {
            pending.remove(window_id).map(|entry| entry.last_config)
        } else {
            None
        };

        if let Some(config) = config {
            if let Err(e) = self.config_store.save(&config) {
                eprintln!("Failed to flush window config for {}: {}", window_id, e);
            }
        }
    }
}

// ─── Tauri Commands ──────────────────────────────────────────────────────────

#[tauri::command]
pub async fn open_editor(app_handle: AppHandle, uid: String) -> Result<(), String> {
    let label = format!("editor_{}", uid);

    // 去重：如果窗口已存在则激活
    if let Some(existing) = app_handle.get_webview_window(&label) {
        existing.show().map_err(|e| e.to_string())?;
        existing.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }
    let state = app_handle.state::<WindowManagerState>();

    // 读取保存的配置
    let saved_config = state.config_store.get(&label).unwrap_or(None);

    let width = saved_config.as_ref().map(|c| c.width as f64).unwrap_or(290.0);
    let height = saved_config.as_ref().map(|c| c.height as f64).unwrap_or(320.0);
    let position = saved_config.as_ref().and_then(|c| {
        match (c.x, c.y) {
            (Some(x), Some(y)) => Some((x as f64, y as f64)),
            _ => None,
        }
    });
    let has_saved_config = saved_config.is_some();

    let dev_url = app_handle.config().build.dev_url.as_ref();
    let base_url = if dev_url.is_some() {
        "http://localhost:1421"
    } else {
        "tauri://localhost"
    };
    let url = format!("{}/#/editor?uid={}", base_url, uid);

    let mut builder = WebviewWindowBuilder::new(&app_handle, &label, WebviewUrl::External(url.parse().map_err(|e: url::ParseError| e.to_string())?))
        .title("I便笺")
        .inner_size(width, height)
        .min_inner_size(290.0, 48.0)
        .resizable(true)
        .decorations(false)
        .transparent(true)
        .skip_taskbar(false);

    if let Some((x, y)) = position {
        builder = builder.position(x, y);
    } else if !has_saved_config {
        builder = builder.center();
    }

    builder.build().map_err(|e| format!("Failed to create editor window: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn open_image_preview(app_handle: AppHandle, src: String, width: f64, height: f64) -> Result<(), String> {
    let label = format!("image_preview_{}", std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis());

    let clamped_width = width.max(500.0);
    let clamped_height = height.max(300.0);

    let dev_url = app_handle.config().build.dev_url.as_ref();
    let base_url = if dev_url.is_some() {
        "http://localhost:1421"
    } else {
        "tauri://localhost"
    };

    let url = format!("{}/#/image-preview?src={}", base_url, urlencoding::encode(&src));

    WebviewWindowBuilder::new(&app_handle, &label, WebviewUrl::External(url.parse().map_err(|e: url::ParseError| e.to_string())?))
        .title("图片预览")
        .inner_size(clamped_width, clamped_height)
        .min_inner_size(500.0, 300.0)
        .resizable(true)
        .center()
        .decorations(true)
        .build()
        .map_err(|e| format!("Failed to create image preview window: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn close_current_window(app_handle: AppHandle, label: String) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window(&label) {
        // 先立即保存配置
        let state = app_handle.state::<WindowManagerState>();
        state.flush_window(&label);

        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn set_always_on_top(app_handle: AppHandle, label: String, value: bool) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window(&label) {
        window.set_always_on_top(value).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn delete_window_config(app_handle: AppHandle, window_id: String) -> Result<(), String> {
    let state = app_handle.state::<WindowManagerState>();
    state.config_store.delete(&window_id)
}

// ─── Window Event Handler ────────────────────────────────────────────────────

/// 处理窗口事件，在 lib.rs 的 on_window_event 中调用
pub fn handle_window_event(window: &tauri::Window, event: &tauri::WindowEvent) {
    let app_handle = window.app_handle();
    let label = window.label().to_string();

    match event {
        tauri::WindowEvent::Resized(size) => {
            let state = app_handle.state::<WindowManagerState>();
            if let Ok(pos) = window.outer_position() {
                state.record_config_change(WindowConfig {
                    window_id: label,
                    width: size.width as i32,
                    height: size.height as i32,
                    x: Some(pos.x),
                    y: Some(pos.y),
                });
            }
        }
        tauri::WindowEvent::Moved(position) => {
            let state = app_handle.state::<WindowManagerState>();
            if let Ok(size) = window.outer_size() {
                state.record_config_change(WindowConfig {
                    window_id: label,
                    width: size.width as i32,
                    height: size.height as i32,
                    x: Some(position.x),
                    y: Some(position.y),
                });
            }
        }
        tauri::WindowEvent::CloseRequested { .. } => {
            let state = app_handle.state::<WindowManagerState>();

            // 立即保存配置
            state.flush_window(&label);

            if label == "main" {
                let has_editors = app_handle.webview_windows()
                    .keys()
                    .any(|k| k.starts_with("editor_"));

                if !has_editors {
                    // 无编辑器窗口，退出应用
                    app_handle.exit(0);
                }
                // 有编辑器窗口时允许主窗口正常关闭，最后一个编辑器关闭时会重建主窗口
            }
            // 编辑器窗口和其他窗口正常关闭
        }
        tauri::WindowEvent::Destroyed => {
            if label.starts_with("editor_") {
                let has_editors = app_handle.webview_windows()
                    .keys()
                    .any(|k| k.starts_with("editor_") && k != &label);

                if !has_editors && app_handle.get_webview_window("main").is_none() {
                    // 所有编辑器关闭且主窗口已关闭，重新创建主窗口
                    let state = app_handle.state::<WindowManagerState>();
                    let saved = state.config_store.get("main").unwrap_or(None);

                    let width = saved.as_ref().map(|c| c.width as f64).unwrap_or(400.0);
                    let height = saved.as_ref().map(|c| c.height as f64).unwrap_or(600.0);

                    let dev_url = app_handle.config().build.dev_url.as_ref();
                    let base_url = if dev_url.is_some() {
                        "http://localhost:1421"
                    } else {
                        "tauri://localhost"
                    };
                    let url = format!("{}/#/", base_url);

                    if let Ok(parsed_url) = url.parse() {
                        let mut builder = WebviewWindowBuilder::new(
                            app_handle,
                            "main",
                            WebviewUrl::External(parsed_url),
                        )
                        .title("I便笺")
                        .inner_size(width, height)
                        .min_inner_size(300.0, 400.0)
                        .resizable(true)
                        .decorations(false)
                        .transparent(true);

                        if let Some(ref config) = saved {
                            if let (Some(x), Some(y)) = (config.x, config.y) {
                                builder = builder.position(x as f64, y as f64);
                            }
                        } else {
                            builder = builder.center();
                        }

                        match builder.build() {
                            Ok(_) => {},
                            Err(e) => eprintln!("failed to recreate main window: {}", e),
                        }
                    }
                }
            }
        }
        _ => {}
    }
}

/// 启动防抖保存的后台定时器
pub fn start_debounce_timer(app_handle: AppHandle) {
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(Duration::from_secs(1));
            let state = app_handle.state::<WindowManagerState>();
            state.flush_pending(Duration::from_secs(1));
        }
    });
}
