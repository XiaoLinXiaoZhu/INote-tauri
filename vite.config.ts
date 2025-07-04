import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import fs from 'fs'

// 从环境变量读取超时设置，默认为2分钟
const CSS_TIMEOUT = parseInt(process.env.VITE_CSS_TIMEOUT || '120000', 10);

// 读取 Less 变量文件
const lessVariables = fs.readFileSync(resolve(__dirname, './src/less/variables.less'), 'utf-8');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  clearScreen: false,
  
  // tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1421,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // 移除了 electron adapter，现在直接使用 Tauri API
    },
  },
  
  // 添加 Node.js polyfill
  define: {
    global: 'globalThis',
  },
  
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        // 直接使用变量文件内容作为 additionalData
        additionalData: `${lessVariables}`,
        // 使用环境变量中的超时设置
        timeout: CSS_TIMEOUT,
        // 增加模块搜索路径
        paths: [resolve(__dirname, './src/less')],
      },
    },
  },
  
  // 增加 esbuild 配置，提高大型项目的构建性能
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
  
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      '@tauri-apps/api',
      'vue',
      'vue-router',
      'crypto-js',
    ],
  },
  
  // to make use of `TAURI_DEBUG` and other env variables
  // https://tauri.studio/v1/api/config#buildconfig.beforedevcommand
  envPrefix: ['VITE_', 'TAURI_'],
  
  // 确保在 Tauri 中使用相对路径
  base: './',
  
  build: {
    // Tauri supports es2021
    target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    // don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
    // 确保资源路径正确
    assetsDir: 'assets',
  },
})
