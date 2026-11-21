import { inheritProp } from '../../utils/index.ts';
import type { YugiohStyle } from '../../card/style-types.ts';

export default inheritProp<YugiohStyle>({
  fontFamily: 'ygo-jp',
  sideBearingMode: 'legacy',
  name: {
    top: 98,
    fontSize: 108,
    rtFontSize: 20,
    rtOffsetY: -2,
  },
  spellTrapLabel: {
    top: 253,
    fontSize: 80,
    right: 130,
    icon: {
      marginTop: 10,
    },
    rtFontSize: 20,
    rtOffsetY: -8,
    rtScaleXOverride: 1.2,
  },
  pendulumEffect: {
    top: 1288,
    fontSize: 36,
    lineHeight: 1.17,
    rtFontSize: 12,
    rtOffsetY: -5,
  },
  monsterTypeLine: {
    top: 1528,
    fontSize: 46,
    sideBearingMode: 'native',
    lineHeight: 1.17,
    textIndent: -0.2 * 46,
    minHeight: 16,
    rtFontSize: 14,
    rtOffsetY: -6,
  },
  cardText: {
    fontSize: 38,
    lineHeight: 1.17,
    rtFontSize: 13,
    rtOffsetY: -6,
  },
});
