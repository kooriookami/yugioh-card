/**
 * 只计算候选的行框高度。运算次序与逐项布局一致，不写入节点或 ruby 状态。
 * 行尾空格在 addLine 中被清理后 currentX 立即归零，因此高度试算无需修改空格。
 */
export const trialLayoutHeight = (newlines, width, lineHeight, firstLineCompress, firstLineScale, scale, noCompressText) => {
  let x = 0;
  let line = 0;
  let hasRuby = false;
  for (let newlineIndex = 0; newlineIndex < newlines.length; newlineIndex++) {
    const lastNewline = newlineIndex === newlines.length - 1;
    const firstLine = firstLineCompress && newlineIndex === 0;
    for (const items of newlines[newlineIndex]) {
      if (items.some(({ ruby }) => ruby.text === '\n')) {
        // 硬换行项不经过 updateItemRubyScale，沿用其当前宽度。
        for (const { ruby } of items) {
          x += ruby.width + (ruby.paddingLeft || 0) + (ruby.paddingRight || 0);
          hasRuby = true;
        }
        x = 0;
        line++;
        continue;
      }
      let itemWidth = 0;
      for (const { ruby } of items) {
        const factor = firstLine ? firstLineScale : !noCompressText.includes(ruby.text) && lastNewline ? scale : 1;
        itemWidth += ruby.originalWidth * factor + ((ruby.paddingLeft || 0) + (ruby.paddingRight || 0));
      }
      if (width && x && x + itemWidth > width) {
        x = 0;
        line++;
      }
      for (const { ruby } of items) {
        const factor = firstLine ? firstLineScale : !noCompressText.includes(ruby.text) && lastNewline ? scale : 1;
        x += ruby.originalWidth * factor + (ruby.paddingLeft || 0) + (ruby.paddingRight || 0);
        hasRuby = true;
      }
    }
  }
  // 保留 currentY + lineHeight 的运算次序，避免重组为 (line + 1) * lineHeight。
  return hasRuby ? line * lineHeight + lineHeight : 0;
};
