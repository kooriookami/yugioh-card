import { inheritProp } from '../../utils/index.ts';
import type { YugiohStyle } from '../../card/style-types.ts';

export default inheritProp<YugiohStyle>({
  fontFamily: 'ygo-kr',
  name: {
    fontFamily: 'ygo-kr-name',
    top: 90,
    fontSize: 106,
    letterSpacing: 4,
    wordSpacing: -20,
    rtFontSize: 18,
    rtOffsetY: 6,
  },
  spellTrapLabel: {
    fontFamily: 'ygo-kr-race',
    top: 253,
    fontSize: 88,
    wordSpacing: 5,
    scaleY: 0.75,
    right: 142,
    icon: {
      marginTop: 6,
      marginLeft: 12,
      marginRight: 12,
    },
  },
  pendulumEffect: {
    top: 1282,
    fontSize: 36,
    lineHeight: 1.19,
    wordSpacing: 5,
  },
  monsterTypeLine: {
    fontFamily: 'ygo-kr-race',
    top: 1526,
    fontSize: 48,
    lineHeight: 1.19,
    wordSpacing: 12,
    minHeight: 8,
  },
  cardText: {
    fontSize: 36,
    lineHeight: 1.19,
    wordSpacing: 5,
  },
});
