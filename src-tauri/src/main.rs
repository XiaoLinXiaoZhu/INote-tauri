// Windows 平台下隐藏控制台窗口
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::{self, Write};

// 注释掉控制台窗口相关代码
// #[cfg(windows)]
// extern "system" {
//     fn AllocConsole() -> i32;
// }

fn main() {
    // 注释掉自动分配控制台窗口的代码
    // #[cfg(windows)]
    // unsafe {
    //     AllocConsole();
    // }
    
    println!("🚀 Starting INote-tauri application...");
    io::stdout().flush().unwrap();
    
    app_lib::run();
}
