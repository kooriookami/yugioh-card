import { inheritProp } from '../../utils/index.js';

export default inheritProp({
  fontFamily: 'ygo-jp',
  sideBearingRatio: 0.5,
  name: {
    top: 98,
    fontSize: 108,
    rtFontSize: 20,
    rtOffsetY: -2,
  },
  spellTrap: {
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
  pendulumDescription: {
    top: 1288,
    fontSize: 36,
    lineHeight: 1.17,
    rtFontSize: 12,
    rtOffsetY: -5,
  },
  monsterType: {
    top: 1528,
    fontSize: 46,
    lineHeight: 1.17,
    textIndent: -0.2 * 46,
    minHeight: 16,
    rtFontSize: 14,
    rtOffsetY: -6,
  },
  description: {
    fontSize: 38,
    lineHeight: 1.17,
    rtFontSize: 13,
    rtOffsetY: -6,
  },
});
