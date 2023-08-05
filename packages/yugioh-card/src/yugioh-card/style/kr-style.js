import { inheritProp } from '../../utils';

export default inheritProp({
  fontFamily: 'ygo-kr, serif',
  name: {
    fontFamily: 'ygo-kr-name, serif',
    top: 90,
    fontSize: 106,
    letterSpacing: 4,
    wordSpacing: -20,
    rtFontSize: 18,
    rtTop: 6,
  },
  spellTrap: {
    fontFamily: 'ygo-kr-race, serif',
    top: 253,
    fontSize: 88,
    wordSpacing: 5,
    scaleY: 0.75,
    right: 142,
    icon: {
      marginTop: 6,
      marginLeft: 12,
      marginRight: 12,
    },
  },
  pendulumDescription: {
    top: 1282,
    fontSize: 36,
    lineHeight: 1.19,
    wordSpacing: 5,
  },
  effect: {
    fontFamily: 'ygo-kr-race, serif',
    top: 1526,
    fontSize: 48,
    lineHeight: 1.19,
    wordSpacing: 12,
    minHeight: 8,
  },
  description: {
    fontSize: 36,
    lineHeight: 1.19,
    wordSpacing: 5,
  },
});
