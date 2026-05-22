/**
 * 笔记数据模型类型定义
 *
 * - md_content: markdown 源文本（唯一事实来源）
 * - html_snapshot: 编辑器 DOM 快照（派生缓存，用于列表预览）
 */

/**
 * 数据库笔记记录类型
 */
export interface NoteRecord {
  id?: number;
  uid: string;
  title: string;
  md_content: string;
  html_snapshot: string;
  color: string;
  is_pinned: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * 列表展示用类型
 */
export interface NoteListItem {
  uid: string;
  className: string;
  mdContent: string;
  htmlSnapshot: string;
  createdAt: Date;
  updatedAt: Date;
  remove?: boolean;
}
