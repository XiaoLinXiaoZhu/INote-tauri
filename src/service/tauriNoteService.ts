import Database from '@tauri-apps/plugin-sql';

export interface NoteModel {
  id?: number;
  uid?: string;
  title: string;
  md_content: string;
  html_snapshot: string;
  created_at?: string;
  updated_at?: string;
  color?: string;
  is_pinned?: boolean;
}

class TauriNoteService {
  private db: Database | null = null;
  private initPromise: Promise<void> | null = null;
  private isInitialized = false;
  private static instance: TauriNoteService | null = null;

  static getInstance(): TauriNoteService {
    if (!TauriNoteService.instance) {
      TauriNoteService.instance = new TauriNoteService();
    }
    return TauriNoteService.instance;
  }

  async initialize() {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize() {
    try {
      this.db = await Database.load('sqlite:i-notes.db');
      await this.createTables();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
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

    // 不做迁移，直接确保表结构正确
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT UNIQUE,
        title TEXT NOT NULL DEFAULT '',
        md_content TEXT NOT NULL DEFAULT '',
        html_snapshot TEXT NOT NULL DEFAULT '',
        color TEXT DEFAULT '',
        is_pinned BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async getAllNotes(): Promise<NoteModel[]> {
    await this.ensureInitialized();
    return await this.db!.select<NoteModel[]>(
      'SELECT * FROM notes ORDER BY is_pinned DESC, updated_at DESC'
    );
  }

  async getNoteByUid(uid: string): Promise<NoteModel | null> {
    await this.ensureInitialized();
    const result = await this.db!.select<NoteModel[]>(
      'SELECT * FROM notes WHERE uid = ?',
      [uid]
    );
    return result.length > 0 ? result[0] : null;
  }

  async createNote(note: { uid: string; title: string; md_content: string; html_snapshot: string; color: string }): Promise<number> {
    await this.ensureInitialized();
    const result = await this.db!.execute(
      'INSERT INTO notes (uid, title, md_content, html_snapshot, color, is_pinned) VALUES (?, ?, ?, ?, ?, ?)',
      [note.uid, note.title, note.md_content, note.html_snapshot, note.color || '', false]
    );
    return result.lastInsertId || 0;
  }

  async updateNoteByUid(uid: string, note: Partial<Pick<NoteModel, 'title' | 'md_content' | 'html_snapshot' | 'color' | 'is_pinned'>>): Promise<void> {
    await this.ensureInitialized();

    const fields: string[] = [];
    const values: any[] = [];

    if (note.title !== undefined) {
      fields.push('title = ?');
      values.push(note.title);
    }
    if (note.md_content !== undefined) {
      fields.push('md_content = ?');
      values.push(note.md_content);
    }
    if (note.html_snapshot !== undefined) {
      fields.push('html_snapshot = ?');
      values.push(note.html_snapshot);
    }
    if (note.color !== undefined) {
      fields.push('color = ?');
      values.push(note.color);
    }
    if (note.is_pinned !== undefined) {
      fields.push('is_pinned = ?');
      values.push(note.is_pinned);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(uid);

    await this.db!.execute(
      `UPDATE notes SET ${fields.join(', ')} WHERE uid = ?`,
      values
    );
  }

  async deleteNoteByUid(uid: string): Promise<void> {
    await this.ensureInitialized();
    await this.db!.execute('DELETE FROM notes WHERE uid = ?', [uid]);

    try {
      const { windowManager } = await import('./windowManager');
      await windowManager.deleteWindowConfig(`editor_${uid}`);
    } catch (error) {
      console.warn('Failed to clean window config:', error);
    }
  }

  async searchNotes(keyword: string): Promise<NoteModel[]> {
    await this.ensureInitialized();
    return await this.db!.select<NoteModel[]>(
      'SELECT * FROM notes WHERE title LIKE ? OR md_content LIKE ? ORDER BY is_pinned DESC, updated_at DESC',
      [`%${keyword}%`, `%${keyword}%`]
    );
  }
}

export const noteService = TauriNoteService.getInstance();
