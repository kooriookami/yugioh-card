import { inheritProp } from '../../utils';

export default inheritProp({
  fontFamily: 'custom1, 楷体, serif',
  name: {
    top: 128,
    fontSize: 114,
  },
  spellTrap: {
    top: 308,
    fontSize: 76,
    right: 135,
    icon: {
      marginTop: 12,
      marginLeft: 10,
    },
  },
  effect: {
    top: 1682,
    fontSize: 50,
    lineHeight: 1.15,
    textIndent: -0.4 * 50,
    minHeight: 10,
  },
  description: {
    fontSize: 44,
    lineHeight: 1.15,
  },
});
