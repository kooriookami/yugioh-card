import { inheritProp } from '../../utils/index.ts';
import type { Series2Style } from '../../card/style-types.ts';

export default inheritProp<Series2Style>({
  fontFamily: 'ygo-jp',
  punctuationTrim: true,
  name: {
    top: 136,
    fontSize: 114,
    rtFontSize: 26,
    rtOffsetY: -8,
  },
  spellTrapLabel: {
    top: 312,
    fontSize: 80,
    right: 174,
    icon: {
      marginTop: 10,
    },
    rtFontSize: 20,
    rtOffsetY: -11,
    rtScaleXOverride: 1.2,
  },
  monsterTypeLine: {
    top: 1685,
    fontSize: 50,
    lineHeight: 1.2,
    minHeight: 10,
    rtFontSize: 16,
    rtOffsetY: -7,
  },
  cardText: {
    fontSize: 44,
    lineHeight: 1.2,
    rtFontSize: 14,
    rtOffsetY: -6,
  },
});
