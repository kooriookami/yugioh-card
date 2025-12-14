import fs from 'fs';
import { isPlainObject } from 'lodash-unified';
// 已加载的字体路径列表
let fontPathList = [];
// 是否是浏览器
export const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
// 是否是node环境
export const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

// 加载字体 - 浏览器环境，异步
export const loadFontBrowser = fontPath => {
  return new Promise((resolve, reject) => {
    if (fontPathList.includes(fontPath)) {
      resolve();
      return;
    }
    fontPathList.push(fontPath);
    fetch(`${fontPath}/font-list.json`).then(res => {
      if (res.ok) {
        return res.json();
      } else {
        throw new Error();
      }
    }).then(async data => {
      const fontList = [];
      data.forEach(family => {
        const font = new FontFace(
          family,
          `url(${fontPath}/${family}.woff2) format('woff2')`,
          {
            display: 'swap',
          },
        );
        document.fonts.add(font);
        fontList.push(font);
      });
      const fontLoadList = fontList.map(font => font.load());
      await Promise.allSettled(fontLoadList);
      resolve();
    }).catch(() => {
      reject('读取字体失败');
    });
  });
};

// 加载字体 - Nodejs 环境，同步
export const loadFontNode = (fontPath, skia) => {
  if (fontPathList.includes(fontPath)) {
    return;
  }
  fontPathList.push(fontPath);
  const data = JSON.parse(fs.readFileSync(`${fontPath}/font-list.json`, 'utf-8'));
  if (skia) {
    data.forEach(family => {
      skia.FontLibrary.use(family, [
        `${fontPath}/${family}.woff2`,
      ]);
    });
  }
};

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
