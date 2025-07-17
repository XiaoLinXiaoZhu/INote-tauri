## Bug Report : 刷新页面导致内容丢失

State : Resolved

### Description
在编辑器中刷新页面后，之前编辑的内容丢失。

### Steps to Reproduce
1. 打开编辑器并输入一些内容。
2. 刷新页面。
3. 注意到内容丢失。

### Expected Behavior
编辑器在刷新后能够恢复之前的内容。

### Actual Behavior
编辑器在刷新后无法恢复之前的内容。

## Bug Report : 刷新页面后，窗口无法正常关闭，而是页面消失后仍然留有一个透明的虚影

### Description
刷新页面后，编辑器窗口无法正常关闭。点击关闭按钮后，窗口消失，但仍然留有一个透明的虚影。

### Steps to Reproduce
1. 打开编辑器窗口。
2. Ctrl + R 刷新页面。
3. 点击关闭按钮。

### Expected Behavior
窗口应该正常关闭，不留任何虚影。    

### Actual Behavior
点击关闭按钮后，窗口消失，但仍然留有一个透明的虚影。

### Additional Context
猜测可能和上面的内容丢失问题有关。控制台输出正常，未见异常。

但是命令行打印日志：
```
🚀 Starting INote-tauri application...
🚀 Initializing Tauri application...
🚀 Creating Tauri builder...
🚀 Tauri app setup completed
[2025-07-17][08:17:26][sqlx::query][DEBUG] summary="PRAGMA foreign_keys = ON; …" db.statement="\n\nPRAGMA foreign_keys = ON; \n" rows_affected=0 rows_returned=0 elapsed=65µs elapsed_secs=6.5e-5
[2025-07-17][08:17:26][sqlx::query][DEBUG] summary="SELECT name FROM sqlite_master …" db.statement="\n\n\n        SELECT name FROM sqlite_master WHERE type='table' AND name='notes'\n      \n" rows_affected=0 rows_returned=1 elapsed=1.6335ms elapsed_secs=0.0016335
[2025-07-17][08:17:26][sqlx::query][DEBUG] summary="PRAGMA table_info(notes)" db.statement="" rows_affected=0 rows_returned=9 elapsed=191.3µs elapsed_secs=0.0001913
[2025-07-17][08:17:26][sqlx::query][DEBUG] summary="PRAGMA foreign_keys = ON; …" db.statement="\n\nPRAGMA foreign_keys = ON; \n" rows_affected=0 rows_returned=0 elapsed=109.1µs elapsed_secs=0.0001091
[2025-07-17][08:17:26][sqlx::query][DEBUG] summary="SELECT name FROM sqlite_master …" db.statement="\n\nSELECT name FROM sqlite_master WHERE type='table' AND name='window_configs'\n" rows_affected=0 rows_returned=1 elapsed=2.8672ms elapsed_secs=0.0028672
[2025-07-17][08:17:26][sqlx::query][DEBUG] summary="SELECT * FROM notes …" db.statement="\n\nSELECT * FROM notes ORDER BY is_pinned DESC, updated_at DESC\n" rows_affected=0 rows_returned=1 elapsed=312.3µs elapsed_secs=0.0003123
[2025-07-17][08:17:26][sqlx::query][DEBUG] summary="SELECT * FROM notes …" db.statement="\n\nSELECT * FROM notes ORDER BY is_pinned DESC, updated_at DESC\n" rows_affected=0 rows_returned=1 elapsed=121.2µs elapsed_secs=0.0001212
[2025-07-17][08:17:30][sqlx::query][DEBUG] summary="SELECT * FROM window_configs …" db.statement="\n\nSELECT * FROM window_configs WHERE window_id = ?\n" rows_affected=0 rows_returned=1 elapsed=256.9µs elapsed_secs=0.0002569
[2025-07-17][08:17:31][sqlx::query][DEBUG] summary="SELECT * FROM notes …" db.statement="\n\nSELECT * FROM notes ORDER BY is_pinned DESC, updated_at DESC\n" rows_affected=0 rows_returned=1 elapsed=136.6µs elapsed_secs=0.0001366
[2025-07-17][08:17:31][sqlx::query][DEBUG] summary="PRAGMA foreign_keys = ON; …" db.statement="\n\nPRAGMA foreign_keys = ON; \n" rows_affected=0 rows_returned=0 elapsed=73.1µs elapsed_secs=7.31e-5
[2025-07-17][08:17:31][sqlx::query][DEBUG] summary="SELECT name FROM sqlite_master …" db.statement="\n\n\n        SELECT name FROM sqlite_master WHERE type='table' AND name='notes'\n      \n" rows_affected=0 rows_returned=1 elapsed=2.6982ms elapsed_secs=0.0026982
[2025-07-17][08:17:31][sqlx::query][DEBUG] summary="PRAGMA table_info(notes)" db.statement="" rows_affected=0 rows_returned=9 elapsed=231.2µs elapsed_secs=0.0002312
[2025-07-17][08:17:31][sqlx::query][DEBUG] summary="PRAGMA foreign_keys = ON; …" db.statement="\n\nPRAGMA foreign_keys = ON; \n" rows_affected=0 rows_returned=0 elapsed=91.2µs elapsed_secs=9.12e-5
[2025-07-17][08:17:31][sqlx::query][DEBUG] summary="SELECT name FROM sqlite_master …" db.statement="\n\nSELECT name FROM sqlite_master WHERE type='table' AND name='window_configs'\n" rows_affected=0 rows_returned=1 elapsed=2.2987ms elapsed_secs=0.0022987
Editor window opened, total count: 1
[2025-07-17][08:17:31][sqlx::query][DEBUG] summary="SELECT * FROM notes …" db.statement="\n\nSELECT * FROM notes WHERE uid = ?\n" rows_affected=0 rows_returned=1 elapsed=379.2µs elapsed_secs=0.0003792
[2025-07-17][08:17:31][sqlx::query][DEBUG] summary="SELECT * FROM notes …" db.statement="\n\nSELECT * FROM notes WHERE uid = ?\n" rows_affected=0 rows_returned=1 elapsed=85.2µs elapsed_secs=8.52e-5
[2025-07-17][08:17:31][sqlx::query][DEBUG] summary="SELECT * FROM window_configs …" db.statement="\n\nSELECT * FROM window_configs WHERE window_id = ?\n" rows_affected=0 rows_returned=1 elapsed=412.9µs elapsed_secs=0.0004129
[2025-07-17][08:17:33][sqlx::query][DEBUG] summary="PRAGMA foreign_keys = ON; …" db.statement="\n\nPRAGMA foreign_keys = ON; \n" rows_affected=0 rows_returned=0 elapsed=76.7µs elapsed_secs=7.67e-5
[2025-07-17][08:17:33][sqlx::query][DEBUG] summary="SELECT name FROM sqlite_master …" db.statement="\n\n\n        SELECT name FROM sqlite_master WHERE type='table' AND name='notes'\n      \n" rows_affected=0 rows_returned=1 elapsed=2.7819ms elapsed_secs=0.0027819
[2025-07-17][08:17:33][sqlx::query][DEBUG] summary="PRAGMA table_info(notes)" db.statement="" rows_affected=0 rows_returned=9 elapsed=183.6µs elapsed_secs=0.0001836
[2025-07-17][08:17:33][sqlx::query][DEBUG] summary="PRAGMA foreign_keys = ON; …" db.statement="\n\nPRAGMA foreign_keys = ON; \n" rows_affected=0 rows_returned=0 elapsed=76.9µs elapsed_secs=7.69e-5
[2025-07-17][08:17:33][sqlx::query][DEBUG] summary="PRAGMA foreign_keys = ON; …" db.statement="\n\nPRAGMA foreign_keys = ON; \n" rows_affected=0 rows_returned=0 elapsed=90.5µs elapsed_secs=9.05e-5
[2025-07-17][08:17:33][sqlx::query][DEBUG] summary="PRAGMA foreign_keys = ON; …" db.statement="\n\nPRAGMA foreign_keys = ON; \n" rows_affected=0 rows_returned=0 elapsed=81.7µs elapsed_secs=8.17e-5
[2025-07-17][08:17:33][sqlx::query][DEBUG] summary="SELECT name FROM sqlite_master …" db.statement="\n\nSELECT name FROM sqlite_master WHERE type='table' AND name='window_configs'\n" rows_affected=0 rows_returned=1 elapsed=2.5343ms elapsed_secs=0.0025343
[2025-07-17][08:17:33][sqlx::query][DEBUG] summary="SELECT name FROM sqlite_master …" db.statement="\n\nSELECT name FROM sqlite_master WHERE type='table' AND name='window_configs'\n" rows_affected=0 rows_returned=1 elapsed=1.0721ms elapsed_secs=0.0010721
Editor window opened, total count: 2
[2025-07-17][08:17:33][sqlx::query][DEBUG] summary="SELECT * FROM notes …" db.statement="\n\nSELECT * FROM notes WHERE uid = ?\n" rows_affected=0 rows_returned=1 elapsed=372.7µs elapsed_secs=0.0003727
[2025-07-17][08:17:33][sqlx::query][DEBUG] summary="SELECT * FROM notes …" db.statement="\n\nSELECT * FROM notes WHERE uid = ?\n" rows_affected=0 rows_returned=1 elapsed=256µs elapsed_secs=0.000256
[2025-07-17][08:17:33][sqlx::query][DEBUG] summary="SELECT * FROM window_configs …" db.statement="\n\nSELECT * FROM window_configs WHERE window_id = ?\n" rows_affected=0 rows_returned=1 elapsed=456.4µs elapsed_secs=0.0004564
Editor window closed, remaining count: 1
🚀 Window close requested: editor_f5c2111e-b5c0-9f5a-a7ce-05dcd00f607c
🚀 Editor window closed, remaining count: 0
[2025-07-17][08:17:34][sqlx::query][DEBUG] summary="UPDATE window_configs SET width …" db.statement="\n\nUPDATE window_configs \n         SET width = ?, height = ?, x = ?, y = ?, updated_at = ?\n         WHERE window_id = ?\n" rows_affected=1 rows_returned=0 elapsed=7.4208ms elapsed_secs=0.0074208
[2025-07-17][08:17:34][sqlx::query][DEBUG] summary="UPDATE window_configs SET width …" db.statement="\n\nUPDATE window_configs \n         SET width = ?, height = ?, x = ?, y = ?, updated_at = ?\n         WHERE window_id = ?\n" rows_affected=1 rows_returned=0 elapsed=11.0832ms elapsed_secs=0.0110832
🚀 Window close requested: editor_f5c2111e-b5c0-9f5a-a7ce-05dcd00f607c
🚀 Editor window closed, remaining count: -1
```