/**
 * WindowManager — 前端 invoke wrapper（纯类型，无业务逻辑）
 *
 * 所有窗口管理逻辑在 Rust 端实现，
 * 此模块仅提供类型安全的调用接口。
 */

import { invoke } from '@tauri-apps/api/core';

export const windowManager = {
  /** 打开编辑器窗口（如已存在则激活） */
  openEditor: (uid: string): Promise<void> =>
    invoke('open_editor', { uid }),

  /** 打开图片预览窗口 */
  openImagePreview: (src: string, width: number, height: number): Promise<void> =>
    invoke('open_image_preview', { src, width, height }),

  /** 关闭指定窗口 */
  closeWindow: (label: string): Promise<void> =>
    invoke('close_current_window', { label }),

  /** 设置窗口置顶状态 */
  setAlwaysOnTop: (label: string, value: boolean): Promise<void> =>
    invoke('set_always_on_top', { label, value }),

  /** 删除窗口配置（删除便签时调用） */
  deleteWindowConfig: (windowId: string): Promise<void> =>
    invoke('delete_window_config', { windowId }),
} as const;
