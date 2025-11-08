import { fromCodePoint, LineBreaker, toCodePoints } from 'css-line-break';

export function splitBreakWord(text) {
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
}

export function splitBreakWordWithBracket(text) {
  // 先匹配所有 [xxx(yyy)]，用占位符替代
  const bracketReg = /\[.*?\(.*?\)]/g;
  const placeholderReg = /__BRACKET_(\d+)__/g;
  let index = 0;
  const placeholderMap = {};

  const replaced = text.replace(bracketReg, match => {
    const key = `__BRACKET_${index}__`;
    placeholderMap[key] = match;
    index++;
    return key;
  });

  // 调用原来的 splitBreakWord 逻辑
  const split = splitBreakWord(replaced);

  // 把占位符替换回原来的 [xxx(yyy)] 块
  return split.map(item => item.replace(placeholderReg, s => placeholderMap[s]));
}
