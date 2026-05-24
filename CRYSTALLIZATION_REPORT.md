# 结晶报告 — iNote-tauri

> 生成日期：2025-07-18
> 基线版本：v1.1.3

## 勘探摘要

对仓库进行了全量审计：梳理了 3 个本地分支、10 个远程引用、36 个源文件、约 184k 行代码。识别出 13 个死代码/冗余文件、2 处实体定义分歧、2 个已合并未清理的 feature 分支。

## 已归档失败实验

| 实验 | 归档标签 | 失败原因 | 关键教训 |
|------|---------|---------|---------|
| vditor → @xlxz/markdown-editor | `archive/replace-editor-with-xlxz-markdown` | vditor 加载慢、体积大 | 第三方重型编辑器不适合桌面便笺场景 |
| 窗口管理器 Rust 重写 | `archive/refactor-window-manager` | 前端 TS 实现存在竞态条件和死锁 | 窗口管理需要串行化，Rust 后端天然适合 |

## 修剪清单

| 文件/目录 | 删除理由 |
|-----------|---------|
| `public/3.8.10/`（5 文件） | 旧 vditor 版本，无引用 |
| `public/vendor/app.css` | 被 app.scoped.css 取代 |
| `public/css/mac.css` | Electron 时代 Mac 兼容 CSS，无引用 |
| `script/deleteBuild.js` | 全部代码已注释，依赖的 vue.config.js 已删除 |
| `.yarnrc`, `.npmrc`, `package-lock.json` | 项目已全面使用 bun |
| `.prettierrc.js` | 与 .prettierrc 配置冲突 |
| `less.config.js` | vite 内联配置 Less，此文件未被引用 |
| `notes/BUG.md` | 已解决的开发期 bug 报告 |
| `notes/WINDOW_MEMORY_*`（2 文件） | 前端旧实现文档，已被 Rust 窗口管理器取代 |
| `notes/CHANGELOG.md` | 旧项目 electron-vue3-inote 的 changelog |
| `src-tauri/mutants.out/` + `mutants.out.old/` | 变异测试产物 |
| `src/service/window/` | 空目录 |

## 实体统一

- **Prettier 配置**：选定 `.prettierrc`（JSON，trailingComma: es5, printWidth: 80），删除冲突的 `.prettierrc.js`
- **编辑器 CSS**：选定 `app.scoped.css`，删除旧版 `app.css`
- **CHANGELOG**：由 `package.json` 的 `log` 脚本自动生成根目录 `CHANGELOG.md`

## 清理后状态

- 删除 17 个文件 + 3 个空目录
- 删除 2 个已合并本地分支
- 打 2 个归档标签
- 类型检查通过（vue-tsc --noEmit）
