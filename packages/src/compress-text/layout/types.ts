import type { IGroup, IFill, IFontWeight, IGroupInputData, IStroke, ITextInputData, IText } from '@leafer-ui/interface';
import type { BodyRun } from '../body-run.ts';
import type { SideBearingMode } from '../glyph-metrics.ts';
import type { PunctuationSpacing, PunctuationTrim } from './line-punctuation.ts';

export interface TextSettings {
  text: string | number;
  fontFamily: string;
  fontSize: number;
  fontWeight: IFontWeight;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  compressSegments: number[];
  textAlign: 'left' | 'center' | 'right' | 'justify';
  textJustifyLast: boolean;
  color: IFill & IStroke;
  strokeWidth: number;
  gradient: boolean;
  gradientColor1: string;
  gradientColor2: string;
  rtFontFamily: string;
  rtFontSize: number;
  rtFontWeight: IFontWeight;
  rtLineHeight: number;
  rtLetterSpacing: number;
  rtOffsetY: number;
  rtColor: IFill;
  rtStrokeWidth: number;
  rtScaleXOverride: number | null;
  fontSizeScale: number;
  autoSmallSize: boolean;
  smallFontSize: number;
  width: number;
  height: number;
  x: number;
  y: number;
  zIndex: number;
}

export type CompressTextOptions = IGroupInputData & Partial<TextSettings> & {
  sideBearingMode?: SideBearingMode;
  punctuationTrim?: PunctuationTrim;
};
export type TextPaint = Omit<ITextInputData, 'stroke'> & { stroke?: IStroke | null };
export type TextLeafStyle = TextPaint & { text: string; fontSize: number; lineHeight: number; letterSpacing: number };

export interface ParsedRuby {
  text: string;
  bold: boolean;
  atomic?: boolean;
}

export interface RubyLayout extends ParsedRuby {
  rubyNode: IText | IGroup;
  bodyRun: BodyRun | null;
  originalWidth: number;
  normalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  line: number;
  paddingLeft?: number;
  paddingRight?: number;
  punctuationSpacing?: PunctuationSpacing;
}

export interface Annotation {
  text: string;
  rtNode?: IText;
  width?: number;
  /** 供摆放、换行和压缩试算共用的最小占宽。 */
  minWidth?: number;
  /** 注音扩字距时，可见字缝数与用于计算字距的字素间隙数之比。 */
  stretchGapRatio?: number;
}

export interface TextItem<Ruby extends ParsedRuby = RubyLayout> {
  ruby: Ruby;
  rt: Annotation;
}

export type BreakUnit = TextItem[];
export type HardBreakSegment = BreakUnit[];
