import { inheritProp } from '../../utils/index.ts';
import type { RushDuelStyle } from '../../card/style-types.ts';

export default inheritProp<RushDuelStyle>({
  fontFamily: 'rd-sc',
  name: {
    fontFamily: 'rd-sc-name',
    top: 71,
    fontSize: 92,
  },
  spellTrapLabel: {
    top: 1476,
    fontSize: 46,
    fontWeight: 'bold',
    letterSpacing: 2,
    icon: {
      marginTop: -5,
      marginLeft: 5,
    },
  },
  monsterTypeLine: {
    top: 1476,
    fontSize: 46,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  cardText: {
    top: 1561,
    fontSize: 39,
    lineHeight: 1.39,
  },
});
