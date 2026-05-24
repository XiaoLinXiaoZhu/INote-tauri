import { classNames } from './inotesConfig';

const isDevelopment = import.meta.env.MODE !== 'production';

/** 日志地址 */
const constErrorLogPath = `/resources/inotesError${isDevelopment ? '-dev' : ''}.log`;

/** db地址 */
const constStoragePath = `/resources/db/notes${isDevelopment ? '-dev' : ''}.db`;

/** 图片地址 */
const constImagesPath = '/resources/images/';

export {
  classNames,
  constErrorLogPath,
  constImagesPath,
  constStoragePath,
  isDevelopment,
};
