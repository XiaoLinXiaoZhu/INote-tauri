<template>
  <main class="page-setting">
    <Card title="通用设置">
      <BlockItem title="开启提示">
        <ISwitch styled="margin-left: 10px;" v-model="notesState.switchStatus.textTip" />
      </BlockItem>
      <BlockItem title="删除确认">
        <ISwitch styled="margin-left: 10px;" v-model="notesState.switchStatus.deleteTip" />
      </BlockItem>
      <BlockItem title="自动沉浸">
        <ISwitch @change="changeAutoNarrow" styled="margin-left: 10px;" v-model="notesState.switchStatus.autoNarrow" />
        <template #desc>
          失去焦点时自动隐藏头部和底部
        </template>
      </BlockItem>
      <BlockItem title="纯净模式">
        <ISwitch
          styled="margin-left: 10px;"
          :disabled="!notesState.switchStatus.autoNarrow"
          v-model="notesState.switchStatus.autoNarrowPure"
        />
        <template #desc> 在沉浸下需要按<span class="block-important">ESC</span>退出当前纯净模式 </template>
      </BlockItem>
    </Card>
    <Card title="图片保存位置">
      <BlockItem>
        <IInput :readonly="true" v-model="notesState.imagesCacheUrl" />
        <button class="block-button" style="margin-top: 10px" @click="openImagesUrlDir">
          <span>打开文件夹</span>
        </button>
        <template #desc>
          文本中的图片储存地址，尽量勿动
        </template>
      </BlockItem>
    </Card>
    <!-- TODO -->
    <Card title="导入导出">
      <BlockItem :is-link="true">
        <button class="block-button disabled-button">
          <i class="iconfont icon-import"></i>
          <span>导入便笺</span>
        </button>
      </BlockItem>
      <BlockItem :is-link="true">
        <button class="block-button disabled-button">
          <i class="iconfont icon-export"></i>
          <span>导出便笺</span>
        </button>
      </BlockItem>
    </Card>
    <Card title="清除缓存">
      <BlockItem>
        <button class="block-button" @click="clearBtnState = true">
          <i class="iconfont icon-qingchu"></i>
          <span>清除缓存</span>
        </button>
        <template #desc>
          使用该功能可以解决大部分因升级而导致配置等错误问题
        </template>
      </BlockItem>
    </Card>
    <Card title="反馈问题">
      <BlockItem :is-link="true">
        <div class="flex-items">
          <i class="iconfont icon-mail"></i>
          <a class="link-style" href="mailto:helloXLXZ233@gmail.com">helloXLXZ233@gmail.com</a>
          <ICopy style="margin-left: 20px" copy-text="helloXLXZ233@gmail.com">复制</ICopy>
        </div>
        <template #desc>
          如果你有更好的建议或者动画效果，请联系我
        </template>
      </BlockItem>
      <BlockItem title="反馈bug" :is-link="true">
        <a class="link-style link-margin" @click="openLogFolder">打开错误日志</a>
        <template #desc>
          如果遇到问题或者bug，为了更好的使用，建议联系上面邮箱
        </template>
      </BlockItem>
      <BlockItem title="提交issue" :is-link="true">
        <a class="link-style link-margin flex-items" @click="openExternal(issueLink)">
          <span>GitHub Issue</span>
          <i class="iconfont icon-link"></i>
        </a>
      </BlockItem>
      <BlockItem title="github" :is-link="true">
        <a class="link-style link-margin flex-items" @click="openExternal(githubLink)">
          <span>GitHub</span>
          <i class="iconfont icon-link"></i>
        </a>
      </BlockItem>
    </Card>
    <Card title="关于I便笺">
      <div class="about-app-description">
        <p>版本：{{ version }}</p>
        <p>平台: {{ appInfo.node }}</p>
        <p>渲染引擎: {{ appInfo.chrome }}</p>
        <p>框架: {{ appInfo.tauri }}</p>
        <p>Copyright (c) {{ currentYear }} {{ packageJson.author }}.</p>
      </div>
    </Card>
    <Teleport to="body">
      <IMessageBox v-model="clearBtnState" @on-confirm="resetStore" @on-cancel="clearBtnState = false">
        <p class="text">清除缓存后配置将重置，可能会出现错误。确认清除？</p>
      </IMessageBox>
    </Teleport>
  </main>
</template>

<script setup lang="ts">
import ISwitch from '@/components/ISwitch.vue';
import { notesState, resetStore } from '@/store/notes.state';
import { getErrorLogPath } from '@/utils/errorLog';
import useMessage from '@/components/IMessage';
import Card from './components/Card.vue';
import BlockItem from './components/BlockItem.vue';
import ICopy from '@/components/ICopy.vue';
import IInput from '@/components/IInput.vue';
import { ref } from 'vue';
import IMessageBox from '../../components/IMessageBox.vue';
import packageJson from '../../../package.json';
import { exists } from '@tauri-apps/plugin-fs';
import { open as openShell } from '@tauri-apps/plugin-shell';
import { getVersion } from '@tauri-apps/api/app';

// 应用信息
const appInfo = {
  node: 'Tauri/Rust',
  chrome: 'WebView',
  tauri: 'v2.0'
};
const currentYear = new Date().getFullYear();
const version = ref('');
const issueLink = 'https://github.com/XiaoLinXiaoZhu/INote-tauri/issues';
const githubLink = 'https://github.com/XiaoLinXiaoZhu/INote-tauri';
const clearBtnState = ref(false);

// 获取应用版本
getVersion().then(v => {
  version.value = v;
}).catch(() => {
  version.value = packageJson.version;
});

const openLogFolder = async () => {
  try {
    const errorLogPath = await getErrorLogPath();
    const logExists = await exists(errorLogPath);
    if (logExists) {
      await openShell(errorLogPath, 'folder');
    } else {
      useMessage('ヾ(≧▽≦*)o暂时没有bug', 'success');
    }
  } catch (error) {
    console.error('打开日志文件夹失败:', error);
    useMessage('打开日志文件夹失败', 'error');
  }
};

const openExternal = async (link: string) => {
  try {
    await openShell(link);
  } catch (error) {
    console.error('打开外部链接失败:', error);
    useMessage('打开链接失败', 'error');
  }
};

const changeAutoNarrow = (data: boolean) => {
  if (!data) {
    notesState.value.switchStatus.autoNarrowPure = false;
  }
};

const openImagesUrlDir = async () => {
  try {
    await openShell(notesState.value.imagesCacheUrl, 'folder');
  } catch (error) {
    console.error('打开图片目录失败:', error);
    useMessage('打开图片目录失败', 'error');
  }
};
</script>

<style lang="less" scoped>
.page-setting {
  height: calc(100% - @iconSize);
  background-color: @white-color;
  padding: 12px;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;

  .block {
    padding: 14px 0;
    box-sizing: border-box;
    border-bottom: 1px solid @border-color;

    &-title {
      font-size: 15px;
      margin-bottom: 15px;
      font-weight: bold;
    }

    &:last-child {
      border-bottom: none;
    }
  }
}

.block-content {
  .block-line {
    font-size: 14px;
    margin-bottom: 14px;
    transition: all 0.4s;

    .iconfont {
      font-size: 20px;
      margin-right: 6px;
    }

    &:last-child {
      margin-bottom: 0 !important;
      transition: all 0.4s;
    }

    .undeveloped {
      display: none;
    }
  }
}

.about-app-description {
  font-size: 12px;
  color: @text-sub-color;
}

.block-important {
  background-color: @gray-color;
  color: @text-color;
  display: inline-block;
  line-height: 1;
  padding: 1px 2px;
  margin: 0 2px;
}
</style>
