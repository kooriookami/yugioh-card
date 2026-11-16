const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });

export const textGraphemes = text => Array.from(segmenter.segment(text), item => item.segment);

/** CSS 分词器可能拆开浊点等组合字符，将落在字素内部的断点合并。 */
export const mergeGraphemeTokens = (text, tokens, separators) => {
  const boundaries = new Set();
  let offset = 0;
  for (const grapheme of textGraphemes(text)) {
    offset += grapheme.length;
    boundaries.add(offset);
  }
  const result = [];
  let pending = '';
  offset = 0;
  for (const token of tokens) {
    // 保留分词器既有的显式 word separator 约定。
    if (separators?.has(token.codePointAt(0)) && Array.from(token).length === 1) {
      if (pending) result.push(pending);
      result.push(token);
      pending = '';
      offset += token.length;
      continue;
    }
    pending += token;
    offset += token.length;
    if (boundaries.has(offset)) {
      result.push(pending);
      pending = '';
    }
  }
  if (pending) result.push(pending);
  return result;
};
