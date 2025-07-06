import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import outputErrorLog from '@/utils/errorLog';
import { noteService } from '@/service/tauriNoteService';
import { windowConfigService } from '@/service/windowConfigService';

console.log('🚀 Starting Vue application...');

// 初始化服务
const initializeServices = async () => {
  console.log('🚀 Initializing services...');
  
  // 初始化数据库服务
  console.log('🚀 Initializing database service...');
  await noteService.initialize();
  console.log('✅ Database service initialized successfully');
  
  // 初始化窗口配置服务
  console.log('🚀 Initializing window config service...');
  await windowConfigService.initialize();
  console.log('✅ Window config service initialized successfully');
  
  // 为主窗口应用配置
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    try {
      const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
      const currentWindow = getCurrentWebviewWindow();
      
      // 应用保存的窗口配置
      await windowConfigService.applyWindowConfig(currentWindow, 'main', 400, 600);
      
      // 开始跟踪窗口变化
      await windowConfigService.startWindowConfigTracking(currentWindow, 'main');
      
      console.log('✅ Main window config applied and tracking started');
    } catch (error) {
      console.error('❌ Failed to setup main window config:', error);
    }
  }
};

initializeServices()
  .catch(error => {
    console.error('❌ Failed to initialize services:', error);
  });

console.log('🚀 Creating Vue app...');

const app = createApp(App);
app.directive('tip', (el, { value }) => {
  const { height } = el.dataset;
  // 储存最初的高度
  if (!height && height !== '0') {
    el.dataset.height = el.clientHeight;
  }
  const clientHeight = height || el.clientHeight;
  let cssText = 'transition: all 0.4s;';
  if (value) {
    cssText += `height: ${clientHeight}px;opacity: 1;margin-top: 4px;`;
  } else {
    cssText += 'height: 0;opacity: 0;overflow: hidden;margin-top: 0px;';
  }
  el.style.cssText = cssText;
});
app.directive('mask', (el: HTMLLIElement) => {
  const liHei = el.clientHeight as number;
  const childHei = el.querySelector('.edit-content')?.clientHeight as number;
  if (childHei > liHei) {
    el.classList.add('item-mask');
  }
});

if (import.meta.env.MODE !== 'development') {
  app.config.errorHandler = outputErrorLog;
}

app.use(router).mount('#app');

console.log('🚀 Vue application mounted successfully');

// 添加全局错误处理
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
