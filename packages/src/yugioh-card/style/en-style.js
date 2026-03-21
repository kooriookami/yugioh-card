import { inheritProp } from '../../utils/index.js';

export default inheritProp({
  fontFamily: 'ygo-en',
  name: {
    fontFamily: 'ygo-en-name',
    top: 52,
    fontSize: 158,
    letterSpacing: 1,
  },
  spellTrap: {
    fontFamily: 'ygo-en-race',
    top: 254,
    fontSize: 74,
    right: 145,
    letterSpacing: 1,
    icon: {
      marginTop: 10,
      marginLeft: 10,
    },
  },
  pendulumDescription: {
    top: 1282,
    fontSize: 42,
    lineHeight: 1.02,
  },
  effect: {
    fontFamily: 'ygo-en-race',
    top: 1527,
    fontSize: 56,
    letterSpacing: 1,
    lineHeight: 1.02,
  },
  description: {
    fontSize: 42,
    lineHeight: 1.02,
    smallFontSize: 36,
  },
});
