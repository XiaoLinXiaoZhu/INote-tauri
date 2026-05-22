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
import type { NoteListItem } from '@/types/notes';

const emits = defineEmits(['onSearch']);
const searchValue = ref('');

onMounted(async () => {
  await searchDb();
});

const searchDb = async () => {
  try {
    const data = searchValue.value
      ? await noteService.searchNotes(searchValue.value)
      : await noteService.getAllNotes();

    const formattedData: NoteListItem[] = data.map(note => ({
      uid: note.uid || '',
      className: note.color || '',
      mdContent: note.md_content || '',
      htmlSnapshot: note.html_snapshot || '',
      createdAt: new Date(note.created_at || ''),
      updatedAt: new Date(note.updated_at || ''),
    }));

    emits('onSearch', formattedData, searchValue.value);
  } catch (error) {
    console.error('搜索笔记失败:', error);
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
