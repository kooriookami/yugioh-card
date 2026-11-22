export const lastSegmentUnscaledSymbols = '●①②③④⑤⑥⑦⑧⑨⑩';

/** 注音缩窄后仍较宽时，正文两侧各留出一半的差值。 */
export const getRtPadding = (bodyWidth: number, minRtWidth: number) => Math.max(0, (minRtWidth - bodyWidth) / 2);

/** 指定段的单行倍率优先，末段的自动倍率只作用于可压缩正文。 */
export const getBodyScaleX = (text: string, segmentScaleX: number | undefined, isLastSegment: boolean, lastSegmentScaleX: number) => {
  if (segmentScaleX !== undefined) return segmentScaleX;
  if (isLastSegment && !lastSegmentUnscaledSymbols.includes(text)) return lastSegmentScaleX;
  return 1;
};
