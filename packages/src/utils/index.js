import { isPlainObject } from 'lodash-unified';
export { loadFontBrowser, loadFontNode } from './font-loader.js';
// 是否是浏览器
export const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
// 是否是node环境
export const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

// 数字转全角
export const numberToFull = value => {
  return value.replace(/\d/g, d => String.fromCharCode(d.charCodeAt(0) + 0xFEE0));
};

// 继承css样式
export const inheritProp = (obj, parentObj = {}) => {
  const inheritPropList = ['fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'lineHeight', 'letterSpacing', 'wordSpacing'];
  inheritPropList.forEach(inherit => {
    if (!Object.hasOwn(obj, inherit) && Object.hasOwn(parentObj, inherit)) {
      obj[inherit] = parentObj[inherit];
    }
  });
  Object.keys(obj).forEach(key => {
    if (isPlainObject(obj[key])) {
      inheritProp(obj[key], obj);
    }
  });
  return obj;
};
