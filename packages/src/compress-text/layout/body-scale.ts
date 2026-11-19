export const lastSegmentUnscaledSymbols = '●①②③④⑤⑥⑦⑧⑨⑩';

/** 指定段的单行倍率优先，末段的自动倍率只作用于可压缩正文。 */
export const getBodyScaleX = (text: string, segmentScaleX: number | undefined, isLastSegment: boolean, lastSegmentScaleX: number) => {
  if (segmentScaleX !== undefined) return segmentScaleX;
  if (isLastSegment && !lastSegmentUnscaledSymbols.includes(text)) return lastSegmentScaleX;
  return 1;
};
