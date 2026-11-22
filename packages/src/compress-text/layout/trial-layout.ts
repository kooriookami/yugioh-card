import { getBodyScaleX, getRtPadding } from './body-scale.ts';
import { LinePunctuation, type PunctuationLayout } from './line-punctuation.ts';
import type { HardBreakSegment } from './types.ts';

/**
 * 只计算候选的行框高度。运算次序与逐项布局一致，不写入节点或 ruby 状态。
 * 行尾空格在 addLine 中被清理后 currentX 立即归零，因此高度试算无需修改空格。
 */
export const trialLayoutHeight = (segments: readonly HardBreakSegment[], width: number, lineHeight: number, segmentScaleX: ReadonlyMap<number, number>, lastSegmentScaleX: number, layout?: PunctuationLayout) => {
  const linePunctuation = layout && new LinePunctuation();
  const itemPunctuation = layout && new LinePunctuation();
  let x = 0;
  let line = 0;
  let hasRuby = false;
  for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
    const isLastSegment = segmentIndex === segments.length - 1;
    const selectedScaleX = segmentScaleX.get(segmentIndex);
    for (const items of segments[segmentIndex]) {
      if (items.some(({ ruby }) => ruby.text === '\n')) {
        // 硬换行项不经过 applyBodyScaleXToItems，沿用其当前宽度。
        for (const { ruby } of items) {
          x += ruby.width + (ruby.paddingLeft || 0) + (ruby.paddingRight || 0);
          hasRuby = true;
        }
        x = 0;
        linePunctuation?.reset();
        line++;
        continue;
      }
      let itemWidth = 0;
      itemPunctuation?.reset();
      for (const item of items) {
        const { ruby, rt } = item;
        const scaleX = getBodyScaleX(ruby.text, selectedScaleX, isLastSegment, lastSegmentScaleX);
        const bodyWidth = ruby.originalWidth * scaleX;
        const padding = rt.minWidth === undefined
          ? (ruby.paddingLeft || 0) + (ruby.paddingRight || 0)
          : getRtPadding(bodyWidth, rt.minWidth) * 2;
        const occupied = bodyWidth + padding;
        itemWidth += occupied;
        if (layout) itemPunctuation!.add(item, bodyWidth, occupied, scaleX, layout);
      }
      const reduction = linePunctuation?.reduction(itemPunctuation) ?? 0;
      if (width && x && x + (itemWidth - reduction) > width) {
        x = 0;
        linePunctuation?.reset();
        line++;
      }
      if (itemPunctuation) linePunctuation!.append(itemPunctuation);
      for (const { ruby, rt } of items) {
        const scaleX = getBodyScaleX(ruby.text, selectedScaleX, isLastSegment, lastSegmentScaleX);
        const bodyWidth = ruby.originalWidth * scaleX;
        const rtPadding = rt.minWidth === undefined ? undefined : getRtPadding(bodyWidth, rt.minWidth);
        const paddingLeft = rtPadding ?? (ruby.paddingLeft || 0);
        const paddingRight = rtPadding ?? (ruby.paddingRight || 0);
        x += bodyWidth + paddingLeft + paddingRight;
        hasRuby = true;
      }
    }
  }
  // 保留 currentY + lineHeight 的运算次序，避免重组为 (line + 1) * lineHeight。
  return hasRuby ? line * lineHeight + lineHeight : 0;
};
