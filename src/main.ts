import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import outputErrorLog from '@/utils/errorLog';
import { noteService } from '@/service/tauriNoteService';

console.log('🚀 Starting Vue application...');

// 初始化 Tauri 数据库服务
console.log('🚀 Initializing database service...');
noteService.initialize()
  .then(() => {
    console.log('✅ Database service initialized successfully');
  })
  .catch(error => {
    console.error('❌ Failed to initialize database service:', error);
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
