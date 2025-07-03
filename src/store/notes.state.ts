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
  if (localStorage.getItem('notesState')) {
    notesState.value = { ...notesState.value, ...JSON.parse(localStorage.getItem('notesState')!) };
  } else {
    notesState.value = { ...defaultNotesState };
    // 异步设置图片缓存路径
    notesState.value.imagesCacheUrl = await initImagesCacheUrl();
    localStorage.setItem('notesState', JSON.stringify(notesState.value));
  }
  
  // 确保图片缓存路径已设置
  if (!notesState.value.imagesCacheUrl) {
    notesState.value.imagesCacheUrl = await initImagesCacheUrl();
  }
};

// 初始化
getLocalValue();

const initialNotesStateLocal = async () => {
  await getLocalValue();
  // 在 Tauri 中，我们不需要 IPC 通信来同步状态
  // 状态管理完全在前端完成
};

export const resetStore = async () => {
  localStorage.clear();
  const resetState = { ...defaultNotesState };
  resetState.imagesCacheUrl = await initImagesCacheUrl();
  localStorage.setItem('notesState', JSON.stringify(resetState));
  notesState.value = resetState;
};

// 监听 localStorage 变化
watch(() => localStorage.getItem('notesState'), initialNotesStateLocal);

// 监听状态变化并保存到 localStorage
watch(notesState.value, e => {
  localStorage.setItem('notesState', JSON.stringify(e));
  // 在 Tauri 中，我们不需要 IPC 通信
}, { deep: true });
