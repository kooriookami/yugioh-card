import { inheritProp } from '../../utils/index.ts';
import type { YugiohStyle } from '../../card/style-types.ts';

export default inheritProp<YugiohStyle>({
  fontFamily: 'ygo-astral',
  name: {
    top: 107,
    fontSize: 103,
  },
  spellTrapLabel: {
    top: 258,
    fontSize: 76,
    right: 144,
    icon: {
      marginTop: 4,
    },
  },
  pendulumEffect: {
    top: 1284,
    fontSize: 42,
    lineHeight: 1.04,
  },
  monsterTypeLine: {
    top: 1533,
    fontSize: 44,
    lineHeight: 1.04,
  },
  cardText: {
    fontSize: 42,
    lineHeight: 1.04,
  },
});
