import { inheritProp } from '../../utils';

export default inheritProp({
  fontFamily: 'ygo-custom1, 楷体, serif',
  name: {
    top: 92,
    fontSize: 108,
  },
  spellTrap: {
    top: 250,
    fontSize: 76,
    right: 110,
    icon: {
      marginTop: 12,
      marginLeft: 10,
    },
  },
  pendulumDescription: {
    top: 1279,
    fontSize: 38,
    lineHeight: 1.15,
  },
  effect: {
    top: 1525,
    fontSize: 46,
    lineHeight: 1.15,
    textIndent: -0.4 * 46,
    minHeight: 10,
  },
  description: {
    fontSize: 38,
    lineHeight: 1.15,
  },
});
