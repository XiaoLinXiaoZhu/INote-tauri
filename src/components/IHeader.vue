<template>
  <header class="header flex-between">
    <template v-if="currentRouteName === 'setting'">
      <button class="icon flex-center" title="返回" @click="goBack">
        <i class="iconfont flex-center icon-back"></i>
      </button>
    </template>
    <template v-else-if="currentRouteName !== 'imagePreview'">
      <!-- 打开新窗口 -->
      <button class="icon flex-center" @click="openNewWindow" title="新窗口">
        <i class="iconfont flex-center icon-add"></i>
      </button>
    </template>
    <!-- 标题拖动 -->
    <div class="drag-header flex1 flex-center" :style="paddingStyle" @mousedown="dragWindow">
      <transition name="header-fadein" v-if="platformWindows">
        <span :key="title">{{ title }}</span>
      </transition>
    </div>
    <!-- 右侧操作 -->
    <div class="operation-btn flex-items">
      <!-- 设置 -->
      <template v-if="currentRouteName === 'index'">
        <button class="icon flex-center" title="设置" @click="goToSetting">
          <i class="iconfont flex-center icon-setting"></i>
        </button>
      </template>
      <template v-else-if="currentRouteName === 'editor'">
        <!-- 固定 -->
        <div class="thepin" :class="isAlwaysOnTop ? 'thepin-active' : ''">
          <div class="absolute-box">
            <button class="icon flex-center" @click="drawingPin" title="置顶">
              <i class="iconfont flex-center icon-thepin"></i>
            </button>
            <button class="icon flex-center" @click="drawingPin" title="取消置顶">
              <i class="iconfont flex-center icon-thepin-active"></i>
            </button>
          </div>
        </div>
        <!-- 更多 -->
        <button class="icon flex-center" @click="clickOptions" title="选项">
          <i class="iconfont flex-center icon-more"></i>
        </button>
      </template>
      <!-- 关闭 -->
      <button v-if="platformWindows" class="icon flex-center close-window" @click="closeWindow" title="关闭">
        <i class="iconfont flex-center icon-close"></i>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { platform as getPlatform } from '@tauri-apps/plugin-os';
import { onMounted, ref } from 'vue';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { windowManager } from '@/service/windowManager';
import { uuid } from '@/utils';

const emits = defineEmits(['optionClick', 'onClose']);
const platformWindows = ref(false);

// 拖动窗口相关变量和样式
const paddingStyle = ref('');

// 拖动窗口函数
const dragWindow = () => {
  // Tauri 中使用 CSS 属性 "-webkit-app-region: drag" 代替
  // 这个函数保留是为了兼容模板引用
};

// 检测操作系统类型
onMounted(async () => {
  try {
    // Define interface for window with Tauri extension
    interface TauriWindow extends Window {
      __TAURI__?: Record<string, unknown>;
    }
    // 仅在 Tauri 环境下调用 plugin-os
    if (typeof window !== 'undefined' && (window as TauriWindow).__TAURI__) {
      if (typeof getPlatform === 'function') {
        const osType = await getPlatform();
        platformWindows.value = osType === 'windows';
      } else {
        platformWindows.value = navigator.userAgent.includes('Windows');
      }
    } else {
      platformWindows.value = navigator.userAgent.includes('Windows');
    }
  } catch (error) {
    console.error('获取操作系统类型失败:', error);
    platformWindows.value = navigator.userAgent.includes('Windows');
  }
});

// 打开新窗口
const openNewWindow = async () => {
  const newNoteUid = uuid();
  await windowManager.openEditor(newNoteUid);
};

// 获取窗口固定状态
const isAlwaysOnTop = ref(false);

// 固定前面
const drawingPin = async () => {
  try {
    isAlwaysOnTop.value = !isAlwaysOnTop.value;
    const current = getCurrentWebviewWindow();
    await windowManager.setAlwaysOnTop(current.label, isAlwaysOnTop.value);
  } catch (error) {
    console.error('设置窗口置顶状态失败:', error);
  }
};

defineProps({
  showPin: {
    type: Boolean,
    default: false,
  },
  showSettingBack: {
    type: Boolean,
    default: false,
  },
});

// 获取当前路由名
const currentRouteName = ref<string | symbol | undefined>(useRoute().name);
const router = useRouter();

// 点击选项按钮
const clickOptions = () => {
  emits('optionClick');
};

// 关闭窗口
const closeWindow = () => {
  emits('onClose');
  // Animation handled by CSS class, then close via backend
  document.querySelector('#app')?.classList.remove('app-show');
  document.querySelector('#app')?.classList.add('app-hide');
  setTimeout(async () => {
    const current = getCurrentWebviewWindow();
    await windowManager.closeWindow(current.label);
  }, 300);
};

/**
 * 返回首页
 */
const goBack = () => {
  router.go(-1);
};

// 跳转到设置页面
const goToSetting = () => {
  router.push('/setting');
};

const title = ref(useRoute().meta.title as string);

onBeforeRouteUpdate((to, _from, next) => {
  title.value = to.meta.title as string;
  document.title = title.value;
  currentRouteName.value = to.name;
  next();
});
</script>

<style lang="less" scoped>
.header-fadein-enter,
.header-fadein-leave-to {
  display: none;
  opacity: 0;
  animation: header-fadein 0.4s reverse;
}
.header-fadein-enter-active,
.header-fadein-leave-active {
  opacity: 0;
  animation: header-fadein 0.4s;
}

@keyframes header-fadein {
  from {
    opacity: 0;
    margin-right: -14px;
  }
  to {
    opacity: 1;
    margin-right: 0;
  }
}

.header {
  height: @iconSize;
  background-color: @white-color;
  position: relative;
  z-index: 99;
  button {
    padding: 0;
    outline: none;
    border: none;
    background-color: transparent;
  }
  a {
    color: initial;
    width: 100%;
    height: 100%;
    outline: none;
  }
  .icon {
    width: @iconSize;
    height: @iconSize;
    .iconfont {
      // 头部icon大小在这里设置
      font-size: @headerIconFontSize;
      padding-bottom: 2px;
    }
  }
  .close-window:hover {
    background-color: @error-color;
    color: @white-color;
  }
  @keyframes fades {
    30% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  .drag-header {
    -webkit-app-region: drag;
    height: 36px;
    margin-top: 5px;
    padding-bottom: 5px;
    color: @text-sub-color;
    font-size: 15px;
    font-weight: bold;
    box-sizing: border-box;
  }
}
.thepin {
  width: 40px;
  height: 40px;
  overflow: hidden;
  position: relative;
  transition: all 0.4s;
  .absolute-box {
    position: absolute;
    top: 0;
    transition: all 0.4s;
  }
}
.thepin-active .absolute-box {
  top: -40px;
}
</style>
