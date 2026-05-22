use rusqlite::{Connection, params};
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct WindowConfig {
    pub window_id: String,
    pub width: i32,
    pub height: i32,
    pub x: Option<i32>,
    pub y: Option<i32>,
}

pub struct WindowConfigStore {
    conn: Mutex<Connection>,
}

impl WindowConfigStore {
    pub fn new(db_path: PathBuf) -> Result<Self, String> {
        let conn = Connection::open(&db_path)
            .map_err(|e| format!("Failed to open database at {:?}: {}", db_path, e))?;

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS window_configs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                window_id TEXT UNIQUE NOT NULL,
                width INTEGER NOT NULL DEFAULT 400,
                height INTEGER NOT NULL DEFAULT 600,
                x INTEGER,
                y INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )"
        ).map_err(|e| format!("Failed to create table: {}", e))?;

        Ok(Self { conn: Mutex::new(conn) })
    }

    pub fn get(&self, window_id: &str) -> Result<Option<WindowConfig>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT window_id, width, height, x, y FROM window_configs WHERE window_id = ?1")
            .map_err(|e| e.to_string())?;

        let result = stmt.query_row(params![window_id], |row| {
            Ok(WindowConfig {
                window_id: row.get(0)?,
                width: row.get(1)?,
                height: row.get(2)?,
                x: row.get(3)?,
                y: row.get(4)?,
            })
        });

        match result {
            Ok(config) => Ok(Some(config)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    }

    pub fn save(&self, config: &WindowConfig) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;

        let updated = conn.execute(
            "UPDATE window_configs SET width = ?1, height = ?2, x = ?3, y = ?4, updated_at = CURRENT_TIMESTAMP WHERE window_id = ?5",
            params![config.width, config.height, config.x, config.y, config.window_id],
        ).map_err(|e| e.to_string())?;

        if updated == 0 {
            conn.execute(
                "INSERT INTO window_configs (window_id, width, height, x, y) VALUES (?1, ?2, ?3, ?4, ?5)",
                params![config.window_id, config.width, config.height, config.x, config.y],
            ).map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    pub fn delete(&self, window_id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "DELETE FROM window_configs WHERE window_id = ?1",
            params![window_id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;


    fn temp_store() -> WindowConfigStore {
        // 使用内存数据库进行测试
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS window_configs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                window_id TEXT UNIQUE NOT NULL,
                width INTEGER NOT NULL DEFAULT 400,
                height INTEGER NOT NULL DEFAULT 600,
                x INTEGER,
                y INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )"
        ).unwrap();
        WindowConfigStore { conn: Mutex::new(conn) }
    }

    #[test]
    fn get_returns_none_for_nonexistent() {
        let store = temp_store();
        let result = store.get("nonexistent").unwrap();
        assert!(result.is_none());
    }

    #[test]
    fn save_and_get_with_position() {
        let store = temp_store();
        let config = WindowConfig {
            window_id: "editor_abc".to_string(),
            width: 500,
            height: 400,
            x: Some(100),
            y: Some(200),
        };
        store.save(&config).unwrap();

        let loaded = store.get("editor_abc").unwrap().unwrap();
        assert_eq!(loaded.width, 500);
        assert_eq!(loaded.height, 400);
        assert_eq!(loaded.x, Some(100));
        assert_eq!(loaded.y, Some(200));
    }

    #[test]
    fn save_and_get_without_position() {
        let store = temp_store();
        let config = WindowConfig {
            window_id: "main".to_string(),
            width: 400,
            height: 600,
            x: None,
            y: None,
        };
        store.save(&config).unwrap();

        let loaded = store.get("main").unwrap().unwrap();
        assert_eq!(loaded.width, 400);
        assert_eq!(loaded.height, 600);
        assert_eq!(loaded.x, None);
        assert_eq!(loaded.y, None);
    }

    #[test]
    fn save_updates_existing() {
        let store = temp_store();
        store.save(&WindowConfig {
            window_id: "win1".to_string(),
            width: 300,
            height: 200,
            x: Some(10),
            y: Some(20),
        }).unwrap();

        store.save(&WindowConfig {
            window_id: "win1".to_string(),
            width: 600,
            height: 500,
            x: Some(50),
            y: Some(80),
        }).unwrap();

        let loaded = store.get("win1").unwrap().unwrap();
        assert_eq!(loaded.width, 600);
        assert_eq!(loaded.height, 500);
        assert_eq!(loaded.x, Some(50));
        assert_eq!(loaded.y, Some(80));
    }

    #[test]
    fn delete_removes_config() {
        let store = temp_store();
        store.save(&WindowConfig {
            window_id: "to_delete".to_string(),
            width: 100,
            height: 100,
            x: None,
            y: None,
        }).unwrap();

        store.delete("to_delete").unwrap();
        let result = store.get("to_delete").unwrap();
        assert!(result.is_none());
    }

    #[test]
    fn delete_nonexistent_is_ok() {
        let store = temp_store();
        let result = store.delete("never_existed");
        assert!(result.is_ok());
    }

    #[test]
    fn multiple_windows_independent() {
        let store = temp_store();
        store.save(&WindowConfig {
            window_id: "win_a".to_string(),
            width: 100, height: 100, x: Some(0), y: Some(0),
        }).unwrap();
        store.save(&WindowConfig {
            window_id: "win_b".to_string(),
            width: 200, height: 200, x: Some(10), y: Some(10),
        }).unwrap();

        let a = store.get("win_a").unwrap().unwrap();
        let b = store.get("win_b").unwrap().unwrap();
        assert_eq!(a.width, 100);
        assert_eq!(b.width, 200);

        store.delete("win_a").unwrap();
        assert!(store.get("win_a").unwrap().is_none());
        assert!(store.get("win_b").unwrap().is_some());
    }
}
