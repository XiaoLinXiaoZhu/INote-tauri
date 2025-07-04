<template>
  <div class="search-box">
    <div class="search flex-items">
      <div class="search-input flex1">
        <input v-model="searchValue" type="text" spellcheck="false" @keydown.enter="searchDb" placeholder="搜索..." />
      </div>
      <button class="search-button" @click="searchDb">
        <i class="iconfont icon-search"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { noteService } from '@/service/tauriNoteService';

console.log('🚀 Search component loaded');

const emits = defineEmits(['onSearch']);
const searchValue = ref('');

onMounted(async () => {
  console.log('🚀 Search component mounted, performing initial search');
  try {
    await searchDb();
    console.log('🚀 Initial search completed');
  } catch (error) {
    console.error('❌ Initial search failed:', error);
  }
});

const searchDb = async () => {
  console.log('🚀 Searching database with value:', searchValue.value);
  try {
    // 如果有搜索内容，使用搜索功能；否则获取所有笔记
    const data = searchValue.value 
      ? await noteService.searchNotes(searchValue.value)
      : await noteService.getAllNotes();
    
    console.log('🚀 Database search result:', data);
    
    // 转换数据格式以保持兼容性
    const formattedData = data.map(note => ({
      uid: note.title,
      className: note.color || '',
      content: note.content,
      markdown: note.content,
      interception: note.content.substring(0, 500),
      createdAt: note.created_at,
      updatedAt: note.updated_at
    }));
    
    console.log('🚀 Formatted data:', formattedData);
    emits('onSearch', formattedData, searchValue.value);
  } catch (error) {
    console.error('❌ 搜索笔记失败:', error);
    emits('onSearch', [], searchValue.value);
  }
};
</script>

<style lang="less" scoped>
.search-box {
  padding: 0 12px;
  padding-top: 10px;
  box-sizing: border-box;
}

.search {
  background-color: @background-sub-color;
  height: 34px;
  opacity: 0.9;

  .search-input {
    input {
      display: block;
      width: 100%;
      height: 100%;
      border: none;
      background-color: transparent;
      font-size: 14px;
      padding: 0 18px;
    }
  }

  .search-button {
    display: block;
    border: none;
    width: 36px;
    height: 100%;
    padding: 0;
    background-color: transparent;

    .iconfont {
      font-size: 20px;
    }

    &:hover {
      background-color: #e0e0e0;
    }
  }

  &:hover {
    opacity: 1;
  }

  &:active {
    opacity: 1;
  }
}
</style>
