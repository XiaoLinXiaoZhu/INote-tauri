// Tauri 适配层 - 用于替换 Electron API
// 这个文件提供了与原 Electron API 兼容的接口，但使用 Tauri 的实现

import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { open } from '@tauri-apps/plugin-shell';
import { 
  exists, 
  mkdir, 
  writeTextFile, 
  readDir, 
  remove,
  BaseDirectory
} from '@tauri-apps/plugin-fs';
import { join as tauriJoin, dirname as tauriDirname, appDataDir } from '@tauri-apps/api/path';

/**
 * 模拟 Node.js path 模块
 */
export const join = async (...paths: string[]) => {
  return await tauriJoin(...paths);
};

export const dirname = (path: string) => {
  return tauriDirname(path);
};

/**
 * 模拟 fs-extra 文件系统操作
 */
export const existsSync = async (path: string) => {
  try {
    return await exists(path);
  } catch {
    return false;
  }
};

export const mkdirSync = async (path: string) => {
  try {
    await mkdir(path, { recursive: true });
  } catch (error) {
    console.error('创建目录失败:', error);
  }
};

export const writeFile = async (path: string, data: Uint8Array | string) => {
  try {
    if (typeof data === 'string') {
      await writeTextFile(path, data);
    } else {
      // 对于二进制数据，转换为 base64 字符串写入
      const base64String = btoa(String.fromCharCode(...data));
      await writeTextFile(path, base64String);
    }
  } catch (error) {
    console.error('写入文件失败:', error);
    throw error;
  }
};

export const readdirSync = async (path: string) => {
  try {
    const entries = await readDir(path);
    return entries.map(entry => entry.name);
  } catch (error) {
    console.error('读取目录失败:', error);
    return [];
  }
};

export const unlinkSync = async (path: string) => {
  try {
    await remove(path);
  } catch (error) {
    console.error('删除文件失败:', error);
  }
};

export const rmdirSync = async (path: string) => {
  try {
    await remove(path, { recursive: true });
  } catch (error) {
    console.error('删除目录失败:', error);
  }
};

/**
 * 模拟 Electron 的 remote 对象
 */
export const remote = {
  // 在 Tauri 中，我们使用 getCurrentWindow() 来获取当前窗口
  getCurrentWindow: () => getCurrentWindow(),
  
  // 模拟 remote.app
  app: {
    getPath: async (name: string) => {
      // 在 Tauri 中，使用 appDataDir 获取应用数据目录
      try {
        const appDir = await appDataDir();
        return appDir;
      } catch {
        return `/tmp/${name}`;
      }
    },
    quit: () => {
      // 使用 Tauri 的方式退出应用
      invoke('exit_app');
    }
  },
  
  // 模拟 BrowserWindow
  BrowserWindow: class MockBrowserWindow {
    constructor(options: any) {
      console.warn('BrowserWindow 在 Tauri 中的实现方式不同，此为模拟实现');
    }
    
    loadURL(url: string) {
      console.warn('在 Tauri 中，使用不同的方式加载 URL:', url);
    }
    
    show() {
      console.warn('在 Tauri 中，窗口显示通过不同的 API 实现');
    }
    
    close() {
      getCurrentWindow().close();
    }
  },

  // 模拟 ipcMain
  ipcMain: {
    on: (channel: string, listener: (...args: any[]) => void) => {
      console.warn('ipcMain.on 在 Tauri 中使用事件系统实现:', channel);
    },
    
    removeListener: (channel: string, listener: (...args: any[]) => void) => {
      console.warn('ipcMain.removeListener 在 Tauri 中使用事件系统实现:', channel);
    }
  }
};

/**
 * 模拟 Electron 的 ipcRenderer
 */
export const ipcRenderer = {
  send: (channel: string, ...args: any[]) => {
    console.warn('IPC 在 Tauri 中使用 invoke 函数实现:', channel, args);
    // 在 Tauri 中，使用 invoke 来调用后端命令
    invoke(channel, { args });
  },
  
  on: (channel: string, listener: (...args: any[]) => void) => {
    console.warn('IPC 监听在 Tauri 中使用事件系统实现:', channel);
    // 在 Tauri 中，使用事件监听器
  },
  
  once: (channel: string, listener: (...args: any[]) => void) => {
    console.warn('IPC once 在 Tauri 中使用事件系统实现:', channel);
  },
  
  removeListener: (channel: string, listener: (...args: any[]) => void) => {
    console.warn('移除 IPC 监听器在 Tauri 中的实现方式不同:', channel);
  }
};

/**
 * 模拟 Electron 的 shell 对象
 */
export const shell = {
  openExternal: (url: string) => {
    // 使用 Tauri 的 shell 插件打开外部链接
    return open(url);
  },
  
  openPath: (path: string) => {
    // 在 Tauri 中打开文件路径
    return open(path);
  },

  showItemInFolder: (path: string) => {
    // 在 Tauri 中显示文件在文件夹中的位置
    return open(path);
  }
};

/**
 * 模拟 Electron 的 app 对象
 */
export const app = {
  getPath: (name: string) => {
    // 在 Tauri 中，路径处理方式不同
    console.warn('app.getPath 在 Tauri 中需要使用不同的 API:', name);
    return `/tmp/${name}`;
  },
  
  quit: () => {
    // 使用 Tauri 的方式退出应用
    invoke('exit_app');
  },
  
  // 模拟事件监听
  on: (event: string, listener: (...args: any[]) => void) => {
    console.warn('app 事件监听在 Tauri 中使用不同的方式:', event);
  }
};

/**
 * 模拟 BrowserWindow 类
 */
export class BrowserWindow {
  constructor(options: any) {
    console.warn('BrowserWindow 在 Tauri 中的实现方式不同，此为模拟实现');
    // 在 Tauri 中，窗口管理通过不同的 API 实现
  }
  
  loadURL(url: string) {
    console.warn('在 Tauri 中，使用不同的方式加载 URL:', url);
  }
  
  show() {
    console.warn('在 Tauri 中，窗口显示通过不同的 API 实现');
  }
  
  close() {
    getCurrentWindow().close();
  }
}

// 导出所有模拟的 Electron API
export default {
  remote,
  ipcRenderer,
  shell,
  app,
  BrowserWindow,
  existsSync,
  mkdirSync,
  writeFile,
  readdirSync,
  unlinkSync,
  rmdirSync,
  join,
  dirname
};
