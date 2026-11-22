import type { FontEntry } from '../../utils/font-loader.ts';
import { textGraphemes } from '../breaking/text-graphemes.ts';
import { getGlyphMeasurements } from '../glyph-metrics.ts';
import { rtStretchTargetWidthRatio } from './body-scale.ts';
import type { TextItem } from './types.ts';

export type PunctuationTrim = 'start' | 'end' | 'both';

export interface PunctuationSpacing {
  start?: number;
  end?: number;
}

export interface PunctuationLayout {
  fontSize: number;
  fontSizeRatio: number;
  letterSpacing: number;
  strokeOutset: number;
  rtStrokeOutset: number;
}

// 共用中日文标点及 Unicode 明确定义的全角标点和符号，字符分类与字形占宽无关。
const cjkPunctuation = new Set('、。〃〈〉《》「」『』【】〔〕〖〗〘〙〚〛〜〝〞〟〰・…‥—‘’“”·');
const fullwidthSymbol = /^(?=[\uFF01-\uFF60\uFFE0-\uFFE6])[\p{P}\p{S}]$/u;
const isPunctuation = (char: string | undefined) => char !== undefined && (cjkPunctuation.has(char) || fullwidthSymbol.test(char));

export const isInvisibleLayoutText = (text: string) => text === '\n' || text === '\u200B' || text === '\u2060';

export const getPunctuationSpacing = (fontFamily: string, trim: PunctuationTrim, fonts?: ReadonlyMap<string, FontEntry>) => {
  let measurements: ReturnType<typeof getGlyphMeasurements> | undefined;
  return (text: string): PunctuationSpacing | undefined => {
    const start = trim !== 'end' && isPunctuation(text[0]);
    const end = trim !== 'start' && isPunctuation(text.at(-1));
    if (!start && !end) return;
    if (measurements === undefined) measurements = getGlyphMeasurements(fontFamily, fonts);
    if (!measurements) return;
    const { units, getMeasurement } = measurements;
    // 有选择符或组合记号的字素可能使用另一字形，只有单码点才可使用该度量。
    const graphemes = text.length === 1 ? [text] : textGraphemes(text);
    const first = graphemes[0];
    const last = graphemes.at(-1)!;
    const left = start && first.length === 1 ? getMeasurement(first)?.left : undefined;
    const right = end && last.length === 1 ? getMeasurement(last)?.right : undefined;
    if (left !== undefined || right !== undefined) {
      return { start: left === undefined ? undefined : left / units, end: right === undefined ? undefined : right / units };
    }
  };
};

/** 注音仍以未挤压的正文宽度居中。只使用注音绘制范围之外的空白。 */
const getAnnotationClearance = ({ rt }: TextItem, bodyWidth: number, strokeOutset: number) => {
  if (!rt.text) return Infinity;
  if (rt.width === undefined || rt.width >= bodyWidth) return 0;
  const stretch = Math.max(0, bodyWidth * rtStretchTargetWidthRatio - rt.width) * (rt.stretchGapRatio ?? 0);
  return Math.max(0, (bodyWidth - rt.width - stretch) / 2 - strokeOutset);
};

/** 记录候选行的两端。右侧挤量随候选末项变化，行中标点始终保留自然宽度。 */
export class LinePunctuation {
  start: number | undefined;
  end: number | undefined;
  trailingSpace = 0;

  reset() {
    this.start = this.end = undefined;
    this.trailingSpace = 0;
  }

  add(item: TextItem, bodyWidth: number, occupiedWidth: number, scaleX: number, layout: PunctuationLayout) {
    const { ruby } = item;
    if (isInvisibleLayoutText(ruby.text)) return;

    const spacing = ruby.punctuationSpacing;
    const maxTrim = spacing
      ? Math.min(Math.max(0, bodyWidth), getAnnotationClearance(item, bodyWidth, layout.rtStrokeOutset))
      : 0;

    if (this.start === undefined) {
      const space = (spacing?.start ?? 0) * layout.fontSize - layout.strokeOutset;
      this.start = Math.min(maxTrim, Math.max(0, space * scaleX));
    }

    if (ruby.text === ' ' && !ruby.atomic) {
      this.trailingSpace += occupiedWidth;
    } else {
      const letterSpacing = layout.letterSpacing * (ruby.bodyRun ? layout.fontSizeRatio : 1);
      const space = spacing?.end === undefined ? 0 : spacing.end * layout.fontSize + letterSpacing - layout.strokeOutset;
      this.end = Math.min(maxTrim, Math.max(0, space * scaleX));
      this.trailingSpace = 0;
    }
  }

  append(next: LinePunctuation) {
    this.start ??= next.start;
    if (next.end !== undefined) {
      this.end = next.end;
      this.trailingSpace = 0;
    }
    this.trailingSpace += next.trailingSpace;
  }

  reduction(next?: LinePunctuation) {
    const start = this.start ?? next?.start ?? 0;
    const end = next?.end ?? this.end ?? 0;
    // 行尾标点后仍待确认的普通空格在断行时清理，续接正文时会重新占宽。
    const trailingSpace = next?.end === undefined ? this.trailingSpace + (next?.trailingSpace ?? 0) : next.trailingSpace;
    return start + end + (end > 0 ? trailingSpace : 0);
  }
}
