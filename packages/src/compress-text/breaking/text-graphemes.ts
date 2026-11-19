const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });

export const textGraphemes = (text: string) => Array.from(segmenter.segment(text), item => item.segment);

/** 返回与 String.slice 一致的 UTF-16 字素边界。 */
export const graphemeBoundaries = (text: string) => {
  const boundaries = new Set([0]);
  for (const item of segmenter.segment(text)) boundaries.add(item.index + item.segment.length);
  return boundaries;
};

/** CSS 分词器可能拆开浊点等组合字符，将落在字素内部的断点合并。 */
export const mergeGraphemeTokens = (text: string, tokens: readonly string[]) => {
  const boundaries = graphemeBoundaries(text);
  let offset = 0;
  const result = [];
  let pending = '';
  for (const token of tokens) {
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
