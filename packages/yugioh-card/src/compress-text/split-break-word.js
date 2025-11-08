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
  let index = 0;
  const placeholderMap = {};

  const replaceText = text.replace(/\[.*?\(.*?\)]/g, match => {
    const key = `__BRACKET_${index}__`;
    placeholderMap[key] = match;
    index++;
    return key;
  }).replace(/(?<=__BRACKET_\d+__)(?=__BRACKET_\d+__)/g, '\u200B');

  // 调用原来的 splitBreakWord 逻辑
  const splitList = splitBreakWord(replaceText);

  // 把占位符替换回原来的 [xxx(yyy)] 块
  return splitList.map(item => item.replace(/\u200B/g, '').replace(/__BRACKET_\d+__/g, s => placeholderMap[s]));
}
