// 动态加载css
export const loadCSS = url => {
  let css = document.createElement('link');
  css.href = url;
  css.rel = 'stylesheet';
  document.head.appendChild(css);
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
