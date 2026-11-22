import { inheritProp } from '../../utils/index.ts';
import type { Series2Style } from '../../card/style-types.ts';

export default inheritProp<Series2Style>({
  fontFamily: 'custom2',
  name: {
    top: 128,
    fontSize: 114,
  },
  spellTrapLabel: {
    top: 308,
    fontSize: 76,
    right: 174,
    icon: {
      marginTop: 12,
      marginLeft: 10,
    },
  },
  monsterTypeLine: {
    top: 1682,
    fontSize: 48,
    lineHeight: 1.2,
    minHeight: 10,
  },
  cardText: {
    fontSize: 42,
    lineHeight: 1.2,
  },
});
