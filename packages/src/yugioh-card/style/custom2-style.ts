import { inheritProp } from '../../utils/index.ts';
import type { YugiohStyle } from '../../card/style-types.ts';

export default inheritProp<YugiohStyle>({
  fontFamily: 'custom2',
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
    top: 1280,
    fontSize: 36,
    lineHeight: 1.2,
  },
  monsterTypeLine: {
    top: 1525,
    fontSize: 44,
    lineHeight: 1.2,
    minHeight: 10,
  },
  cardText: {
    fontSize: 36,
    lineHeight: 1.2,
  },
});
