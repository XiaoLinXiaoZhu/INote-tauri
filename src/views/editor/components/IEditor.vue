<template>
  <div
    class="editor-markdown"
    :class="className"
    ref="editorContainer"
    @contextmenu.prevent="contextMenu"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { createEditor } from '@xlxz/markdown-editor';
import type { EditorInstance, EditorBackend } from '@xlxz/markdown-editor';
import CreateRightClick, { MenuOptions } from '@/components/IRightClick';
import { constImagesPath } from '@/config';
import { uuid } from '@/utils';
import { windowManager } from '@/service/windowManager';
import { copyImage } from '@/utils/file';
import { open as openShell } from '@tauri-apps/plugin-shell';
import { join } from '@tauri-apps/api/path';
import { exists, mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { appDataDir } from '@tauri-apps/api/path';

const props = defineProps({
  uid: {
    type: String,
    default: ''
  },
  modelValue: {
    type: String,
    default: ''
  },
  className: String
});

const emits = defineEmits(['on-input', 'update:modelValue']);
const editorContainer = ref<HTMLElement>();
const rightClick = new CreateRightClick();
const currentItemImagePath = ref<string>('');

let editor: EditorInstance | null = null;
let isInternalChange = false;

onMounted(async () => {
  // 初始化图片路径
  try {
    const appDataPath = await appDataDir();
    currentItemImagePath.value = await join(appDataPath, constImagesPath.replace('/', ''));
  } catch (error) {
    console.error('初始化图片路径失败:', error);
    currentItemImagePath.value = './images';
  }

  loadEditor();
});

onBeforeUnmount(() => {
  if (editor) {
    editor.destroy();
    editor = null;
  }
});

const urlRegExp = /^(((ht|f)tps?):\/\/)?([^!@#$%^&*?.\s-]([^!@#$%^&*?.\s]{0,63}[^!@#$%^&*?.\s])?\.)+[a-z]{2,6}\/?/;

const loadEditor = () => {
  if (!editorContainer.value) return;

  const backend: EditorBackend = {
    async saveAttachment(name: string, data: ArrayBuffer) {
      const uuidStr = uuid();
      const extName = name.split('.').pop() || 'png';
      await createImageDir();
      const imagePath = await join(currentItemImagePath.value, props.uid, `${uuidStr}.${extName}`);
      await writeFile(imagePath, new Uint8Array(data));
      return `atom:///${imagePath}`;
    }
  };

  editor = createEditor(editorContainer.value, {
    doc: props.modelValue,
    filePath: `${props.uid}.md`,
    theme: 'light',
    showLineNumber: false,
    showIndentGuide: false,
    foldHeading: false,
    foldIndent: false,
    readableLineWidth: false,
    onChange(doc: string) {
      isInternalChange = true;
      emits('update:modelValue', doc);
      emits('on-input', doc);
      isInternalChange = false;
    },
    onLinkClick(linktext: string) {
      if (urlRegExp.test(linktext)) {
        openShell(linktext);
      }
    },
    onExternalLinkClick(url: string) {
      openShell(url);
    }
  }, backend);

  // 聚焦并滚动到底部
  editor.focus();
  requestAnimationFrame(() => {
    const cmContent = editorContainer.value?.querySelector('.cm-content');
    if (cmContent) {
      cmContent.scrollTop = cmContent.scrollHeight;
    }
  });
};

const createImageDir = async () => {
  if (!await exists(currentItemImagePath.value)) {
    await mkdir(currentItemImagePath.value, { recursive: true });
  }
  const currentUidImagePath = await join(currentItemImagePath.value, props.uid);
  if (!await exists(currentUidImagePath)) {
    await mkdir(currentUidImagePath, { recursive: true });
  }
};

// 外部内容变更时同步到编辑器
watch(() => props.modelValue, (newValue) => {
  if (isInternalChange) return;
  if (editor && newValue !== editor.getDoc()) {
    editor.setDoc(newValue);
  }
});

/** 获取编辑器 DOM 快照 HTML */
const getHtmlSnapshot = (): string => {
  if (!editorContainer.value) return '';
  const cmContent = editorContainer.value.querySelector('.cm-content');
  if (!cmContent) return '';
  // 取前 10 个子节点作为预览快照
  let snapshotHtml = '';
  const children = cmContent.children;
  const maxNodes = Math.min(children.length, 10);
  for (let i = 0; i < maxNodes; i++) {
    snapshotHtml += children[i].outerHTML;
  }
  return snapshotHtml;
};

defineExpose({ getHtmlSnapshot });

/** 编辑器内右键 */
const contextMenu = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const targetName = target.tagName;
  const selection = editor?.getSelection() || '';

  const menuList: MenuOptions[] = [
    {
      text: '复制',
      once: true,
      iconName: ['iconfont', 'icon-copy'],
      disabled: targetName !== 'IMG' && !selection,
      handler: () => {
        switch (targetName) {
          case 'IMG':
            copyImage(target as HTMLImageElement);
            break;
          default:
            if (selection) {
              navigator.clipboard.writeText(selection);
            }
        }
      }
    },
    {
      text: '粘贴',
      once: true,
      iconName: ['iconfont', 'icon-niantie'],
      handler: async () => {
        try {
          const clipboardList = await window.navigator.clipboard.read();
          if (!clipboardList || !clipboardList.length) return;

          const firstClipboard = clipboardList[0];
          if (!firstClipboard) return;

          const types = firstClipboard.types;

          // 粘贴图片
          if (types[0]?.includes('image')) {
            const blob = await firstClipboard.getType(types[0]);
            const buffer = await blob.arrayBuffer();
            const ext = types[0].split('/')[1] || 'png';
            await createImageDir();
            const uuidStr = uuid();
            const imagePath = await join(currentItemImagePath.value, props.uid, `${uuidStr}.${ext}`);
            await writeFile(imagePath, new Uint8Array(buffer));
            const mdImage = `![${uuidStr}](atom:///${imagePath})`;
            // 通过 CM6 view 插入
            if (editor) {
              const view = editor.view;
              const { from } = view.state.selection.main;
              view.dispatch({ changes: { from, insert: mdImage } });
            }
            return;
          }

          // 粘贴文本
          if (types.includes('text/plain')) {
            const text = await (await firstClipboard.getType('text/plain')).text();
            if (editor) {
              const view = editor.view;
              const { from, to } = view.state.selection.main;
              view.dispatch({ changes: { from, to, insert: text } });
            }
          }
        } catch (error) {
          console.error('粘贴失败:', error);
        }
      }
    }
  ];

  if (targetName === 'IMG') {
    const targetImg = target as HTMLImageElement;
    if (targetImg.src.startsWith('atom')) {
      menuList.unshift({
        text: '打开所在文件夹',
        once: true,
        iconName: ['iconfont', 'icon-folderOpen'],
        handler: () => {
          openShell(targetImg.src.replace('atom:///', ''), 'folder');
        }
      });
      menuList.unshift({
        text: '打开图片',
        once: true,
        iconName: ['iconfont', 'icon-tupian'],
        handler: () => {
          openShell(targetImg.src.replace('atom:///', ''));
        }
      });
    }
    // 图片预览
    menuList.unshift({
      text: '预览图片',
      once: true,
      iconName: ['iconfont', 'icon-tupian'],
      handler: async () => {
        const devicePixelRatio = window.devicePixelRatio;
        const naturalWidth = targetImg.naturalWidth / devicePixelRatio;
        const naturalHeight = targetImg.naturalHeight / devicePixelRatio;
        const { availWidth, availHeight } = window.screen;
        const width = Math.min(Math.max(naturalWidth, 500), availWidth);
        const height = Math.min(Math.max(naturalHeight, 300), availHeight);
        await windowManager.openImagePreview(targetImg.src, width, height);
      }
    });
  }

  rightClick.useRightClick(event, menuList);
};
</script>

<style lang="less" scoped>
.editor-markdown {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  :deep(.cm-editor) {
    flex: 1;
    overflow: hidden;
    background-color: transparent;
  }

  :deep(.cm-scroller) {
    overflow: auto;
  }

  :deep(.cm-content) {
    padding: 8px 16px;
  }

  :deep(.cm-focused) {
    outline: none;
  }
}
</style>
