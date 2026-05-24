declare module '*.vue' {
  import { DefineComponent } from 'vue';

  // biome-ignore lint/complexity/noBannedTypes: Vue 的 DefineComponent 类型签名要求使用 `{}`
  const component: DefineComponent<{}, {}, object>;
  export default component;
}

/** 是否是暗黑模式，根据此处去做兼容 */
declare const isDark: () => boolean;

declare global {
  interface Window {
    __TAURI__?: Record<string, unknown>;
  }
}
