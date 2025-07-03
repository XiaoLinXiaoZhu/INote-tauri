// 注意：此文件已从 Electron 迁移到 Tauri
// Tauri 中的自动更新功能使用不同的实现方式

import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const isDevelopment = import.meta.env.MODE === 'development';

/**
 * Tauri 自动更新器
 * 在 Tauri 中，更新功能需要在 tauri.conf.json 中配置 updater 插件
 */
export default async () => {
  // 在开发环境中跳过更新检查
  if (isDevelopment) {
    console.log('开发环境，跳过更新检查');
    return;
  }

  try {
    console.log('检查更新...');
    
    // 检查是否有新版本
    const update = await check();
    
    if (update?.available) {
      console.log('发现新版本:', update.version);
      
      // 询问用户是否要更新
      const shouldInstall = window.confirm(
        `发现新版本 ${update.version}\n\n更新内容：\n${update.body}\n\n是否立即更新？`
      );
      
      if (shouldInstall) {
        console.log('开始下载更新...');
        
        // 安装更新
        await update.downloadAndInstall();
        
        // 重启应用
        await relaunch();
      }
    } else {
      console.log('已是最新版本');
    }
  } catch (error) {
    console.error('更新检查失败:', error);
    
    // 在生产环境中，可以选择性地显示错误信息
    if (!isDevelopment) {
      window.alert('检查更新时出现错误，请手动检查是否有新版本可用。');
    }
  }
};

/**
 * 手动检查更新
 * 提供给用户手动触发更新检查的函数
 */
export const manualCheckUpdate = async () => {
  try {
    const update = await check();
    
    if (update?.available) {
      const shouldInstall = window.confirm(
        `发现新版本 ${update.version}\n\n更新内容：\n${update.body}\n\n是否立即更新？`
      );
      
      if (shouldInstall) {
        await update.downloadAndInstall();
        await relaunch();
      }
    } else {
      window.alert('当前已是最新版本');
    }
  } catch (error) {
    console.error('手动检查更新失败:', error);
    window.alert('检查更新失败，请稍后重试。');
  }
};
