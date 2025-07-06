import Database from '@tauri-apps/plugin-sql';

export interface NoteModel {
  id?: number;
  uid?: string;
  title: string;
  content: string;
  markdown?: string; // 添加 markdown 字段
  created_at?: string;
  updated_at?: string;
  color?: string;
  is_pinned?: boolean;
}

// 延迟导入windowConfigService以避免循环依赖
let windowConfigService: any = null;
const getWindowConfigService = async () => {
  if (!windowConfigService) {
    const module = await import('./windowConfigService');
    windowConfigService = module.windowConfigService;
  }
  return windowConfigService;
};

class TauriNoteService {
  private db: Database | null = null;
  private initPromise: Promise<void> | null = null;
  private isInitialized = false;
  private static instance: TauriNoteService | null = null;

  // 单例模式，确保在多个窗口中共享同一个数据库实例
  static getInstance(): TauriNoteService {
    if (!TauriNoteService.instance) {
      TauriNoteService.instance = new TauriNoteService();
    }
    return TauriNoteService.instance;
  }

  async initialize() {
    // 如果已经初始化，直接返回
    if (this.isInitialized) {
      console.log('🚀 Database already initialized, skipping...');
      return;
    }
    
    // 如果正在初始化，等待初始化完成
    if (this.initPromise) {
      console.log('🚀 Database initialization in progress, waiting...');
      return this.initPromise;
    }
    
    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize() {
    console.log('🚀 Initializing Tauri database service');
    try {
      console.log('🚀 Loading database...');
      this.db = await Database.load('sqlite:i-notes.db');
      console.log('🚀 Database loaded successfully');
      
      console.log('🚀 Creating/checking tables...');
      await this.createTables();
      console.log('🚀 Tables created/checked successfully');
      
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }
  
  private async ensureInitialized() {
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized');
    }
  }

  private async createTables() {
    if (!this.db) return;
    
    // 先检查表是否存在，如果存在则添加 uid 列
    try {
      const tableExists = await this.db.select(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='notes'
      `) as any[];
      
      if (tableExists.length > 0) {
        // 表存在，检查是否有 uid 列和 markdown 列
        const columns = await this.db.select(`PRAGMA table_info(notes)`) as any[];
        const hasUidColumn = columns.some((col: any) => col.name === 'uid');
        const hasMarkdownColumn = columns.some((col: any) => col.name === 'markdown');
        
        if (!hasUidColumn) {
          // 添加 uid 列
          await this.db.execute('ALTER TABLE notes ADD COLUMN uid TEXT');
          
          // 为现有记录生成 uid
          const existingNotes = await this.db.select('SELECT id FROM notes') as any[];
          for (const note of existingNotes) {
            const uid = this.generateUid();
            await this.db.execute('UPDATE notes SET uid = ? WHERE id = ?', [uid, note.id]);
          }
        }
        
        if (!hasMarkdownColumn) {
          // 添加 markdown 列
          await this.db.execute('ALTER TABLE notes ADD COLUMN markdown TEXT DEFAULT ""');
        }
      } else {
        // 表不存在，创建新表
        const createNotesTable = `
          CREATE TABLE notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uid TEXT UNIQUE,
            title TEXT NOT NULL DEFAULT '',
            content TEXT NOT NULL DEFAULT '',
            markdown TEXT DEFAULT '',
            color TEXT DEFAULT '#ffd54f',
            is_pinned BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `;
        await this.db.execute(createNotesTable);
      }
    } catch (error) {
      console.error('Database migration error:', error);
      throw error;
    }
  }

  private generateUid(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async getAllNotes(): Promise<NoteModel[]> {
    console.log('🚀 Getting all notes from database');
    await this.ensureInitialized();
    
    try {
      const result = await this.db!.select<NoteModel[]>(
        'SELECT * FROM notes ORDER BY is_pinned DESC, updated_at DESC'
      );
      console.log('🚀 getAllNotes result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error getting all notes:', error);
      throw error;
    }
  }

  async getNoteById(id: number): Promise<NoteModel | null> {
    await this.ensureInitialized();
    
    const result = await this.db!.select<NoteModel[]>(
      'SELECT * FROM notes WHERE id = ?',
      [id]
    );
    return result.length > 0 ? result[0] : null;
  }

  async getNoteByUid(uid: string): Promise<NoteModel | null> {
    await this.ensureInitialized();
    
    const result = await this.db!.select<NoteModel[]>(
      'SELECT * FROM notes WHERE uid = ?',
      [uid]
    );
    return result.length > 0 ? result[0] : null;
  }

  async createNote(note: Omit<NoteModel, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    await this.ensureInitialized();
    
    const result = await this.db!.execute(
      'INSERT INTO notes (uid, title, content, markdown, color, is_pinned) VALUES (?, ?, ?, ?, ?, ?)',
      [note.uid || '', note.title, note.content, note.markdown || '', note.color || '#ffd54f', note.is_pinned || false]
    );
    
    return result.lastInsertId || 0;
  }

  async updateNote(id: number, note: Partial<NoteModel>): Promise<void> {
    await this.ensureInitialized();
    
    const fields = [];
    const values = [];
    
    if (note.title !== undefined) {
      fields.push('title = ?');
      values.push(note.title);
    }
    if (note.content !== undefined) {
      fields.push('content = ?');
      values.push(note.content);
    }
    if (note.markdown !== undefined) {
      fields.push('markdown = ?');
      values.push(note.markdown);
    }
    if (note.color !== undefined) {
      fields.push('color = ?');
      values.push(note.color);
    }
    if (note.is_pinned !== undefined) {
      fields.push('is_pinned = ?');
      values.push(note.is_pinned);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await this.db!.execute(
      `UPDATE notes SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteNote(id: number): Promise<void> {
    await this.ensureInitialized();
    
    // 先获取便签的UID以便清理窗口配置
    const note = await this.db!.select<NoteModel[]>(
      'SELECT uid FROM notes WHERE id = ?',
      [id]
    );
    
    // 删除便签数据
    await this.db!.execute('DELETE FROM notes WHERE id = ?', [id]);
    
    // 如果找到了UID，清理相关的窗口配置
    if (note.length > 0 && note[0].uid) {
      try {
        const windowConfigService = await getWindowConfigService();
        await windowConfigService.deleteWindowConfig(`editor_${note[0].uid}`);
        console.log(`✅ Window config cleaned for deleted note ${note[0].uid}`);
      } catch (error) {
        console.warn(`⚠️ Failed to clean window config for note ${note[0].uid}:`, error);
      }
    }
  }

  async updateNoteByUid(uid: string, note: Partial<NoteModel>): Promise<void> {
    await this.ensureInitialized();
    
    const fields = [];
    const values = [];
    
    if (note.title !== undefined) {
      fields.push('title = ?');
      values.push(note.title);
    }
    if (note.content !== undefined) {
      fields.push('content = ?');
      values.push(note.content);
    }
    if (note.markdown !== undefined) {
      fields.push('markdown = ?');
      values.push(note.markdown);
    }
    if (note.color !== undefined) {
      fields.push('color = ?');
      values.push(note.color);
    }
    if (note.is_pinned !== undefined) {
      fields.push('is_pinned = ?');
      values.push(note.is_pinned);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(uid);
    
    await this.db!.execute(
      `UPDATE notes SET ${fields.join(', ')} WHERE uid = ?`,
      values
    );
  }

  async deleteNoteByUid(uid: string): Promise<void> {
    await this.ensureInitialized();
    
    // 删除便签数据
    await this.db!.execute('DELETE FROM notes WHERE uid = ?', [uid]);
    
    // 清理相关的窗口配置
    try {
      const windowConfigService = await getWindowConfigService();
      await windowConfigService.deleteWindowConfig(`editor_${uid}`);
      console.log(`✅ Window config cleaned for deleted note ${uid}`);
    } catch (error) {
      console.warn(`⚠️ Failed to clean window config for note ${uid}:`, error);
    }
  }

  async searchNotes(keyword: string): Promise<NoteModel[]> {
    await this.ensureInitialized();
    
    const result = await this.db!.select<NoteModel[]>(
      'SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY is_pinned DESC, updated_at DESC',
      [`%${keyword}%`, `%${keyword}%`]
    );
    return result;
  }
}

export const noteService = TauriNoteService.getInstance();
