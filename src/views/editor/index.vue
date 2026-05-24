<template>
  <IHeader class="header-editor" :class="headerClass" @option-click="clickOption" @on-close="closeWindow" />
  <IDropBar />
  <ColorMask
    :showState="showOptionsStatus"
    @on-change="changeBgClassName"
    @on-close="showOptionsStatus = false"
    @on-open="showOptionsStatus = false"
  />
  <main class="page-editor" :class="pageClass">
    <section class="editor-container">
      <IEditor
        ref="editorRef"
        :uid="uid"
        v-model="editorContent"
        :className="currentBgClassName"
        @on-input="onEditorInput"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { emit, listen } from '@tauri-apps/api/event';
import { computed, defineAsyncComponent, onBeforeMount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import IDropBar from '@/components/IDropBar.vue';
import ILoading from '@/components/ILoading.vue';
import { noteService } from '@/service/tauriNoteService';
import { windowManager } from '@/service/windowManager';
import { notesState } from '@/store/notes.state';
import ColorMask from './components/ColorMask.vue';

const IHeader = defineAsyncComponent(() => import('@/components/IHeader.vue'));
const IEditor = defineAsyncComponent({
  loader: () => import('./components/IEditor.vue'),
  loadingComponent: ILoading,
});

const showOptionsStatus = ref(false);
const uid = ref('');
const currentBgClassName = ref('');
const route = useRoute();
let currentWindowLabel = '';

interface EditorInstance {
  getHtmlSnapshot(): string;
}

const editorContent = ref('');
const editorRef = ref<InstanceType<typeof IEditor> | null>(null);

/**
 * 焦点状态
 * - `false`: 获得焦点
 * - `true`: 失去焦点
 */
const currentWindowBlurState = ref(false);
/**
 * - `false`: 未锁定
 * - `true`: 已锁定
 */
const lockState = ref(false);

const isNewNote = ref(false);

// 保存防抖
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 500;

onBeforeMount(async () => {
  await noteService.initialize();

  const { getCurrentWebviewWindow } = await import(
    '@tauri-apps/api/webviewWindow'
  );
  currentWindowLabel = getCurrentWebviewWindow().label;

  await initEditorContent();
  await afterIpc();
});

const initEditorContent = async () => {
  const routeUid = route.query?.uid as string;
  if (!routeUid) return;

  uid.value = routeUid;

  const existingNote = await noteService.getNoteByUid(routeUid);

  if (existingNote) {
    isNewNote.value = false;
    await loadNoteContent(routeUid);
  } else {
    isNewNote.value = true;
    try {
      await noteService.createNote({
        uid: uid.value,
        title: '',
        md_content: '',
        html_snapshot: '',
        color: '',
      });
    } catch (error) {
      console.error('创建便签失败:', error);
    }
  }
};

const loadNoteContent = async (noteUid: string) => {
  try {
    const info = await noteService.getNoteByUid(noteUid);
    if (!info) return;
    currentBgClassName.value = info.color || '';
    editorContent.value = info.md_content || '';
  } catch (error) {
    console.error('获取便签失败:', error);
  }
};

const clickOption = () => {
  showOptionsStatus.value = true;
};

const changeBgClassName = (className: string) => {
  if (currentBgClassName.value === className) return;
  currentBgClassName.value = className;
  saveColor();
  showOptionsStatus.value = false;
};

/** 编辑器内容变更（带防抖保存） */
const onEditorInput = (markdown: string) => {
  editorContent.value = markdown;
  if (!uid.value) return;
  debouncedSaveContent();
};

const debouncedSaveContent = () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveContent();
  }, SAVE_DEBOUNCE_MS);
};

/** 从 CM6 DOM 提取快照并保存 */
const saveContent = async () => {
  const htmlSnapshot =
    (editorRef.value as unknown as EditorInstance)?.getHtmlSnapshot?.() || '';

  try {
    await noteService.updateNoteByUid(uid.value, {
      md_content: editorContent.value,
      html_snapshot: htmlSnapshot,
    });

    if (isNewNote.value && editorContent.value.trim()) {
      isNewNote.value = false;
      emit('createNewNote', {
        uid: uid.value,
        mdContent: editorContent.value,
        htmlSnapshot,
        className: currentBgClassName.value,
        updatedAt: new Date(),
      });
    } else {
      emit('updateNoteItem_content', {
        uid: uid.value,
        mdContent: editorContent.value,
        htmlSnapshot,
        className: currentBgClassName.value,
        updatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error('保存便签失败:', error);
  }
};

const saveColor = async () => {
  try {
    await noteService.updateNoteByUid(uid.value, {
      color: currentBgClassName.value,
    });
    emit('updateNoteItem_className', {
      uid: uid.value,
      className: currentBgClassName.value,
    });
  } catch (error) {
    console.error('保存颜色失败:', error);
  }
};

const closeWindow = async () => {
  // 关闭前立即保存（取消防抖，直接写入）
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
    await saveContent();
  }

  try {
    if (isNewNote.value && !editorContent.value.trim()) {
      try {
        await noteService.deleteNoteByUid(uid.value);
        emit('removeEmptyNoteItem', uid.value);
      } catch (error) {
        console.error('删除空便签失败:', error);
      }
    }
    await windowManager.closeWindow(currentWindowLabel);
  } catch (error) {
    console.error('关闭窗口时发生错误:', error);
  }
};

const afterIpc = async () => {
  await listen(`deleteActiveItem_${uid.value}`, async () => {
    await windowManager.closeWindow(currentWindowLabel);
  });

  await listen(`${uid.value}_toOpen`, async () => {
    const { getCurrentWebviewWindow } = await import(
      '@tauri-apps/api/webviewWindow'
    );
    getCurrentWebviewWindow().show();
    emit(`get_${uid.value}_toOpen`);
  });
};

const headerClass = computed(() => {
  let classArr = [currentBgClassName.value];
  if (!showOptionsStatus.value && !currentWindowBlurState.value) {
    if (!lockState.value) {
      classArr.push('header-show-style');
    }
  }
  return classArr;
});

const pageClass = computed(() => {
  let classArr = [currentBgClassName.value];
  if (currentWindowBlurState.value) {
    classArr.push('window-blur-hide');
  } else {
    if (lockState.value) {
      classArr.push('window-blur-hide');
    }
  }
  return classArr;
});

const currentBlurHandle = () => {
  currentWindowBlurState.value = true;
  if (notesState.value.switchStatus.autoNarrowPure) {
    lockState.value = true;
  } else {
    lockState.value = false;
  }
};

const currentWindowFocusHandle = () => {
  currentWindowBlurState.value = false;
};

const immersionHandle = async () => {
  if (notesState.value.switchStatus.autoNarrow) {
    await listen('tauri://blur', currentBlurHandle);
    await listen('tauri://focus', currentWindowFocusHandle);

    document.addEventListener('keydown', async e => {
      if (e.keyCode === 27) {
        lockState.value = false;
        const { getCurrentWebviewWindow } = await import(
          '@tauri-apps/api/webviewWindow'
        );
        getCurrentWebviewWindow().minimize();
      }
    });
  } else {
    currentWindowBlurState.value = false;
  }
};

immersionHandle();

watch(() => notesState.value.switchStatus.autoNarrow, immersionHandle);
</script>

<style lang="less" scoped>
.page-editor {
  height: 100%;
  background-color: @white-color;
  padding-top: @iconSize;
  box-sizing: border-box;
  transition: padding 0.4s;

  .editor-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
}

.header-editor {
  position: fixed;
  z-index: 0;
  width: 100%;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  top: -@iconSize;
  transition: all 0.4s;
}

.header-show-style {
  top: 0;
  z-index: 3;
  transition: all 0.4s;
}

.window-blur-hide {
  padding-top: 0;
  padding-bottom: 0;
  transition: padding 0.4s;
}
</style>
