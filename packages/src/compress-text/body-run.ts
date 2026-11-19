import type { IGroup, IText, ITextInputData } from '@leafer-ui/interface';
import { Group, Text } from 'leafer-unified';
import { textGraphemes } from './breaking/text-graphemes.ts';
import type { GlyphMetric, GlyphResolver } from './glyph-metrics.ts';
import type { TextLeafStyle, TextPaint } from './layout/types.ts';

export interface BodyRun {
  node: IGroup;
  width: number;
  resize(fontSize: number, lineHeight: number): number;
  paint(data: TextPaint): void;
}

interface BodySegment {
  text: string;
  metric: GlyphMetric | null;
  node?: IText;
}

/** 逻辑占宽独立于 Group 包围盒；未调整的连续文字保留原生塑形。 */
export const createBodyRun = (style: TextLeafStyle, metrics: GlyphResolver | null | undefined): BodyRun | null => {
  if (!metrics || style.text === '\n') return null;
  const segments: BodySegment[] = [];
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
  const node = new Group();
  for (const segment of segments) {
    segment.node = new Text({ ...style, text: segment.text, letterSpacing: segment.metric ? 0 : style.letterSpacing } as ITextInputData);
    node.add(segment.node);
  }
  const run: BodyRun = {
    node,
    width: 0,
    resize(fontSize, lineHeight) {
      let x = 0;
      const spacing = style.letterSpacing * fontSize / style.fontSize;
      for (const segment of segments) {
        const { node, metric } = segment;
        const text = node!;
        text.set({ fontSize, lineHeight, letterSpacing: metric ? 0 : spacing });
        text.x = x + (metric ? metric.offset * fontSize : 0);
        x += metric ? metric.width * fontSize + spacing : text.getBounds('content', 'inner').width;
      }
      this.width = x;
      return x;
    },
    paint(data) {
      // 默认线性渐变为垂直方向；所有子字形共享正文段的渐变坐标。
      const gradient = data.fill && typeof data.fill === 'object' && 'type' in data.fill && data.fill.type === 'linear' ? data.fill : null;
      const height = gradient ? Math.max(...segments.map(segment => segment.node!.getBounds('content', 'inner').height)) : 0;
      for (const segment of segments) {
        const text = segment.node!;
        const fill = gradient ? {
          ...gradient,
          from: { type: 'px', x: this.width / 2 - text.x!, y: 0 },
          to: { type: 'px', x: this.width / 2 - text.x!, y: height },
        } : data.fill;
        text.set({ ...data, fill } as ITextInputData);
      }
    },
  };
  run.resize(style.fontSize, style.lineHeight);
  return run;
};
