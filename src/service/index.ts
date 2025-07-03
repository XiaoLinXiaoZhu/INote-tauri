import { noteService } from './tauriNoteService';

// 创建一个兼容层，用于保持与原有 Notes 接口的兼容性
export const Notes = {
  async create(data: any) {
    try {
      await noteService.initialize(); // 确保初始化
      const note = {
        title: data.uid || '',
        content: data.content || '',
        color: data.className || '#ffd54f',
        is_pinned: false
      };
      const id = await noteService.createNote(note);
      return { id, ...data };
    } catch (error) {
      console.error('创建笔记失败:', error);
      throw error;
    }
  },

  async findOne(options: any = {}) {
    try {
      await noteService.initialize(); // 确保初始化
      const where = options.where || {};
      const uid = where.uid;
      if (!uid) return null;
      
      const notes = await noteService.getAllNotes();
      const note = notes.find(note => note.title === uid);
      
      if (!note) return null;
      
      return {
        uid: note.title,
        className: note.color || '',
        content: note.content,
        markdown: note.content,
        interception: note.content.substring(0, 500)
      };
    } catch (error) {
      console.error('查询笔记失败:', error);
      return null;
    }
  },
  
  async update(data: any, options: any = {}) {
    try {
      await noteService.initialize(); // 确保初始化
      const where = options.where || {};
      const uid = where.uid;
      if (!uid) return false;
      
      const notes = await noteService.getAllNotes();
      const note = notes.find(note => note.title === uid);
      
      if (!note) return false;
      
      await noteService.updateNote(note.id!, {
        title: uid,
        content: data.content || note.content,
        color: data.className || note.color
      });
      
      return true;
    } catch (error) {
      console.error('更新笔记失败:', error);
      return false;
    }
  },
  
  async destroy(options: any = {}) {
    try {
      await noteService.initialize(); // 确保初始化
      const where = options.where || {};
      const uid = where.uid;
      if (!uid) return false;
      
      const notes = await noteService.getAllNotes();
      const note = notes.find(note => note.title === uid);
      
      if (!note) return false;
      
      await noteService.deleteNote(note.id!);
      return true;
    } catch (error) {
      console.error('删除笔记失败:', error);
      return false;
    }
  },
  
  async findAll() {
    try {
      await noteService.initialize(); // 确保初始化
      const notes = await noteService.getAllNotes();
      
      return notes.map(note => ({
        uid: note.title,
        className: note.color || '',
        content: note.content,
        markdown: note.content,
        interception: note.content.substring(0, 500),
        createdAt: note.created_at,
        updatedAt: note.updated_at
      }));
    } catch (error) {
      console.error('获取所有笔记失败:', error);
      return [];
    }
  }
};

export { noteService };
