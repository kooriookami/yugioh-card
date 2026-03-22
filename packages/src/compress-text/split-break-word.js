/**
 * 分词工具模块。
 *
 * 该模块负责把原始文本拆分成适合 CompressText 继续解析和布局的文本片段。
 * 其中：
 * 1. splitBreakWord 负责普通文本的基础分词。
 * 2. splitBreakWordWithBracket 负责在保留 ruby 标记原子性的前提下执行分词。
 *
 * 模块输出的片段顺序会保持与原始文本一致，供后续 ruby/rt 解析、换行与压缩流程复用。
 */
import { fromCodePoint, LineBreaker, toCodePoints } from 'css-line-break';

const wordSeparators = new Set([0x0020, 0x00A0, 0x1361, 0x10100, 0x10101, 0x1039, 0x1091]);
const rubyPlaceholderPattern = /\[[^\[\]()]*\([^\[\]()]*\)]/g;
const rubyPlaceholderTokenPattern = /__RB\d+__/g;
const adjacentRubyPlaceholderPattern = /(?<=__RB\d+__)(?=__RB\d+__)/g;

/**
 * 按 CSS line-break 规则将文本拆分成可参与后续布局的分词片段。
 *
 * 该方法会基于 css-line-break 提供的断行结果继续做一层加工：
 * 1. 将配置中的 word separator 保留为独立片段。
 * 2. 将连续的非分隔符字符合并为同一个词片段。
 *
 * 返回结果会保持原始文本顺序，供 CompressText 在解析阶段继续拆成 ruby/rt 结构。
 *
 * @param {string} text 原始文本。
 * @returns {string[]} 分词后的文本片段列表。
 */
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

/**
 * 在保留 ruby 标记原子性的前提下，对文本执行分词。
 *
 * 该方法会先将形如 [汉(かん)] 的 ruby 标记替换为占位符，
 * 以避免分词时把 ruby 结构拆散；分词完成后，再把占位符恢复成原始 ruby 文本。
 *
 * 当文本中不存在 ruby 标记时，会直接退化为 splitBreakWord 的普通分词逻辑。
 *
 * @param {string} text 原始文本。
 * @returns {string[]} 在保留 ruby 标记前提下得到的分词片段列表。
 */
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
