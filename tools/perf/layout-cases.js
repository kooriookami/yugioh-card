/** 固定输入供基线、源码和发布包分别运行；不包含引擎对象或进程全局状态。 */
export const japaneseText = '[自分(じぶん)]フィールドの[表側表示(おもてがわひょうじ)]モンスター１体を[対象(たいしょう)]として[発動(はつどう)]できる。そのモンスターの[攻撃力(こうげきりょく)]はターン[終了時(しゅうりょうじ)]まで５００アップする。';

export const textCases = [
  { text: '' },
  { text: '   ' },
  { text: '日あー ０１２３ AV。' },
  { text: '[青眼(ブルーアイズ)]の[白龍(ホワイト・ドラゴン)]' },
  { text: '<b>[自(じ)]分</b>\n①[魔(ま)]法' },
  { text: '[その]カードを[破(は)] [未完(の' },
  { text: '葛\u{E0100}か\u3099A\u0301 𠮷', width: 1 },
  { text: 'ABC\n\nDEF\n\n', fontFamily: 'ygo-en', width: 200 },
  { text: 'one two three four five six seven eight', fontFamily: 'ygo-en', width: 120 },
  { text: '日  日   日 '.repeat(30), width: 200 },
  { text: '日'.repeat(800), width: 1175 },
  { text: 'W'.repeat(200), fontFamily: 'ygo-en', width: 300 },
  { text: 'AV fi ffi To '.repeat(20), fontFamily: 'ygo-en', width: 210 },
  { text: japaneseText.repeat(4), height: 270 },
  { text: '[日(にちにちにちにち)]　[明日(あした)] '.repeat(12), width: 300, height: 100 },
  ...['left', 'center', 'right', 'justify'].map(textAlign => ({ text: japaneseText, width: 400, textAlign, textJustifyLast: true })),
  ...[0, 0.5, 1].map(sideBearingRatio => ({ text: '[日あー(X)] ０１２ AV。', sideBearingRatio, gradient: true })),
  ...[8, 15, 30, 42, 64.8].map(height => ({ text: 'ABC DEF GHI\nJKL MNO', fontFamily: 'ygo-en', fontSize: 20, lineHeight: 1.05, width: 100, height, autoSmallSize: true, smallFontSize: 10 })),
  { text: '[Beast-Warrior / Pendulum / Tuner / Effect]', fontFamily: 'ygo-en-race', fontSize: 56, letterSpacing: 1, lineHeight: 1.02, width: 1175, height: 57.12 },
  { text: japaneseText, compressFirstSegment: true, width: 250, height: 80, autoSmallSize: true, smallFontSize: 18 },
  { text: '简体中文标点，测试。繁體中文標點，測試。', fontFamily: 'ygo-sc' },
  { text: '繁體中文標點，測試。', fontFamily: 'ygo-tc' },
  { text: '한글 카드 효과 설명', fontFamily: 'ygo-kr' },
  { text: 'ABCD', fontFamily: 'custom1' },
  { text: 'ABCD', fontFamily: 'custom2' },
  { text: 'Fallback 日あー AV', fontFamily: 'layout-unknown-font' },
];

// 固定种子的组合覆盖临界宽高和样式组合，避免每次验证的样本漂移。
let seed = 0x190032;
const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
for (let index = 0; index < 64; index++) {
  textCases.push({
    text: [japaneseText, 'ABC  DEF GHI JKL MNO '.repeat(5), '[日(にちにちにち)] 日　あー '.repeat(5)][index % 3],
    fontFamily: index % 3 === 1 ? 'ygo-en' : 'ygo-jp',
    width: 80 + random() * 550,
    height: [0, 15, 50, 100, 160][index % 5],
    compressFirstSegment: index % 4 === 0,
    autoSmallSize: index % 2 === 0,
    smallFontSize: index % 3 === 0 ? 18 : 10,
    fontSizeScale: [0.75, 1, 1.25][index % 3],
    letterSpacing: index % 3,
    wordSpacing: index % 4,
    textAlign: ['left', 'center', 'right', 'justify'][index % 4],
    gradient: index % 5 === 0,
    strokeWidth: index % 2,
    rtStrokeWidth: index % 2,
    scaleX: [1, 0.75, 1.25][index % 3],
    scaleY: [1, 1.5][index % 2],
  });
}

export const updateCases = [
  { x: 20, y: 45 },
  { color: '#294b83', rtColor: '#b72c30' },
  { visible: false, zIndex: 7 },
  { visible: true, color: 'black', rtColor: 'black' },
  { gradient: true, gradientColor1: '#998833' },
  { color: '#00aabb', rtColor: '#cc22dd' },
  { gradientColor2: '#ffffff', strokeWidth: 1, rtStrokeWidth: 1 },
  { gradient: false },
  { color: '#442211', rtColor: '#223344' },
  { text: '[日(にちにちにち)] 日あー AV。\n日  日' },
  { width: 150, height: 45, autoSmallSize: true, smallFontSize: 12 },
  { color: '#123456', x: 35 },
  { width: 500, height: 200 },
  { fontFamily: 'ygo-en', color: '#654321', text: 'AV ffi one two three' },
  { color: null, x: null },
  { fontFamily: 'ygo-jp', text: '[青眼(ブルーアイズ)]の[白龍(ホワイト・ドラゴン)]' },
  { scaleX: 0.75, scaleY: 1.5 },
  { scaleX: 1, scaleY: 1 },
  {},
];

// The shared card fixtures use the frozen baseline's field names.
const cardFieldNames = {
  description: 'cardText',
  scale: 'renderScale',
  image: 'artwork',
  type: 'cardLayout',
  cardType: 'monsterFrame',
  pendulumType: 'pendulumFrame',
  monsterType: 'monsterTypeLine',
  pendulumDescription: 'pendulumEffect',
  arrowList: 'linkArrows',
  icon: 'spellTrapIcon',
  gradient: 'applyNameGradient',
  package: 'cardNumber',
  logo: 'gameLogo',
  konami: 'showKonamiLogo',
  cardBack: 'renderBackSide',
};

const cardFieldsFor = (defaults, fields) => {
  if (!Object.hasOwn(defaults, 'renderScale')) return fields;
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [cardFieldNames[key] ?? key, value]));
};

export const batchData = (defaults, index, images) => {
  const language = ['sc', 'jp', 'en'][index % 3];
  const variant = index % 5;
  const description = language === 'en' ? 'Once per turn: You can target 1 face-up monster on the field; it gains 500 ATK until the end of this turn. '.repeat(2)
    : language === 'jp' ? japaneseText.repeat(2) : '一回合一次，可以选择场上一只表侧表示怪兽发动。该怪兽的攻击力直到回合结束时上升500。'.repeat(3);
  const fields = {
    language,
    name: language === 'en' ? `Export test ${index + 1}` : language === 'jp' ? `[試験(しけん)]カード${index + 1}` : `导出测试卡片${index + 1}`,
    description, scale: 1, image: images[index % images.length],
    type: ['monster', 'pendulum', 'spell', 'trap', 'monster'][variant],
    cardType: variant === 4 ? 'link' : 'effect', pendulumType: 'effect-pendulum',
    monsterType: language === 'en' ? 'Dragon / Effect' : 'ドラゴン族／効果',
    atk: 1000 + index * 10, def: 2000 - index * 5, pendulumScale: index % 13,
    pendulumDescription: japaneseText, arrowList: variant === 4 ? [1, 3, 5] : [],
    level: index % 12 + 1, icon: variant === 2 ? 'quick-play' : '', gradient: index % 7 === 0,
    package: `BATCH-${String(index + 1).padStart(3, '0')}`, password: String(index + 1).padStart(8, '0'),
  };
  return { ...structuredClone(defaults), ...cardFieldsFor(defaults, fields) };
};

export const classData = (name, defaults, index, images) => {
  const sample = index === 3 ? 0 : index;
  const scale = 0.15;
  if (name === 'YugiohBackCard') {
    return { ...defaults, ...cardFieldsFor(defaults, { logo: index % 3 === 1 ? 'tcg' : 'ocg', konami: index % 3 !== 2, scale }) };
  }
  if (name === 'FieldCenterCard') {
    return { ...defaults, ...cardFieldsFor(defaults, { image: images[sample % images.length], cardBack: index % 3 === 2, scale }) };
  }

  const data = batchData(defaults, sample, images);
  const fields = { scale };
  if (name !== 'YugiohCard') fields.type = 'monster';
  if (name === 'YugiohSeries2Card') fields.language = 'jp';
  if (name === 'RushDuelCard' && data.language === 'en') fields.language = 'sc';
  return { ...data, ...cardFieldsFor(defaults, fields) };
};

/** 仅在对照工具中适配冻结版本的配置名称。 */
export const textOptionsFor = (CompressText, options) => {
  if ('calculateSegmentScaleX' in CompressText.prototype) {
    const { compressFirstSegment, ...current } = options;
    if (compressFirstSegment !== undefined) current.compressSegments = compressFirstSegment ? [1] : [];
    return current;
  }
  if ('relayoutBody' in CompressText.prototype) return options;
  const { compressFirstSegment, fontSizeScale, rtOffsetY, ...legacy } = options;
  if ('compressFirstSegment' in options) legacy.firstLineCompress = compressFirstSegment;
  if ('fontSizeScale' in options) legacy.fontScale = fontSizeScale;
  if ('rtOffsetY' in options) legacy.rtTop = rtOffsetY;
  return legacy;
};

const properties = ['tag', 'text', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'fill', 'stroke', 'strokeWidth', 'strokeAlign', 'shadow', 'around', 'x', 'y', 'scaleX', 'scaleY', 'visible', 'opacity', 'zIndex'];
export const nodeSnapshot = node => ({
  ...Object.fromEntries(properties.map(key => [key, node[key]])),
  children: node.children?.map(nodeSnapshot),
});

export const textSnapshot = text => JSON.parse(JSON.stringify({
  bounds: text.bounds, currentX: text.currentX, currentY: text.currentY, currentLine: text.currentLine,
  // 沿用既有快照键，使改名本身不影响改动前后的对照。
  textScale: text.lastSegmentScaleX ?? text.textScale,
  firstLineTextScale: text.segmentScaleX?.get(0) ?? text.firstSegmentScaleX ?? text.firstLineTextScale ?? 1,
  isSmallSize: text.isSmallSize,
  items: text.flatItemList.map(({ ruby, rt }) => ({
    ruby: Object.fromEntries(['text', 'bold', 'originalWidth', 'normalWidth', 'width', 'height', 'originalHeight', 'paddingLeft', 'paddingRight', 'line'].map(key => [key, ruby[key]])),
    rt: Object.fromEntries(['text', 'originalWidth', 'originalHeight', 'width', 'height'].map(key => [key, rt[key]])),
  })),
  nodes: nodeSnapshot(text),
}));
