import { inheritProp } from '../../utils/index.ts';
import type { YugiohStyle } from '../../card/style-types.ts';

export default inheritProp<YugiohStyle>({
  fontFamily: 'ygo-en',
  name: {
    fontFamily: 'ygo-en-name',
    top: 52,
    fontSize: 158,
    letterSpacing: 1,
  },
  spellTrapLabel: {
    fontFamily: 'ygo-en-race',
    top: 254,
    fontSize: 74,
    right: 145,
    letterSpacing: 1,
    icon: {
      marginTop: 10,
      marginLeft: 10,
    },
  },
  pendulumEffect: {
    top: 1282,
    fontSize: 42,
    lineHeight: 1.02,
  },
  monsterTypeLine: {
    fontFamily: 'ygo-en-race',
    top: 1527,
    fontSize: 56,
    letterSpacing: 1,
    lineHeight: 1.02,
  },
  cardText: {
    fontSize: 42,
    lineHeight: 1.02,
    smallFontSize: 36,
  },
});
