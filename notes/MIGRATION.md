# I便笺项目迁移总结

## 迁移概述

成功将项目从 **Electron + Vue CLI + npm/yarn** 迁移到 **Tauri + Vite + Bun + Vue 3 + TypeScript**。

## 主要变更

### 1. 包管理器
- **之前**: npm/yarn
- **现在**: Bun
- **优势**: 更快的安装速度和运行时性能

### 2. 构建工具
- **之前**: Vue CLI + Webpack
- **现在**: Vite
- **优势**: 更快的热重载和构建速度

### 3. 桌面应用框架
- **之前**: Electron 11.5.0
- **现在**: Tauri 2.6.2
- **优势**: 更小的包体积、更好的性能、更好的安全性

### 4. 项目结构变更
- 将 `index.html` 从 `public/` 移动到项目根目录（Vite 要求）
- 更新了 TypeScript 配置以适配 Vite
- 重新配置了 ESLint 和 Prettier

## 新的依赖项

- `@tauri-apps/api` - Tauri API 客户端库
- `@tauri-apps/plugin-sql` - Tauri SQL 插件，替代 Sequelize
- `@tauri-apps/plugin-fs` - 文件系统操作
- `@tauri-apps/plugin-dialog` - 对话框操作
- `@tauri-apps/plugin-updater` - 自动更新
- `@tauri-apps/plugin-process` - 进程管理
- `@tauri-apps/plugin-shell` - Shell 命令执行

## 已完成的迁移任务

1. **配置迁移**
   - 更新 `tauri.conf.json` 配置
   - 配置 `vite.config.ts`
   - 调整 TypeScript 配置

2. **API 替换**
   - 创建 `src/utils/electronAdapter.ts` 适配层
   - 用 Tauri API 替换 Electron/Node.js API
   - 迁移 IPC 通信到 Tauri 事件系统

3. **数据库迁移**
   - 从 Sequelize 迁移到 `tauri-plugin-sql`
   - 创建兼容层保持原有数据结构和 API

4. **文件功能迁移**
   - 使用 `tauri-plugin-fs` 代替 `fs-extra`
   - 路径处理替换为 Tauri 路径 API

5. **窗口管理迁移**
   - 使用 `WebviewWindow` 替换 `BrowserWindow`
   - 重新实现窗口创建、关闭、通信等功能

6. **更新功能迁移**
   - 使用 `tauri-plugin-updater` 替换 `electron-updater`
   - 实现更新进度和通知功能

7. **Less 配置优化**
   - 分离变量到 `variables.less` 文件
   - 调整 Vite CSS 预处理配置
   - 解决 Less 编译超时问题

## 常见问题与解决方案

### Tauri SQL 权限问题

**问题**: `sql.execute not allowed. Permissions associated with this command: sql:allow-execute`

**解决方案**:
在 `src-tauri/capabilities/default.json` 中添加具体的 SQL 权限：
```json
{
  "permissions": [
    "core:default",
    "sql:default",
    "sql:allow-load",
    "sql:allow-execute", 
    "sql:allow-select"
  ]
}
```

### Buffer 未定义错误

**问题**: `ReferenceError: Buffer is not defined` 错误，通常由 Sequelize 等 Node.js 依赖引起。

**解决方案**:
1. 完全移除 Sequelize 相关依赖
2. 在 `vite.config.ts` 中添加 Node.js polyfill：
```js
define: {
  global: 'globalThis',
}
```
3. 更新所有使用 Sequelize 的文件，替换为 Tauri SQL 插件

### 数据库迁移

**完整迁移步骤**:
1. 从 `package.json` 移除 `sequelize`、`sqlite3`、`@types/sequelize`
2. 更新 `src/types/notes.d.ts`，移除 Sequelize Model 依赖
3. 修改 `src/views/index/components/Search.vue`，移除 Sequelize Op 操作符
4. 使用 `noteService.searchNotes()` 替代 Sequelize 查询

### process 未定义错误

**问题**: 在浏览器环境中运行时出现 `Uncaught ReferenceError: process is not defined` 错误。

**原因**: 
- `process` 是 Node.js 环境中的全局变量，在浏览器环境中不存在
- Tauri 使用标准的 Web API 而不是 Node.js API

**解决方案**:
1. 使用 `import.meta.env` 替代 `process.env`
2. 使用 `@tauri-apps/plugin-os` 代替 `process.platform`
3. 替换所有 Node.js 特定的 API 为 Web API 或 Tauri API

示例:
```typescript
// 旧代码
const isDevelopment = process.env.NODE_ENV !== 'production';
const isWindows = process.platform === 'win32';

// 新代码
const isDevelopment = import.meta.env.MODE !== 'production';
import { platform } from '@tauri-apps/plugin-os';
const isWindows = await platform() === 'windows';
```

### Less 编译超时问题

**问题**: Vite 处理 Less 文件时出现超时错误
```
[vite] Internal server error: [less] timed-out
```

**解决方案**:
1. 在 `vite.config.ts` 中增加超时设置
2. 分离 Less 变量定义到单独文件
3. 使用环境变量控制超时时间
4. 创建优化的启动脚本

示例配置:
```js
css: {
  preprocessorOptions: {
    less: {
      javascriptEnabled: true,
      additionalData: `@import "./variables.less";`,
      timeout: 120000, // 2分钟超时
      paths: [resolve(__dirname, './src/less')],
    },
  },
},
```

### 构建性能优化

为提高大型项目的构建性能:
1. 增加 Node.js 内存限制: `NODE_OPTIONS=--max-old-space-size=8192`
2. 配置依赖预构建优化
3. 使用 `cross-env` 确保跨平台兼容性
4. 创建优化的启动脚本 `start-dev.bat`

## 后续任务

1. 进一步测试和优化所有功能
2. 完善 Tauri 插件配置
3. 优化构建和打包流程
4. 更新文档和用户指南

## 参考资源

- [Tauri 官方文档](https://tauri.studio/)
- [Vite 官方文档](https://vitejs.dev/)
- [Bun 官方文档](https://bun.sh/)
