/**
 * model需要的类型
 */
export interface NotesModelType {
  uid: string;
  className: string;
  content: string;
  markdown: string;
  interception: string;
}

/**
 * 数据库返回的数据类型
 */
export interface DBNotesType {
  readonly uid: string;
  className: string;
  content: string;
  markdown: string;
  interception: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 数据库笔记列表类型
 */
export interface DBNotesListType {
  uid: string;
  className: string;
  content: string;
  markdown: string;
  interception: string;
  createdAt: Date;
  updatedAt: Date;
  remove?: boolean; // 添加 remove 属性
}

// 移除 Sequelize 相关类型定义
// 保留兼容性，但不再依赖 Sequelize
export type NotesModel = DBNotesType;
