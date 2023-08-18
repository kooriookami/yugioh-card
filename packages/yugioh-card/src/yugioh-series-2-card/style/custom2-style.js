import { inheritProp } from '../../utils';

export default inheritProp({
  fontFamily: 'custom2, 楷体, serif',
  name: {
    top: 128,
    fontSize: 114,
  },
  spellTrap: {
    top: 308,
    fontSize: 76,
    right: 130,
    icon: {
      marginTop: 12,
      marginLeft: 10,
    },
  },
  effect: {
    top: 1682,
    fontSize: 48,
    lineHeight: 1.2,
    textIndent: -0.4 * 48,
    minHeight: 10,
  },
  description: {
    fontSize: 42,
    lineHeight: 1.2,
  },
});
