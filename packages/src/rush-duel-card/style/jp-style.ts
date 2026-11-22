import { inheritProp } from '../../utils/index.ts';
import type { RushDuelStyle } from '../../card/style-types.ts';

export default inheritProp<RushDuelStyle>({
  fontFamily: 'rd-jp',
  punctuationTrim: true,
  name: {
    fontFamily: 'rd-jp-name',
    top: 76,
    fontSize: 92,
    rtFontSize: 20,
    rtOffsetY: -15,
  },
  spellTrapLabel: {
    fontFamily: 'rd-jp-effect',
    top: 1478,
    fontSize: 46,
    letterSpacing: 2,
    icon: {
      marginTop: -4,
      marginLeft: 5,
    },
    rtFontSize: 14,
    rtOffsetY: -13,
  },
  monsterTypeLine: {
    fontFamily: 'rd-jp-effect',
    top: 1478,
    fontSize: 46,
    letterSpacing: 2,
    rtFontSize: 14,
    rtOffsetY: -13,
  },
  cardText: {
    top: 1560,
    fontSize: 39,
    lineHeight: 1.4,
    rtFontSize: 13,
    rtOffsetY: -6,
  },
});
