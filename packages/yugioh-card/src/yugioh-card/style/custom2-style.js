import { inheritProp } from '../../utils';

export default inheritProp({
  fontFamily: 'ygo-custom2, 楷体, serif',
  name: {
    top: 92,
    fontSize: 108,
  },
  spellTrap: {
    top: 250,
    fontSize: 76,
    right: 104,
    icon: {
      marginTop: 12,
      marginLeft: 10,
    },
  },
  pendulumDescription: {
    top: 1280,
    fontSize: 36,
    lineHeight: 1.2,
  },
  effect: {
    top: 1525,
    fontSize: 44,
    lineHeight: 1.2,
    textIndent: -0.4 * 44,
    minHeight: 10,
  },
  description: {
    fontSize: 36,
    lineHeight: 1.2,
  },
});
