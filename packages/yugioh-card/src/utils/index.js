// 已加载的字体路径列表
let fontPathList = [];
// 是否是浏览器
export const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
// 加载字体
export const loadFont = fontPath => {
  if (fontPathList.includes(fontPath)) {
    return;
  }
  fontPathList.push(fontPath);
  return fetch(`${fontPath}/font-list.json`).then(res => {
    if (res.ok) {
      return res.json();
    } else {
      throw new Error();
    }
  }).then(data => {
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
      return Promise.all(fontLoadList);
    }
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
