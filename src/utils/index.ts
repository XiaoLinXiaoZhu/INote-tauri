import { winURL, isDevelopment } from '@/config';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { enc, AES, mode, pad } from 'crypto-js';

type FunctionalControl = (this: any, fn: any, delay?: number) => (...args: any) => void;
type DebounceEvent = FunctionalControl;
type ThrottleEvent = FunctionalControl;

// 防抖函数
export const debounce: DebounceEvent = function(fn, delay = 1000) {
  let timer: number | null = null;
  return (...args: any) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

// 节流函数
export const throttle: ThrottleEvent = function(fn, delay = 500) {
  let flag = true;
  return (...args: any) => {
    if (!flag) return;
    flag = false;
    setTimeout(() => {
      fn.apply(this, args);
      flag = true;
    }, delay);
  };
};

// 创建窗口
export const createBrowserWindow = (
  bwopt = {} as any,
  url = '/',
  devTools = false
): any => {
  // 在 Tauri 中使用 WebviewWindow
  const windowLabel = 'window_' + Date.now();
  console.log('创建窗口:', windowLabel, 'URL:', url, '配置:', bwopt);
  
  try {
    const webview = new WebviewWindow(windowLabel, {
      url: `${winURL}/#${url}`,
      width: bwopt.width || 800,
      height: bwopt.height || 600,
      resizable: bwopt.resizable !== false,
      title: bwopt.title || 'iNotes',
      center: true,
      skipTaskbar: bwopt.skipTaskbar || false,
      alwaysOnTop: bwopt.alwaysOnTop || false,
      decorations: bwopt.decorations !== false,
      transparent: bwopt.transparent || false
    });
    
    console.log('窗口创建成功:', windowLabel);
    
    if (isDevelopment && devTools) {
      console.log('开发模式下创建窗口:', windowLabel);
    }
    
    // 返回一个模拟的 BrowserWindow 对象
    return {
      loadURL: (url: string) => console.log('loadURL called with:', url),
      on: (event: string, callback: () => void) => {
        if (event === 'closed') {
          webview.once('tauri://close-requested', callback);
        }
      },
      close: () => webview.close(),
      show: () => webview.show(),
      hide: () => webview.hide(),
      webContents: {
        openDevTools: () => console.log('DevTools not available in Tauri')
      }
    } as any;
  } catch (error) {
    console.error('创建窗口失败:', error);
    return null;
  }
};

// 过渡关闭窗口
export const transitCloseWindow = async (): Promise<void> => {
  document.querySelector('#app')?.classList.remove('app-show');
  document.querySelector('#app')?.classList.add('app-hide');
  // 在 Tauri 中关闭当前窗口
  try {
    const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
    setTimeout(() => {
      getCurrentWebviewWindow().close();
    }, 300); // 等待动画完成
  } catch (error) {
    console.error('关闭窗口失败:', error);
  }
};

// uuid
export const uuid = (): string => {
  const S4 = () => {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
};

export const symbolKey = Symbol('key');
export const symbolIv = Symbol('iv');
export const symbolEncrypt = Symbol('encrypt');
export const symbolDecode = Symbol('decode');
export const algorithm = {
  [symbolKey]: enc.Utf8.parse('1234123412ABCDEF'), // 十六位十六进制数作为密钥
  [symbolIv]: enc.Utf8.parse('ABCDEF1234123412'), // 十六位十六进制数作为密钥偏移量
  // 加密
  [symbolEncrypt]: (word: string) => {
    const srcs = enc.Utf8.parse(word);
    const encrypted = AES.encrypt(srcs, algorithm[symbolKey], {
      iv: algorithm[symbolIv],
      mode: mode.CBC,
      padding: pad.Pkcs7
    });
    return encrypted.ciphertext.toString().toUpperCase();
  },
  // 解密
  [symbolDecode]: (word: string) => {
    const encryptedHexStr = enc.Hex.parse(word);
    const srcs = enc.Base64.stringify(encryptedHexStr);
    const decrypt = AES.decrypt(srcs, algorithm[symbolKey], {
      iv: algorithm[symbolIv],
      mode: mode.CBC,
      padding: pad.Pkcs7
    });
    const decryptedStr = decrypt.toString(enc.Utf8);
    return decryptedStr.toString();
  }
};

export interface TwiceHandle {
  keydownInterval: ReturnType<typeof setInterval> | null;
  intervalCount: number;
  keydownCount: number;
  start: (fn: () => void) => void;
}

/**
 * 在300毫秒内触发2次事件的callback
 */
export const twiceHandle: TwiceHandle = {
  keydownInterval: null,
  intervalCount: 0,
  keydownCount: 0,
  start(fn) {
    if (!this.keydownInterval) {
      this.intervalCount += 1;
      this.keydownInterval = setInterval(() => {
        if (this.intervalCount > 5) {
          if (this.keydownInterval) {
            clearInterval(this.keydownInterval);
            this.keydownInterval = null;
          }
          this.intervalCount = 0;
          this.keydownCount = 0;
        } else {
          this.intervalCount += 1;
          if (this.keydownCount >= 2) {
            if (this.keydownInterval) {
              clearInterval(this.keydownInterval);
              this.keydownInterval = null;
            }
            this.intervalCount = 0;
            this.keydownCount = 0;
            fn();
          }
        }
      }, 50);
    }

    if (this.keydownCount <= 2) {
      this.keydownCount += 1;
    }
  }
};

export const openImageAsNewWindow = async (img: Element) => {
  const devicePixelRatio = window.devicePixelRatio;
  const { availWidth, availHeight } = window.screen;
  const naturalWidth = (img as HTMLImageElement).naturalWidth / devicePixelRatio;
  const naturalHeight = (img as HTMLImageElement).naturalHeight / devicePixelRatio;
  const winWidth = naturalWidth < 500 ? 500 : naturalWidth;
  const winHeight = naturalHeight < 300 ? 300 : naturalHeight;
  const winOptWidth = winWidth > availWidth ? availWidth : winWidth;
  const winOptHeight = winHeight > availHeight ? availHeight : winHeight;

  // 使用 Tauri 的 WebviewWindow 创建图片预览窗口
  const windowLabel = 'image_preview_' + Date.now();
  try {
    const webview = new WebviewWindow(windowLabel, {
      url: `${winURL}/#/image-preview?src=${encodeURIComponent((img as HTMLImageElement).src)}`,
      width: winOptWidth,
      height: winOptHeight,
      minWidth: 500,
      minHeight: 300,
      resizable: true,
      title: '图片预览',
      center: true,
      decorations: true
    });
    
    return webview;
  } catch (error) {
    console.error('创建图片预览窗口失败:', error);
    return null;
  }
};
