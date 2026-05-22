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
        :uid="uid"
        v-model="iEditorMarkdown"
        :content="iEditorHtml"
        :className="currentBgClassName"
        @on-input="changeEditContent"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeMount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import ILoading from '@/components/ILoading.vue';

import { listen, emit } from '@tauri-apps/api/event';
import { noteService } from '@/service/tauriNoteService';
import { windowManager } from '@/service/windowManager';
import { notesState } from '@/store/notes.state';

import IDropBar from '@/components/IDropBar.vue';
import ColorMask from './components/ColorMask.vue';

const IHeader = defineAsyncComponent(() => import('@/components/IHeader.vue'));
const IEditor = defineAsyncComponent({
  loader: () => import('./components/IEditor.vue'),
  loadingComponent: ILoading
});

const showOptionsStatus = ref(false);
const uid = ref('');
const currentBgClassName = ref('');
const route = useRoute();
let currentWindowLabel = '';

const iEditorMarkdown = ref('');
const iEditorHtml = ref('');
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

onBeforeMount(async () => {
  await noteService.initialize();

  const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
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
    await getCurUidItem(routeUid);
  } else {
    isNewNote.value = true;
    try {
      await noteService.createNote({
        uid: uid.value,
        title: '',
        content: '',
        markdown: '',
        color: '',
      });
    } catch (error) {
      console.error('创建便签失败:', error);
    }
  }
};

const getCurUidItem = async (uid: string) => {
  try {
    const info = await noteService.getNoteByUid(uid);
    if (!info) return;
    currentBgClassName.value = info.color || '';
    iEditorHtml.value = info.content || '';
    iEditorMarkdown.value = info.markdown || info.content || '';
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
  updateData('className');
  showOptionsStatus.value = false;
};

const changeEditContent = (contentHtml: string, markdown: string) => {
  iEditorHtml.value = contentHtml;
  iEditorMarkdown.value = markdown;
  if (!uid.value) return false;
  updateData('content');
};

const getInterceptionHTML = async () => {
  const domHtml = new DOMParser().parseFromString(iEditorHtml.value, 'text/html');
  let interceptionHTML = '';
  let nodeIndex = 10;
  domHtml.body.childNodes.forEach((item, index) => {
    if (item.nodeName === '#text') {
      nodeIndex += 1;
      return;
    }
    if (index > nodeIndex) return;
    interceptionHTML += (item as Element).outerHTML;
  });
  return interceptionHTML;
};

const updateData = async (updateType: 'className' | 'content') => {
  const interceptionHTML = await getInterceptionHTML();
  const dataJson: Record<string, any> = {
    uid: uid.value,
    content: iEditorHtml.value,
    markdown: iEditorMarkdown.value,
    className: currentBgClassName.value,
    interception: interceptionHTML
  };

  try {
    await noteService.updateNoteByUid(uid.value, {
      content: iEditorHtml.value,
      markdown: iEditorMarkdown.value,
      color: currentBgClassName.value
    });

    if (updateType === 'className') {
      emit('updateNoteItem_className', {
        uid: uid.value,
        className: currentBgClassName.value
      });
    } else {
      dataJson.updatedAt = new Date();
      if (isNewNote.value && iEditorHtml.value.trim()) {
        isNewNote.value = false;
        emit('createNewNote', dataJson);
      } else {
        emit('updateNoteItem_content', dataJson);
      }
    }
  } catch (error) {
    console.error('更新便签失败:', error);
  }
};

const closeWindow = async () => {
  try {
    if (isNewNote.value && !iEditorHtml.value?.trim()) {
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
    const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
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

    document.addEventListener('keydown', async (e) => {
      if (e.keyCode === 27) {
        lockState.value = false;
        const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
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
  // padding-bottom: @iconSize;
  box-sizing: border-box;
  transition: padding 0.4s;

  .editor-container {
    width: 100%;
    height: 100%;
    overflow: hidden;

    textarea {
      width: 100%;
      height: 370px;
      display: block;
    }
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
