export const lastSegmentUnscaledSymbols = '●①②③④⑤⑥⑦⑧⑨⑩';

/** 首段压缩优先，其他段只对末段的可压缩正文应用横向倍率。 */
export const getBodyScaleX = (text, isCompressedFirstSegment, isLastSegment, firstSegmentScaleX, lastSegmentScaleX) => {
  if (isCompressedFirstSegment) return firstSegmentScaleX;
  if (isLastSegment && !lastSegmentUnscaledSymbols.includes(text)) return lastSegmentScaleX;
  return 1;
};
