<template>
  <div class="editor-markdown vditor" :class="className" ref="editorRef" @contextmenu.prevent="contextMenu" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import Vditor from 'vditor';
import 'vditor/dist/index.css';
import CreateRightClick, { MenuOptions } from '@/components/IRightClick';
import { constImagesPath } from '@/config';
import { openImageAsNewWindow, uuid } from '@/utils';
import useMessage from '@/components/IMessage';
import { copyImage, fileToBuffer } from '@/utils/file';
import { open as openShell } from '@tauri-apps/plugin-shell';
import { join } from '@tauri-apps/api/path';
import { exists, mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { appDataDir } from '@tauri-apps/api/path';

const toolbar: IMenuItem[] = [
  {
    name: 'bold',
    icon: '<i class="iconfont icon-editor-bold"></i>'
  },
  {
    name: 'italic',
    icon: '<i class="iconfont icon-italic"></i>'
  },
  {
    name: 'line',
    icon: '<i class="iconfont icon-underline"></i>'
  },
  {
    name: 'strike',
    icon: '<i class="iconfont icon-strikethrough"></i>'
  },
  {
    name: 'list',
    icon: '<i class="iconfont icon-ul"></i>'
  },
  {
    name: 'list',
    icon: '<i class="iconfont icon-ol"></i>'
  },
  {
    name: 'code',
    icon: '<i class="iconfont icon-code"></i>'
  }
];

const props = defineProps({
  uid: {
    type: String,
    default: ''
  },
  // 返回markdown
  modelValue: {
    type: String,
    default: ''
  },
  // 返回html
  content: {
    type: String,
    default: ''
  },
  className: String,
  getHtml: {
    type: Function
  }
});
const emits = defineEmits(['on-input', 'update:modelValue']);
const editorRef = ref();
const vditor = ref<Vditor>();
const rightClick = new CreateRightClick();
const currentItemImagePath = ref<string>('');

// 初始化图片路径
onMounted(async () => {
  try {
    const appDataPath = await appDataDir();
    currentItemImagePath.value = await join(appDataPath, constImagesPath.replace('/', ''));
  } catch (error) {
    console.error('初始化图片路径失败:', error);
    currentItemImagePath.value = './images';
  }
});
const urlRegExp = /^(((ht|f)tps?):\/\/)?([^!@#$%^&*?.\s-]([^!@#$%^&*?.\s]{0,63}[^!@#$%^&*?.\s])?\.)+[a-z]{2,6}\/?/;

const loadVditor = () => {
  vditor.value = new Vditor(editorRef.value as HTMLElement, {
    cache: {
      enable: false
    },
    linkPrefix: '#',
    toolbar,
    undoDelay: 0,
    value: props.modelValue,
    placeholder: '记笔记...',
    input: value => {
      emits('on-input', vditor.value?.getHTML(), value);
      emits('update:modelValue', value);
    },
    after: () => {
      vditorLoad();
    },
    link: {
      isOpen: false,
      click: el => {
        // 从浏览器打开链接
        if (urlRegExp.test(el.textContent!)) {
          openShell(el.textContent!);
        }
      }
    },
    image: {
      isPreview: false,
      preview: openImageAsNewWindow
    },
    upload: {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      handler: async files => {
        insertImage(files[0]);
      }
    }
  });
};

/** 写入图片 */
const insertImage = async (file: File | Blob) => {
  if (!file) return '';
  await createImageUrl();
  const uuidStr = uuid();
  const extName = file.type.split('/')[1];
  const imagePath = await join(currentItemImagePath.value, props.uid, `${uuidStr}.${extName}`);
  const buffer = await fileToBuffer(file);
  await writeFile(imagePath, new Uint8Array(buffer)).catch((err: any) => {
    useMessage(err.message, 'error');
  });
  const htmlImagePath = `![${uuidStr}](atom:///${imagePath})`;
  vditor.value?.insertValue(htmlImagePath);
};

const createImageUrl = async () => {
  console.log(currentItemImagePath.value);
  if (!await exists(currentItemImagePath.value)) {
    await mkdir(currentItemImagePath.value, { recursive: true });
  }
  const currentUidImagePath = await join(currentItemImagePath.value, props.uid);
  if (!await exists(currentUidImagePath)) {
    await mkdir(currentUidImagePath, { recursive: true });
  }
};

onMounted(() => {
  loadVditor();
});

// 监听内容变化
watch(() => props.modelValue, (newValue) => {
  if (vditor.value && newValue !== vditor.value.getValue()) {
    vditor.value.setValue(newValue);
  }
});

/** 编辑器加载完毕 */
const vditorLoad = () => {
  vditor.value?.setValue(props.modelValue);
  vditor.value?.focus();
  // vditor的内容容器
  const editorContainer = document.querySelector('.vditor-ir .vditor-reset');
  const editorScrollHeight = editorContainer?.scrollHeight ?? 0;
  editorContainer!.scrollTop = editorScrollHeight;
};

/** 编辑器内右键 */
const contextMenu = (event: MouseEvent) => {
  const selectionValue = vditor.value?.getSelection();
  const target = event.target as HTMLElement;
  const targetName = target.tagName;

  const menuList: MenuOptions[] = [
    {
      text: '复制',
      once: true,
      iconName: ['iconfont', 'icon-copy'],
      disabled: targetName !== 'IMG' && !selectionValue,
      handler: () => {
        // 判断点击节点
        switch (targetName) {
          case 'IMG':
            copyImage(target as HTMLImageElement);
            break;
          case 'A':
            break;
          default:
            const text = vditor.value?.getSelection();
            navigator.clipboard.writeText(text as string);
        }
      }
    },
    {
      text: '粘贴',
      once: true,
      iconName: ['iconfont', 'icon-niantie'],
      // disabled: async () => {
      //   const disabledStatus = await window.navigator.clipboard.read().catch(() => {
      //     return false;
      //   });
      //   return disabledStatus;
      // },
      handler: async () => {
        // 获取剪切板的数据
        console.log(await window.navigator.clipboard.read());
        const clipboardList = await window.navigator.clipboard.read().catch(() => {
          return [];
        });
        if (clipboardList && clipboardList.length) {
          const firstClipboard = clipboardList[0];
          if (!firstClipboard) return;

          const firstClipboardTypes = firstClipboard.types;

          // 粘贴图片
          if (firstClipboardTypes && firstClipboardTypes[0].includes('image')) {
            insertImage(await firstClipboard.getType(firstClipboardTypes[0]));
            return;
          }

          // 粘贴html
          if (
            firstClipboardTypes &&
            firstClipboardTypes.includes('text/html') &&
            firstClipboardTypes.includes('text/plain')
          ) {
            const html = await (await firstClipboard.getType('text/html')).text();
            console.log('html', html);
            vditor.value?.insertValue(html.substring(0, html.length - 18));
            return;
          }

          // 粘贴文本
          if (firstClipboardTypes && firstClipboardTypes.includes('text/plain')) {
            const text = await (await firstClipboard.getType('text/plain')).text();
            console.log('text', text);
            vditor.value?.insertValue(text);
          }
        }
      }
    }
  ];

  if (targetName === 'A') {
    const menuItem: MenuOptions = {
      text: '打开链接',
      once: true,
      iconName: ['iconfont', 'icon-niantie']
    };
    menuList.unshift(menuItem);
  }
  if (targetName === 'IMG') {
    const targetImg = target as HTMLImageElement;
    if (targetImg.src.startsWith('atom')) {
      const openFolderMenuItem: MenuOptions = {
        text: '打开所在文件夹',
        once: true,
        iconName: ['iconfont', 'icon-folderOpen'],
        handler: () => {
          // TODO 兼容mac
          openShell(targetImg.src.replace('atom:///', ''), 'folder');
        }
      };
      menuList.unshift(openFolderMenuItem);
      const openImageMenuItem: MenuOptions = {
        text: '打开图片',
        once: true,
        iconName: ['iconfont', 'icon-tupian'],
        handler: () => {
          // TODO 兼容mac
          openShell(targetImg.src.replace('atom:///', ''));
        }
      };
      menuList.unshift(openImageMenuItem);
    }
  }
  rightClick.useRightClick(event, menuList);
};
</script>

<style lang="less" scoped>
.editor-markdown {
  border: none;
  width: 100% !important;
  height: 100% !important;
  flex-direction: column-reverse;
}

&:deep(.vditor-toolbar) {
  padding: 0 !important;
  background-color: transparent;
  border-bottom: none;
  height: 40px;
  position: relative;
  top: 0;
  transition: top 0.4s, height 0.4s;

  .vditor-toolbar__item {
    width: 40px;
    height: 40px;
    max-height: 40px;
    max-width: 40px;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .vditor-tooltipped,
  .vditor-tooltipped__s {
    padding: 0;
    width: 100%;
    height: 100%;

    &:hover {
      color: #000;
      background-color: rgba(0, 0, 0, 0.1);
    }
  }
}

&:deep(.vditor-menu--current) {
  color: #000 !important;
  background-color: rgba(0, 0, 0, 0.1) !important;
}

&:deep(.vditor-ir pre.vditor-reset) {
  background-color: transparent;
}

// 加粗 **
&:deep(.vditor-ir__node--expand .vditor-ir__marker--bi) {
  color: #000;
}

// 标题 #
&:deep(.vditor-ir__node--expand .vditor-ir__marker--heading) {
  color: #000;
}
</style>
