import { isPlainObject } from 'lodash-unified';
import type { IUIInputData } from '@leafer-ui/interface';
export { loadFontBrowser, loadFontNode } from './font-loader.ts';
// 是否是浏览器
export const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
// 是否是node环境
export const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

/** Leafer 按真值判断可见性。保留节点上既有的可观察值。 */
export const leaferVisibility = (value: string | number | boolean | undefined): IUIInputData['visible'] => {
  return value as IUIInputData['visible'];
};

// 数字转全角
export const numberToFull = (value: number | string) => {
  return String(value).replace(/\d/g, d => String.fromCharCode(d.charCodeAt(0) + 0xFEE0));
};

// 继承css样式
export const inheritProp = <T extends object>(obj: T, parentObj: Record<string, unknown> = {}): T => {
  const props = obj as Record<string, unknown>;
  const inheritPropList = ['fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'lineHeight', 'letterSpacing', 'wordSpacing', 'sideBearingMode'];
  inheritPropList.forEach(inherit => {
    if (!Object.hasOwn(obj, inherit) && Object.hasOwn(parentObj, inherit)) {
      props[inherit] = parentObj[inherit];
    }
  });
  Object.keys(obj).forEach(key => {
    const value = props[key];
    if (isPlainObject(value)) {
      inheritProp(value, props);
    }
  });
  return obj;
};
