@echo off
echo 正在启动 Tauri 开发服务器 (优化版本)...
set NODE_OPTIONS=--max-old-space-size=8192
set VITE_CSS_TIMEOUT=120000
cd /d "%~dp0"
call bun tauri dev
pause
