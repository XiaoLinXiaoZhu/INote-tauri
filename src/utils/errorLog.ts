import { writeTextFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import { dirname } from 'path-browserify';
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
  // 使用 Tauri 的 API 获取适当的目录路径
  const appDir = await dirname(await join('$APP', 'config'));
  return await join(appDir, constErrorLogPath);
};

export default async function(error: unknown, vm: ComponentPublicInstance | null, info: string): Promise<void> {
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
  } catch (e) {
    console.error('写入错误日志失败', e);
  }
}
