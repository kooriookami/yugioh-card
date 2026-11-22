import { inheritProp } from '../../utils/index.ts';
import type { YugiohStyle } from '../../card/style-types.ts';

export default inheritProp<YugiohStyle>({
  fontFamily: 'custom1',
  name: {
    top: 92,
    fontSize: 108,
  },
  spellTrapLabel: {
    top: 250,
    fontSize: 76,
    right: 149,
    icon: {
      marginTop: 12,
      marginLeft: 10,
    },
  },
  pendulumEffect: {
    top: 1279,
    fontSize: 38,
    lineHeight: 1.15,
  },
  monsterTypeLine: {
    top: 1525,
    fontSize: 46,
    lineHeight: 1.15,
    minHeight: 10,
  },
  cardText: {
    fontSize: 38,
    lineHeight: 1.15,
  },
});
