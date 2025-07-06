# I便笺窗口大小记忆功能测试指南

## 功能说明

本次更新为I便笺添加了窗口大小和位置记忆功能：

### 1. 主窗口记忆
- 自动记录主窗口的大小和位置
- 下次启动时恢复到上次的大小和位置

### 2. 便签窗口记忆
- 每个便签都有独立的窗口配置记忆
- 记录便签窗口的大小和位置
- 再次打开同一便签时，窗口会恢复到上次的大小和位置

## 测试步骤

### 测试主窗口记忆功能
1. 启动应用程序：`bun run dev`
2. 调整主窗口的大小和位置
3. 关闭应用程序
4. 重新启动应用程序
5. 验证主窗口是否恢复到上次的大小和位置

### 测试便签窗口记忆功能
1. 在主窗口中创建一个新便签
2. 调整便签窗口的大小和位置
3. 关闭便签窗口
4. 重新打开这个便签
5. 验证便签窗口是否恢复到上次的大小和位置

### 测试多个便签的独立记忆
1. 创建多个便签
2. 为每个便签设置不同的窗口大小和位置
3. 分别关闭所有便签窗口
4. 逐一重新打开这些便签
5. 验证每个便签都恢复到各自的大小和位置

### 测试删除便签时的清理功能
1. 创建一个便签并调整其窗口大小位置
2. 删除这个便签
3. 重新创建同名便签
4. 验证新便签使用默认大小位置（而不是之前记录的配置）

## 技术实现

### 数据库表结构
```sql
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
```

### 窗口ID命名规则
- 主窗口：`main`
- 便签编辑器：`editor_{便签UID}`

### 权限配置
已在 `src-tauri/capabilities/default.json` 中添加必要的窗口操作权限：
- `core:window:allow-set-position`
- `core:window:allow-set-size`
- `core:window:allow-inner-position`
- `core:window:allow-inner-size`
- `core:window:allow-outer-position`
- `core:window:allow-outer-size`

## 常见问题

### Q: 权限错误 "window.set_position not allowed"
A: 确保在 `src-tauri/capabilities/default.json` 中添加了所有必要的窗口操作权限。

### Q: 窗口配置没有保存
A: 检查数据库是否正常初始化，以及是否有足够的文件系统写入权限。

### Q: 多个便签使用了相同的配置
A: 检查便签的UID是否唯一，窗口ID是基于便签UID生成的。

## 文件修改列表

### 新增文件
- `src/service/windowConfigService.ts` - 窗口配置管理服务

### 修改文件
- `src-tauri/tauri.conf.json` - 添加store插件
- `src-tauri/capabilities/default.json` - 添加窗口操作权限
- `src/main.ts` - 主窗口配置初始化
- `src/views/editor/index.vue` - 编辑器窗口配置
- `src/views/index/components/List.vue` - 便签删除时清理配置
- `src/service/tauriNoteService.ts` - 删除便签时清理窗口配置
- `src/utils/index.ts` - 新增编辑器窗口创建函数

## 调试信息

应用程序会在控制台输出相关的调试信息：
- `✅ Window config applied and tracking started for {windowId}`
- `✅ Window config saved for {windowId}: {width}x{height}`
- `✅ Window config deleted for {windowId}`
- `❌ Failed to setup window config:` （错误信息）

通过这些信息可以了解窗口配置功能的运行状态。
