// Prevents additional console window on Windows in release, DO NOT REMOVE!!
// 临时注释掉下面这行来在 release 版本中显示控制台进行调试
// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::{self, Write};

#[cfg(windows)]
extern "system" {
    fn AllocConsole() -> i32;
}

fn main() {
    #[cfg(windows)]
    unsafe {
        AllocConsole();
    }
    
    println!("🚀 Starting INote-tauri application...");
    io::stdout().flush().unwrap();
    
    app_lib::run();
}
