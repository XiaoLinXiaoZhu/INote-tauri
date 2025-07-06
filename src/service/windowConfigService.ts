import Database from '@tauri-apps/plugin-sql';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { LogicalPosition, LogicalSize } from '@tauri-apps/api/window';

export interface WindowConfig {
  id?: number;
  window_id: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  created_at?: string;
  updated_at?: string;
}

class WindowConfigService {
  private db: Database | null = null;
  private static instance: WindowConfigService | null = null;

  static getInstance(): WindowConfigService {
    if (!WindowConfigService.instance) {
      WindowConfigService.instance = new WindowConfigService();
    }
    return WindowConfigService.instance;
  }

  async initialize() {
    if (this.db) return;
    
    console.log('🚀 Initializing WindowConfigService');
    this.db = await Database.load('sqlite:i-notes.db');
    await this.createTable();
  }

  private async createTable() {
    if (!this.db) return;

    try {
      // 检查表是否存在
      const tableExists = await this.db.select(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='window_configs'"
      ) as any[];

      if (tableExists.length === 0) {
        // 创建窗口配置表
        const createTableSql = `
          CREATE TABLE window_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            window_id TEXT UNIQUE,
            width INTEGER NOT NULL DEFAULT 400,
            height INTEGER NOT NULL DEFAULT 600,
            x INTEGER,
            y INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `;
        await this.db.execute(createTableSql);
        console.log('✅ Window configs table created successfully');
      }
    } catch (error) {
      console.error('❌ Failed to create window_configs table:', error);
      throw error;
    }
  }

  /**
   * 保存窗口配置
   */
  async saveWindowConfig(windowId: string, width: number, height: number, x?: number, y?: number): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) return; // 再次检查确保初始化成功

    try {
      const now = new Date().toISOString();
      
      // 尝试更新现有记录
      const updateResult = await this.db.execute(
        `UPDATE window_configs 
         SET width = ?, height = ?, x = ?, y = ?, updated_at = ?
         WHERE window_id = ?`,
        [width, height, x || null, y || null, now, windowId]
      );

      // 如果没有更新任何记录，则插入新记录
      if (updateResult.rowsAffected === 0) {
        await this.db.execute(
          `INSERT INTO window_configs (window_id, width, height, x, y, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [windowId, width, height, x || null, y || null, now, now]
        );
      }

      console.log(`✅ Window config saved for ${windowId}: ${width}x${height}`, x !== undefined ? `at (${x}, ${y})` : '');
    } catch (error) {
      console.error('❌ Failed to save window config:', error);
      throw error;
    }
  }

  /**
   * 获取窗口配置
   */
  async getWindowConfig(windowId: string): Promise<WindowConfig | null> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) return null;

    try {
      const result = await this.db.select<WindowConfig[]>(
        'SELECT * FROM window_configs WHERE window_id = ?',
        [windowId]
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('❌ Failed to get window config:', error);
      return null;
    }
  }

  /**
   * 删除窗口配置
   */
  async deleteWindowConfig(windowId: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) return;

    try {
      await this.db.execute(
        'DELETE FROM window_configs WHERE window_id = ?',
        [windowId]
      );
      console.log(`✅ Window config deleted for ${windowId}`);
    } catch (error) {
      console.error('❌ Failed to delete window config:', error);
      throw error;
    }
  }

  /**
   * 监听窗口大小和位置变化并自动保存
   */
  async startWindowConfigTracking(window: WebviewWindow, windowId: string) {
    let saveTimeout: number;

    const saveConfig = async () => {
      try {
        const size = await window.innerSize();
        const position = await window.innerPosition();
        
        await this.saveWindowConfig(
          windowId,
          Math.round(size.width),
          Math.round(size.height),
          Math.round(position.x),
          Math.round(position.y)
        );
      } catch (error) {
        console.error('Failed to save window config during tracking:', error);
      }
    };

    // 防抖保存，避免频繁写入数据库
    const debouncedSave = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveConfig, 1000); // 1秒后保存
    };

    // 监听窗口大小变化
    const unlistenResize = await window.listen('tauri://resize', debouncedSave);
    
    // 监听窗口位置变化
    const unlistenMove = await window.listen('tauri://move', debouncedSave);

    // 监听窗口关闭，立即保存配置
    const unlistenClose = await window.listen('tauri://close-requested', async () => {
      clearTimeout(saveTimeout);
      await saveConfig();
      unlistenResize();
      unlistenMove();
      unlistenClose();
    });

    return () => {
      clearTimeout(saveTimeout);
      unlistenResize();
      unlistenMove();
      unlistenClose();
    };
  }

  /**
   * 应用窗口配置到窗口
   */
  async applyWindowConfig(window: WebviewWindow, windowId: string, defaultWidth = 400, defaultHeight = 600) {
    try {
      const config = await this.getWindowConfig(windowId);
      
      if (config) {
        // 应用保存的尺寸
        await window.setSize(new LogicalSize(config.width, config.height));
        
        // 如果有位置信息，也应用位置
        if (config.x !== null && config.y !== null && config.x !== undefined && config.y !== undefined) {
          await window.setPosition(new LogicalPosition(config.x, config.y));
        }
        
        console.log(`✅ Applied saved config to ${windowId}: ${config.width}x${config.height}`, 
                   config.x !== null ? `at (${config.x}, ${config.y})` : '');
      } else {
        // 使用默认配置
        await window.setSize(new LogicalSize(defaultWidth, defaultHeight));
        console.log(`✅ Applied default config to ${windowId}: ${defaultWidth}x${defaultHeight}`);
      }
    } catch (error) {
      console.error('❌ Failed to apply window config:', error);
    }
  }
}

export const windowConfigService = WindowConfigService.getInstance();
