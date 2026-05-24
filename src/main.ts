import { createApp } from 'vue';
import { noteService } from '@/service/tauriNoteService';
import outputErrorLog from '@/utils/errorLog';
import App from './App.vue';
import router from './router';

const initializeServices = async () => {
  await noteService.initialize();
};

initializeServices().catch(error => {
  console.error('Failed to initialize services:', error);
});

const app = createApp(App);
app.directive('tip', (el, { value }) => {
  const { height } = el.dataset;
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

window.addEventListener('error', event => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled rejection:', event.reason);
});
