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
  { id: 'rush-duel', type: 'rush-duel', data: rushDuel },
  { id: 'yugioh-back', type: 'yugioh-back', data: yugiohBack },
  { id: 'field-center', type: 'field-center', data: fieldCenter },
  { id: 'yugioh-series-2', type: 'yugioh-series-2', data: yugiohSeries2 },
];

export const findExample = id => cardExamples.find(example => example.id === id) ?? cardExamples[0];
