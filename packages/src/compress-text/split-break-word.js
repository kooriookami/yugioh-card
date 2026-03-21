import { fromCodePoint, LineBreaker, toCodePoints } from 'css-line-break';

export const splitBreakWord = text => {
  // https://drafts.csswg.org/css-text/#word-separator
  const wordSeparators = [0x0020, 0x00a0, 0x1361, 0x10100, 0x10101, 0x1039, 0x1091];

  const breaker = LineBreaker(text, {
    lineBreak: 'strict',
    wordBreak: 'normal',
  });

  const words = [];
  let bk;

  while (!(bk = breaker.next()).done) {
    if (bk.value) {
      const value = bk.value.slice();
      const codePoints = toCodePoints(value);
      let word = '';
      codePoints.forEach(codePoint => {
        if (wordSeparators.indexOf(codePoint) === -1) {
          word += fromCodePoint(codePoint);
        } else {
          if (word.length) {
            words.push(word);
          }
          words.push(fromCodePoint(codePoint));
          word = '';
        }
      });

      if (word.length) {
        words.push(word);
      }
    }
  }

  return words;
};

export const splitBreakWordWithBracket = text => {
  const placeholderMap = new Map();

  const replaceText = text.replace(/\[.*?\(.*?\)]/g, match => {
    // 每个占位符都使用完全唯一的ID
    const uniqueId = Math.random().toString(36).slice(2, 11);
    const key = `__${uniqueId}__`;
    placeholderMap.set(key, match);
    return key;
  });

  // 在相邻占位符之间插入零宽空格
  const placeholderRegex = /(?<=__[a-z0-9]{9}__)(?=__[a-z0-9]{9}__)/g;
  const finalText = replaceText.replace(placeholderRegex, '\u200B');

  const splitList = splitBreakWord(finalText);

  return splitList.map(item => {
    let result = item.replace(/\u200B/g, '');
    for (const [key, value] of placeholderMap) {
      result = result.replace(key, value);
    }
    return result;
  });
};
