import { Group, Text } from 'leafer-unified';
import { textGraphemes } from './glyph-metrics.js';

/** 逻辑占宽独立于 Group 包围盒；未调整的连续文字保留原生塑形。 */
export const createBodyRun = (style, metrics) => {
  if (!metrics || style.text === '\n') return null;
  const segments = [];
  let native = '';
  const flush = () => {
    if (native) segments.push({ text: native, metric: null });
    native = '';
  };
  for (const character of textGraphemes(style.text)) {
    const metric = metrics(character);
    if (metric) {
      flush();
      segments.push({ text: character, metric });
    } else native += character;
  }
  flush();
  if (!segments.some(segment => segment.metric)) return null;
  const leaf = new Group();
  for (const segment of segments) {
    segment.leaf = new Text({ ...style, text: segment.text, letterSpacing: segment.metric ? 0 : style.letterSpacing });
    leaf.add(segment.leaf);
  }
  const run = {
    leaf,
    width: 0,
    resize(fontSize, lineHeight) {
      let x = 0;
      const spacing = style.letterSpacing * fontSize / style.fontSize;
      for (const segment of segments) {
        const { leaf: text, metric } = segment;
        text.set({ fontSize, lineHeight, letterSpacing: metric ? 0 : spacing });
        text.x = x + (metric ? metric.offset * fontSize : 0);
        x += metric ? metric.width * fontSize + spacing : text.getBounds('content', 'inner').width;
      }
      this.width = x;
      return x;
    },
    paint(data) {
      // 默认线性渐变为垂直方向；所有子字形共享正文段的渐变坐标。
      const height = Math.max(...segments.map(segment => segment.leaf.getBounds('content', 'inner').height));
      for (const { leaf: text } of segments) {
        const fill = data.fill?.type === 'linear' ? {
          ...data.fill,
          from: { type: 'px', x: this.width / 2 - text.x, y: 0 },
          to: { type: 'px', x: this.width / 2 - text.x, y: height },
        } : data.fill;
        text.set({ ...data, fill });
      }
    },
  };
  run.resize(style.fontSize, style.lineHeight);
  return run;
};
