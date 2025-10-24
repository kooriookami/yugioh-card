import fs from 'fs';
// 已加载的字体路径列表
let fontPathList = [];
// 是否是浏览器
export const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
// 是否是node环境
export const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
// 加载json数据
export const loadJSON = jsonPath => {
  return new Promise((resolve, reject) => {
    if (isBrowser) {
      fetch(jsonPath).then(res => {
        if (res.ok) {
          resolve(res.json());
        } else {
          throw new Error();
        }
      }).catch(() => {
        reject('解析字体失败');
      });
    } else if (isNode) {
      try {
        const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        resolve(json);
      } catch {
        reject('解析字体失败');
      }
    } else {
      reject('未知环境');
    }
  });
};
// 加载字体
export const loadFont = fontPath => {
  return new Promise((resolve, reject) => {
    if (fontPathList.includes(fontPath)) {
      resolve();
      return;
    }
    fontPathList.push(fontPath);
    loadJSON(`${fontPath}/font-list.json`).then(async data => {
      if (isBrowser) {
        const fontList = [];
        data.forEach(family => {
          const font = new FontFace(
            family,
            `url(${fontPath}/${family}.woff2) format('woff2'), url(${fontPath}/${family}.woff) format('woff')`,
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
      } else if (isNode) {
        for (const family of data) {
          const { FontLibrary } = await import('skia-canvas');
          FontLibrary.use(family, [
            `${fontPath}/${family}.woff2`,
            `${fontPath}/${family}.woff`,
          ]);
        }
        resolve();
      } else {
        reject('未知环境');
      }
    }).catch(() => {
      reject('读取字体失败');
    });
  });
};

// 数字转全角
export function numberToFull(value) {
  let charList = Array.from(String(value)).map(char => {
    let code = char.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      return String.fromCharCode(code + 65248);
    }
    return char;
  });
  return charList.join('');
}

// 继承css样式
export const inheritProp = (obj, parentObj = {}) => {
  const inheritPropList = ['fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'lineHeight', 'letterSpacing', 'wordSpacing'];
  inheritPropList.forEach(inherit => {
    if (!Object.prototype.hasOwnProperty.call(obj, inherit) && Object.prototype.hasOwnProperty.call(parentObj, inherit)) {
      obj[inherit] = parentObj[inherit];
    }
  });
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && obj[key] !== null) {
      inheritProp(obj[key], obj);
    }
  });
  return obj;
};
