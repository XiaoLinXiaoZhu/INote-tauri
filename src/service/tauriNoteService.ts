import Database from '@tauri-apps/plugin-sql';

export interface NoteModel {
  id?: number;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
  color?: string;
  is_pinned?: boolean;
}

class TauriNoteService {
  private db: Database | null = null;

  async initialize() {
    try {
      this.db = await Database.load('sqlite:i-notes.db');
      await this.createTables();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) return;
    
    const createNotesTable = `
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        color TEXT DEFAULT '#ffd54f',
        is_pinned BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await this.db.execute(createNotesTable);
  }

  async getAllNotes(): Promise<NoteModel[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.select<NoteModel[]>(
      'SELECT * FROM notes ORDER BY is_pinned DESC, updated_at DESC'
    );
    return result;
  }

  async getNoteById(id: number): Promise<NoteModel | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.select<NoteModel[]>(
      'SELECT * FROM notes WHERE id = ?',
      [id]
    );
    return result.length > 0 ? result[0] : null;
  }

  async createNote(note: Omit<NoteModel, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.execute(
      'INSERT INTO notes (title, content, color, is_pinned) VALUES (?, ?, ?, ?)',
      [note.title, note.content, note.color || '#ffd54f', note.is_pinned || false]
    );
    
    return result.lastInsertId;
  }

  async updateNote(id: number, note: Partial<NoteModel>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
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
    
    await this.db.execute(
      `UPDATE notes SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteNote(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.execute('DELETE FROM notes WHERE id = ?', [id]);
  }

  async searchNotes(keyword: string): Promise<NoteModel[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.select<NoteModel[]>(
      'SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY is_pinned DESC, updated_at DESC',
      [`%${keyword}%`, `%${keyword}%`]
    );
    return result;
  }
}

export const noteService = new TauriNoteService();
