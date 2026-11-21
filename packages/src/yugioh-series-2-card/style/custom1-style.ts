import { inheritProp } from '../../utils/index.ts';
import type { Series2Style } from '../../card/style-types.ts';

export default inheritProp<Series2Style>({
  fontFamily: 'custom1',
  name: {
    top: 128,
    fontSize: 114,
  },
  spellTrapLabel: {
    top: 308,
    fontSize: 76,
    right: 135,
    icon: {
      marginTop: 12,
      marginLeft: 10,
    },
  },
  monsterTypeLine: {
    top: 1682,
    fontSize: 50,
    lineHeight: 1.15,
    textIndent: -0.4 * 50,
    minHeight: 10,
  },
  cardText: {
    fontSize: 44,
    lineHeight: 1.15,
  },
});
