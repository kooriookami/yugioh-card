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
  let index = 0;
  const placeholderMap = new Map();

  const basePrefix = `__${Math.random().toString(36).slice(2)}_`;

  const replaceText = text.replace(/\[.*?\(.*?\)]/g, match => {
    const key = `${basePrefix}${index}`;
    placeholderMap.set(key, match);
    index++;
    return key;
  }).replace(new RegExp(`(?<=${basePrefix}\\d+)(?=${basePrefix}\\d+)`, 'g'), '\u200B');

  const splitList = splitBreakWord(replaceText);

  return splitList.map(item => {
    let result = item.replace(/\u200B/g, '');
    for (const [key, value] of placeholderMap) {
      result = result.replace(key, value);
    }
    return result;
  });
}
