import { isPlainObject } from 'lodash-unified';
// 已加载的字体路径列表
let fontPathList = [];
const browserFontPromises = new Map();
let nodeFs = null;
// 是否是浏览器
export const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
// 是否是node环境
export const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

const getNodeFs = () => {
  if (!isNode) {
    throw new Error('fs is not available in browser builds');
  }
  if (!nodeFs) {
    nodeFs = process.getBuiltinModule?.('node:fs') ?? process.getBuiltinModule?.('fs');
  }
  if (!nodeFs) {
    throw new Error('fs is not available in the current Node.js runtime');
  }
  return nodeFs;
};

// 加载字体 - 浏览器环境，异步
export const loadFontBrowser = fontPath => {
  if (browserFontPromises.has(fontPath)) return browserFontPromises.get(fontPath);
  const promise = fetch(`${fontPath}/font-list.json`).then(res => {
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
    const results = await Promise.allSettled(fontLoadList);
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn(`字体 ${data[index]} 加载失败，使用默认字体`, result.reason);
      }
    });
  }).catch(() => {
    browserFontPromises.delete(fontPath);
    throw new Error('读取字体失败');
  });
  browserFontPromises.set(fontPath, promise);
  return promise;
};

// 加载字体 - Nodejs 环境，同步
export const loadFontNode = (fontPath, skia) => {
  if (fontPathList.includes(fontPath)) {
    return;
  }
  fontPathList.push(fontPath);
  const data = JSON.parse(getNodeFs().readFileSync(`${fontPath}/font-list.json`, 'utf-8'));
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
