import { writeTextFile } from '@tauri-apps/plugin-fs';
import { join, appDataDir } from '@tauri-apps/api/path';
import { ComponentPublicInstance } from 'vue';
import { getVersion } from '@tauri-apps/api/app';
import { constErrorLogPath } from '@/config';

// 格式化错误堆栈
export function formatComponentName(vm: ComponentPublicInstance | null): string {
  if (vm === null) return '';
  if (vm.$root === vm) return 'root';

  const options = vm.$options;
  const name = options.name || options.__file || options._componentTag;
  return name ? `component: <${name}>` : 'anonymous component';
}

export function formatStack(stack: string): string {
  const regex = /at .* \(.*\/([^\/]+\/[^\/]+)\)/g;
  const newStack = stack.split('\n').map(v => {
    return v.replace(regex, 'at $1');
  });
  
  // 转换string
  return newStack.join('\n    ');
}

// 在 Tauri 中获取错误日志路径
export const getErrorLogPath = async () => {
  try {
    // 使用 Tauri 的 appDataDir API 获取应用数据目录
    const appDir = await appDataDir();
    return await join(appDir, constErrorLogPath.replace(/^\//, ''));
  } catch (error) {
    // 如果获取路径失败，返回一个备用路径
    console.warn('Failed to get app data dir, using fallback:', error);
    return constErrorLogPath.replace(/^\//, '');
  }
};

export default async function(error: unknown, vm: ComponentPublicInstance | null, info: string): Promise<void> {
  try {
    const { message, stack } = error as Error;
    
    // 替换 process.versions 为 Tauri 的版本信息
    const appVersion = await getVersion();
    const { outerWidth, outerHeight, innerWidth, innerHeight } = window;
    const { width, height } = window.screen;

    // 报错信息
    const errorInfo = {
      errorInfo: info,
      errorMessage: message,
      componentName: formatComponentName(vm),
      stack: formatStack(stack || ''),
      browserInfo: {
        appVersion,
        userAgent: navigator.userAgent,
        winSize: {
          outer: [outerWidth, outerHeight],
          inner: [innerWidth, innerHeight],
          screen: [width, height]
        },
        location: window.location.href
      },
      date: new Date().toLocaleString()
    };

    const errorMessage = JSON.stringify(errorInfo, null, 4);
    console.error(errorMessage);
    
    try {
      // 仅在生产环境下写入日志文件
      const isDevelopment = import.meta.env.MODE !== 'production';
      if (!isDevelopment) {
        const errorLogPath = await getErrorLogPath();
        await writeTextFile(errorLogPath, errorMessage, { append: true });
      }
    } catch (fileError) {
      console.error('写入错误日志失败', fileError);
      // 不要重新抛出这个错误，避免影响应用启动
    }
  } catch (generalError) {
    // 如果整个错误处理过程都失败了，至少输出到控制台
    console.error('Error handler itself failed:', generalError);
    console.error('Original error:', error);
  }
}
