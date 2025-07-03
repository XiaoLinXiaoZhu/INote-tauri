import { classNames } from './inotesConfig';
import { getWindowOptions, getAppUrl, disabledKeys, isDevelopment } from './electronConfig';

/** 日志地址 */
const constErrorLogPath = `/resources/inotesError${isDevelopment ? '-dev' : ''}.log`;

/** db地址 */
const constStoragePath = `/resources/db/notes${isDevelopment ? '-dev' : ''}.db`;

/** 图片地址 */
const constImagesPath = '/resources/images/';

// 为了向后兼容，保留旧的函数名
export const browserWindowOption = getWindowOptions;
export const winURL = getAppUrl();

export {
  classNames,
  getWindowOptions,
  getAppUrl,
  disabledKeys,
  isDevelopment,
  constErrorLogPath,
  constStoragePath,
  constImagesPath
};
