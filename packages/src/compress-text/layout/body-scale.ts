export const lastSegmentUnscaledSymbols = '●①②③④⑤⑥⑦⑧⑨⑩';

/** 较宽的注音由正文两侧对称留位。 */
export const getRtPadding = (bodyWidth: number, rtWidth: number) => Math.max(0, (rtWidth - bodyWidth) / 2);

/** 指定段的单行倍率优先，末段的自动倍率只作用于可压缩正文。 */
export const getBodyScaleX = (text: string, segmentScaleX: number | undefined, isLastSegment: boolean, lastSegmentScaleX: number) => {
  if (segmentScaleX !== undefined) return segmentScaleX;
  if (isLastSegment && !lastSegmentUnscaledSymbols.includes(text)) return lastSegmentScaleX;
  return 1;
};
