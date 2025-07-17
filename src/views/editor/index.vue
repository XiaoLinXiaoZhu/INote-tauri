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
import { useRoute, useRouter } from 'vue-router';
import ILoading from '@/components/ILoading.vue';

// 导入 Tauri API
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { listen, emit } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { twiceHandle, uuid } from '@/utils';
import { noteService } from '@/service/tauriNoteService';
import { transitCloseWindow } from '@/utils';
import { notesState } from '@/store/notes.state';
import { windowConfigService } from '@/service/windowConfigService';

import IDropBar from '@/components/IDropBar.vue';
import ColorMask from './components/ColorMask.vue';

// TODO 储存一份获取文本后的内容，供搜索使用
const IHeader = defineAsyncComponent(() => import('@/components/IHeader.vue'));
const IEditor = defineAsyncComponent({
  loader: () => import('./components/IEditor.vue'),
  loadingComponent: ILoading
});

const showOptionsStatus = ref(false);
const uid = ref('');
const currentBgClassName = ref('');
const route = useRoute();
const router = useRouter();
// 获取当前窗口
let currentWindow: WebviewWindow;

// markdown
const iEditorMarkdown = ref('');
// html
const iEditorHtml = ref('');
/**
 * 焦点状态
 * - `false`: 否 - 获得焦点
 * - `true`: 是 - 失去焦点
 */
const currentWindowBlurState = ref(false);
/**
 * - `false`: 否 - 未锁定
 * - `true`: 是 - 已锁定
 */
const lockState = ref(false);

// 跟踪便签是否为新建且未保存
const isNewNote = ref(false);

onBeforeMount(async () => {
  // 初始化数据库
  await noteService.initialize();
  
  // 初始化窗口配置服务
  await windowConfigService.initialize();
  
  // 获取当前窗口
  const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
  currentWindow = getCurrentWebviewWindow();
  
  // 注册编辑器窗口
  await invoke('register_editor_window');
  
  await initEditorContent();
  
  // 在内容初始化后设置窗口配置
  await setupWindowConfig();
  await afterIpc();
});

// 初始化编辑内容
const initEditorContent = async () => {
  console.log('🔄 初始化编辑器内容...');
  const routeUid = route.query?.uid as string;
  if (!routeUid) {
    console.error('❌ 没有提供便签UID');
    return;
  }

  uid.value = routeUid;
  console.log('📋 当前便签UID:', routeUid);
  
  // 检查是否已存在该便签
  const existingNote = await noteService.getNoteByUid(routeUid);
  console.log('🔍 便签查询结果:', existingNote ? '已存在' : '不存在');
  
  if (existingNote) {
    // 编辑现有便签
    isNewNote.value = false;
    console.log('✏️ 编辑现有便签，内容长度:', existingNote.content?.length || 0);
    await getCurUidItem(routeUid);
  } else {
    // 新建便签（只在确实不存在时创建）
    isNewNote.value = true;
    console.log('🆕 创建新便签');
    try {
      await noteService.createNote({
        uid: uid.value,
        title: '',
        content: '',
        markdown: '',
        color: '',
      });
      console.log('✅ 便签创建成功，uid:', uid.value);
    } catch (error) {
      console.error('❌ 创建便签失败:', error);
    }
  }
};

// 从数据库获取编辑的内容
const getCurUidItem = async (uid: string) => {
  try {
    const info = await noteService.getNoteByUid(uid);
    if (!info) return;
    currentBgClassName.value = info.color || '';
    iEditorHtml.value = info.content || '';
    // 优先使用存储的 markdown，如果没有则使用 content
    iEditorMarkdown.value = info.markdown || info.content || '';
  } catch (error) {
    console.error('获取便签失败:', error);
  }
};

const clickOption = () => {
  showOptionsStatus.value = true;
};

/** 修改颜色背景 */
const changeBgClassName = (className: string) => {
  if (currentBgClassName.value === className) return;

  currentBgClassName.value = className;
  updateData('className');
  showOptionsStatus.value = false;
};

/** 修改内容 */
const changeEditContent = (contentHtml: string, markdown: string) => {
  iEditorHtml.value = contentHtml;
  iEditorMarkdown.value = markdown;
  if (!uid.value) return false;

  updateData('content');
};

/** 截取展示的html */
const getInterceptionHTML = async () => {
  const domHtml = new DOMParser().parseFromString(iEditorHtml.value, 'text/html');
  let interceptionHTML = '';
  // 这里处理主页面的节点数量
  let nodeIndex = 10;
  // 取节点前十个
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

/** 更新数据并进行后续操作 */
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
      /**
       * updateNoteItem_className
       * 更新便笺内容
       */
      emit('updateNoteItem_className', {
        uid: uid.value,
        className: currentBgClassName.value
      });
    } else {
      dataJson.updatedAt = new Date();
      
      // 如果是新建便签且第一次有内容，发送创建事件
      if (isNewNote.value && iEditorHtml.value.trim()) {
        isNewNote.value = false; // 标记为已保存
        emit('createNewNote', dataJson);
      } else {
        // 更新便笺内容
        emit('updateNoteItem_content', dataJson);
      }
    }
  } catch (error) {
    console.error('更新便签失败:', error);
  }
};

const closeWindow = async () => {
  try {
    // 注销编辑器窗口
    await invoke('unregister_editor_window');
    
    // 如果是新建便签且没有内容，则删除
    if (isNewNote.value && !iEditorHtml.value?.trim()) {
      try {
        await noteService.deleteNoteByUid(uid.value);
        // 在关闭的时候如果没有内容就通知列表进行删除操作
        emit('removeEmptyNoteItem', uid.value);
      } catch (error) {
        console.error('删除空便签失败:', error);
      }
    }
    
    // 确保窗口完全关闭
    try {
      await currentWindow.close();
    } catch (error) {
      console.error('关闭窗口失败:', error);
      // 强制关闭
      await currentWindow.destroy();
    }
  } catch (error) {
    console.error('关闭窗口时发生错误:', error);
    // 最后的保险措施
    try {
      await currentWindow.destroy();
    } catch (e) {
      console.error('强制销毁窗口失败:', e);
    }
  }
};

/**
 * 此处通信便笺列表，如果接收到删除的消息就退出
 */
const afterIpc = async () => {
  // 使用 Tauri 事件替代 ipcMain
  await listen(`deleteActiveItem_${uid.value}`, () => {
    transitCloseWindow();
  });
  
  await listen(`${uid.value}_toOpen`, () => {
    currentWindow.show();
    emit(`get_${uid.value}_toOpen`);
  });
};

// 设置窗口配置
const setupWindowConfig = async () => {
  if (!currentWindow || !uid.value) return;
  
  const windowId = `editor_${uid.value}`;
  try {
    // 应用保存的窗口配置（编辑器默认尺寸）
    await windowConfigService.applyWindowConfig(currentWindow, windowId, 290, 320);
    
    // 开始跟踪窗口变化
    await windowConfigService.startWindowConfigTracking(currentWindow, windowId);
    
    console.log(`✅ Editor window config applied and tracking started for ${windowId}`);
  } catch (error) {
    console.error('❌ Failed to setup editor window config:', error);
  }
};

const headerClass = computed(() => {
  let classArr = [currentBgClassName.value];
  // 当编辑器不在显示选项的时候，并且处于显示焦点的情况下
  if (!showOptionsStatus.value && !currentWindowBlurState.value) {
    /**
     * 当未锁上的时候显示头部
     *
     * 和下面页面显示逻辑不同的是，这里是进行显示，下面是进行隐藏
     */
    if (!lockState.value) {
      classArr.push('header-show-style');
    }
  }
  return classArr;
});

const pageClass = computed(() => {
  let classArr = [currentBgClassName.value];
  // 当窗口失去焦点的时候
  if (currentWindowBlurState.value) {
    // 编辑器处于失去焦点的状态
    classArr.push('window-blur-hide');
  } else {
    if (lockState.value) {
      // 当锁上的时候，编辑器任然处于失去焦点的情况
      // 需要解锁才能正常
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
    // 使用 Tauri 事件监听窗口焦点变化
    await listen('tauri://blur', currentBlurHandle);
    await listen('tauri://focus', currentWindowFocusHandle);

    document.addEventListener('keydown', e => {
      if (e.keyCode === 27) {
        lockState.value = false;
        twiceHandle.start(() => {
          currentWindow.minimize();
        });
      }
    });
  } else {
    // 不在沉浸模式下取消所有功能以及事件
    currentWindowBlurState.value = false;
    // 注意：在 Tauri 中我们无法直接移除事件监听，但这里我们可以忽略回调
  }
};

immersionHandle();

// 这里需要监听主窗口改变设置内容
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
