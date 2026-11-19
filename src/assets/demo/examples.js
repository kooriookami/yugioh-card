import fieldCenter from './field-center-demo.js';
import rushDuel from './rush-duel-demo.js';
import yugiohBack from './yugioh-back-demo.js';
import yugiohSeries2 from './yugioh-series-2-demo.js';
import yugioh from './yugioh-demo.js';

export const cardTypes = {
  yugioh: 'YugiohCard',
  'rush-duel': 'RushDuelCard',
  'yugioh-back': 'YugiohBackCard',
  'field-center': 'FieldCenterCard',
  'yugioh-series-2': 'YugiohSeries2Card',
};

export const cardExamples = [
  { id: 'yugioh', type: 'yugioh', data: yugioh },
  {
    id: 'pendulum',
    type: 'yugioh',
    data: {
      ...yugioh,
      language: 'en',
      name: 'Pendulum Dragon',
      cardLayout: 'pendulum',
      pendulumFrame: 'effect-pendulum',
      pendulumScale: 4,
      pendulumEffect: 'Once per turn: You can gain 500 LP.',
      monsterTypeLine: 'Dragon / Pendulum / Effect',
      cardText: 'If this card is Normal Summoned: You can draw 1 card.',
    },
  },
  {
    id: 'link',
    type: 'yugioh',
    data: {
      ...yugioh,
      language: 'en',
      name: 'Link Dragon',
      monsterFrame: 'link',
      linkArrows: [1, 4, 6],
      monsterTypeLine: 'Dragon / Link / Effect',
      cardText: '2+ monsters\nIf this card is Link Summoned: You can draw 1 card.',
      compressCardTextSegments: [1],
    },
  },
  { id: 'rush-duel', type: 'rush-duel', data: rushDuel },
  {
    id: 'maximum',
    type: 'rush-duel',
    data: {
      ...rushDuel,
      language: 'jp',
      name: 'マキシマム・ドラゴン',
      monsterFrame: 'effect',
      level: 10,
      monsterTypeLine: 'ドラゴン族／マキシマム／効果',
      maximumAtk: 4000,
      atk: 2000,
      def: 0,
      cardText: '【条件】なし\n【効果】このカードの攻撃力はターン終了時まで５００アップする。',
      showLegendMark: false,
    },
  },
  { id: 'yugioh-back', type: 'yugioh-back', data: yugiohBack },
  { id: 'tcg-back', type: 'yugioh-back', data: { ...yugiohBack, gameLogo: 'tcg' } },
  { id: 'field-center', type: 'field-center', data: fieldCenter },
  { id: 'field-center-back', type: 'field-center', data: { ...fieldCenter, renderBackSide: true } },
  { id: 'yugioh-series-2', type: 'yugioh-series-2', data: yugiohSeries2 },
];

export const findExample = id => cardExamples.find(example => example.id === id) ?? cardExamples[0];
