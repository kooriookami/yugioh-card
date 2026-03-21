import { fromCodePoint, LineBreaker, toCodePoints } from 'css-line-break';

const wordSeparators = new Set([0x0020, 0x00A0, 0x1361, 0x10100, 0x10101, 0x1039, 0x1091]);
const rubyPlaceholderPattern = /\[[^\[\]()]*\([^\[\]()]*\)]/g;
const rubyPlaceholderTokenPattern = /__RB\d+__/g;
const adjacentRubyPlaceholderPattern = /(?<=__RB\d+__)(?=__RB\d+__)/g;

export const splitBreakWord = text => {
  // https://drafts.csswg.org/css-text/#word-separator
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
        if (!wordSeparators.has(codePoint)) {
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
  const matchList = Array.from(text.matchAll(rubyPlaceholderPattern));
  if (!matchList.length) {
    return splitBreakWord(text);
  }

  const rubyTokenMap = new Map();
  const placeholderText = text.replace(rubyPlaceholderPattern, match => {
    const placeholder = `__RB${rubyTokenMap.size}__`;
    rubyTokenMap.set(placeholder, match);
    return placeholder;
  });

  const splitText = placeholderText.replace(adjacentRubyPlaceholderPattern, '\u200B');

  return splitBreakWord(splitText).map(word => {
    const normalizedWord = word.replace(/\u200B/g, '');

    return normalizedWord.replace(rubyPlaceholderTokenPattern, placeholder => {
      return rubyTokenMap.get(placeholder) ?? placeholder;
    });
  });
};
