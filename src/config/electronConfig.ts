// 注意：此文件已从 Electron 迁移到 Tauri
// 某些功能在 Tauri 中的实现方式不同

const isDevelopment = import.meta.env.MODE !== 'production';

/**
 * Tauri 应用配置
 * 注意：Tauri 中的任务栏和系统集成方式与 Electron 不同
 */

// TODO: 在 Tauri 中重新实现系统任务栏集成
// Tauri 使用不同的方式处理系统集成功能

/**
 * 禁用的快捷键配置
 * 在 Tauri 中，快捷键处理方式不同，需要在 Rust 端配置
 */
export const disabledKeys = () => {
  const devShortcuts = ['F11', 'Ctrl+R', 'Ctrl+SHIFT+R'];
  const shortcuts = ['Ctrl+N', 'SHIFT+F10', 'Ctrl+SHIFT+I'];
  const exportKeys = isDevelopment ? shortcuts : [...devShortcuts, ...shortcuts];
  return exportKeys;
};

/**
 * Tauri 窗口配置
 * 注意：在 Tauri 中，窗口配置主要在 tauri.conf.json 中设置
 */
export interface TauriWindowOptions {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  resizable: boolean;
  transparent?: boolean;
  decorations?: boolean;
}

export const getWindowOptions = (type?: 'editor'): TauriWindowOptions => {
  const editorWindowOptions = {
    width: isDevelopment ? 950 : 290,
    height: isDevelopment ? 600 : 320,
    minWidth: 290,
    minHeight: 48,
    resizable: true,
    decorations: false,
    transparent: true
  };

  const mainWindowOptions = {
    width: isDevelopment ? 950 : 350,
    height: isDevelopment ? 600 : 600,
    minWidth: 320,
    minHeight: 48,
    resizable: isDevelopment ? true : false,
    decorations: false,
    transparent: true
  };

  return type === 'editor' ? editorWindowOptions : mainWindowOptions;
};

/**
 * 应用 URL 配置
 * 在 Tauri 中，开发环境和生产环境的 URL 处理方式不同
 */
export const getAppUrl = () => {
  return isDevelopment ? 'http://localhost:1421' : 'tauri://localhost';
};

// 导出开发环境标识
export { isDevelopment };
