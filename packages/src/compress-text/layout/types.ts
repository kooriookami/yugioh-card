import type { IGroup, IFill, IFontWeight, IGroupInputData, IStroke, ITextInputData, IText } from '@leafer-ui/interface';
import type { BodyRun } from '../body-run.ts';

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

export type CompressTextOptions = IGroupInputData & Partial<TextSettings> & { sideBearingRatio?: number };
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
}

export interface Annotation {
  text: string;
  rtNode?: IText;
}

export interface MeasuredAnnotation extends Annotation {
  rtNode: IText;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
}

export interface TextItem<Ruby extends ParsedRuby = RubyLayout> {
  ruby: Ruby;
  rt: Annotation;
}

export type BreakUnit = TextItem[];
export type HardBreakSegment = BreakUnit[];

export interface AnnotationLayout {
  ruby: RubyLayout;
  rt: MeasuredAnnotation;
  rubyNode: IText | IGroup;
  rtNode: IText;
  paddingLeft: number;
  paddingRight: number;
  rubyWidth: number;
}
