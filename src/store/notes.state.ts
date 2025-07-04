import { ref, watch } from 'vue';
import { join, appDataDir } from '@tauri-apps/api/path';
import { constImagesPath } from '@/config';
interface NotesState {
  [key: string]: any;
  syncDelay: number;
  serverAddress: string;
  serverToken: string;
  switchStatus: {
    [key: string]: any;
    /**
     * 开启提示
     */
    textTip: boolean;

    /**
     * 删除确认
     */
    deleteTip: boolean;

    /**
     * 自动沉浸
     */
    autoNarrow: boolean;
    /**
     * 纯净模式
     */
    autoNarrowPure: boolean;

    /**
     * 自动隐藏
     */
    autoHide: boolean;

    /**
     * 打开同步
     */
    openSync: boolean;
  };
  /** 本地图片缓存地址 */
  imagesCacheUrl: string;
}

const defaultNotesState: NotesState = {
  syncDelay: 100,
  serverAddress: '',
  serverToken: '',
  switchStatus: {
    /**
     * 开启提示
     */
    textTip: true,

    /**
     * 删除确认
     */
    deleteTip: false,

    /**
     * 自动缩小
     */
    autoNarrow: false,
    /**
     * 缩小纯净模式
     */
    autoNarrowPure: false,

    /**
     * 自动隐藏
     */
    autoHide: false,

    /**
     * 打开同步
     */
    openSync: false
  },
  imagesCacheUrl: '' // 将在初始化时异步设置
};

export const notesState = ref<NotesState>({} as NotesState);

// 异步初始化图片缓存路径
const initImagesCacheUrl = async () => {
  try {
    const dataDir = await appDataDir();
    const imagesCacheUrl = await join(dataDir, constImagesPath);
    return imagesCacheUrl;
  } catch (error) {
    console.warn('Failed to initialize images cache URL:', error);
    return './images'; // 降级处理
  }
};

const getLocalValue = async () => {
  try {
    if (localStorage.getItem('notesState')) {
      const savedState = JSON.parse(localStorage.getItem('notesState')!);
      notesState.value = { ...defaultNotesState, ...savedState };
    } else {
      notesState.value = { ...defaultNotesState };
    }
    
    // 异步设置图片缓存路径
    if (!notesState.value.imagesCacheUrl) {
      notesState.value.imagesCacheUrl = await initImagesCacheUrl();
      localStorage.setItem('notesState', JSON.stringify(notesState.value));
    }
  } catch (error) {
    console.error('Failed to load local state:', error);
    notesState.value = { ...defaultNotesState };
    notesState.value.imagesCacheUrl = await initImagesCacheUrl();
    localStorage.setItem('notesState', JSON.stringify(notesState.value));
  }
};

// 初始化
getLocalValue();

export const resetStore = async () => {
  try {
    localStorage.clear();
    const resetState = { ...defaultNotesState };
    resetState.imagesCacheUrl = await initImagesCacheUrl();
    localStorage.setItem('notesState', JSON.stringify(resetState));
    notesState.value = resetState;
  } catch (error) {
    console.error('Failed to reset store:', error);
  }
};

// 不需要监听 localStorage 变化，因为在 Tauri 中状态管理是本地的

// 监听状态变化并保存到 localStorage
watch(() => notesState.value, e => {
  localStorage.setItem('notesState', JSON.stringify(e));
  // 在 Tauri 中，我们不需要 IPC 通信
}, { deep: true });
