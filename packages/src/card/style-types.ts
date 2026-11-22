import type { IFontWeight } from '@leafer-ui/interface';
import type { SideBearingMode } from '../compress-text/glyph-metrics.ts';

interface TextStyle {
  fontSize: number;
  fontFamily?: string;
  fontWeight?: IFontWeight;
  lineHeight?: number;
  letterSpacing?: number;
  wordSpacing?: number;
  sideBearingMode?: SideBearingMode;
  punctuationTrim?: boolean;
  rtFontSize?: number;
  rtOffsetY?: number;
}

type PositionedTextStyle = TextStyle & { top: number };

interface SpellTrapLabelStyle extends PositionedTextStyle {
  scaleY?: number;
  rtScaleXOverride?: number;
  icon: { marginTop?: number; marginRight?: number; marginLeft?: number };
}

interface CardStyle {
  fontFamily: string;
  sideBearingMode?: SideBearingMode;
  punctuationTrim?: boolean;
  name: PositionedTextStyle;
  spellTrapLabel: SpellTrapLabelStyle;
  monsterTypeLine: PositionedTextStyle & { minHeight?: number };
  cardText: TextStyle & { top?: number; smallFontSize?: number };
}

export interface Series2Style extends CardStyle {
  spellTrapLabel: SpellTrapLabelStyle & { right: number };
  monsterTypeLine: CardStyle['monsterTypeLine'] & { minHeight: number; lineHeight: number };
}

export interface YugiohStyle extends CardStyle {
  spellTrapLabel: SpellTrapLabelStyle & { right: number };
  monsterTypeLine: CardStyle['monsterTypeLine'] & { lineHeight: number };
  pendulumEffect: PositionedTextStyle;
}

export interface RushDuelStyle extends CardStyle {
  cardText: CardStyle['cardText'] & { top: number };
}
