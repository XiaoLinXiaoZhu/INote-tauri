<template>
  <div class="progress">
    <el-progress type="circle" :percentage="percentage" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { listen } from '@tauri-apps/api/event';

const percentage = ref(0);

onMounted(async () => {
  // 监听 Tauri 的更新进度事件
  await listen('update-download-progress', (event) => {
    const progress = event.payload as { percent: number };
    percentage.value = Math.round(progress.percent);
  });
});
</script>
<style lang="less" scoped>
.progress {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
