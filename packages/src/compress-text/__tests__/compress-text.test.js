import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { useCanvas } from 'leafer-unified';
import skia from 'skia-canvas';
import { CompressText as OldCompressText } from 'yugioh-card-v190/src/compress-text/compress-text';
import { loadFontNode } from '../../utils/index.js';
import { CompressText as NewCompressText } from '../compress-text.js';

useCanvas('skia', skia);
loadFontNode(path.resolve('./src/assets/yugioh-card/yugioh/font'), skia);

const baseConfig = {
  lineHeight: 1.5,
  fontSize: 32,
  rtFontSize: 16,
  rtTop: -8,
  y: 14,
  textAlign: 'justify',
  firstLineCompress: false,
  smallFontSize: 16,
  width: 320,
};

const parityCaseList = [
  {
    label: 'ruby-basic',
    config: {
      ...baseConfig,
      text: '[自(じ)][分(ぶん)]フィールドの[表(おもて)][側(がわ)][攻(こう)][撃(げき)][表(ひょう)][示(じ)]モンスター１[体(たい)]を[対(たい)][象(しょう)]としてこのカードを[発(はつ)][動(どう)]できる。①：このカードが[魔(ま)][法(ほう)]＆[罠(トラップ)]ゾーンに[存(そん)][在(ざい)]する[限(かぎ)]り、そのモンスターは[戦(せん)][闘(とう)]・[効(こう)][果(か)]では[破(は)][壊(かい)]されない。そのモンスターがフィールドから[離(はな)]れた[場(ば)][合(あい)]にこのカードは[破(は)][壊(かい)]される。',
      width: 400,
    },
  },
  {
    label: 'first-line-compress',
    config: {
      ...baseConfig,
      text: '【[永(えい)][続(ぞく)][魔(ま)][法(ほう)]】[自(じ)][分(ぶん)]は１ターンに１[度(ど)]、[手(て)][札(ふだ)]を１[枚(まい)][捨(す)]てて[発(はつ)][動(どう)]できる。デッキから[魔(ま)][法(ほう)]カード１[枚(まい)]を[手(て)][札(ふだ)]に[加(くわ)]える。',
      width: 420,
      firstLineCompress: true,
    },
  },
  {
    label: 'auto-small-size',
    config: {
      ...baseConfig,
      text: '[这(これ)]はテスト[用(よう)]の[長(なが)]い[文(ぶん)]です。[高(たか)]さが[足(た)]りない[場(ば)][合(あい)]に、[文(も)][字(じ)][全(ぜん)][体(たい)]が[自(じ)][動(どう)][的(てき)]に[縮(ちぢ)]むかを[確(かく)][認(にん)]します。②：さらに[別(べつ)]の[効(こう)][果(か)]テキストを[追(つい)][加(か)]して、[複(ふく)][数(すう)][行(ぎょう)]での[挙(きょ)][動(どう)]を[見(み)]ます。',
      height: 92,
      autoSmallSize: true,
    },
  },
  {
    label: 'center-align',
    config: {
      ...baseConfig,
      text: '[自(じ)][分(ぶん)]フィールドのカード',
      width: 240,
      textAlign: 'center',
    },
  },
  {
    label: 'right-align',
    config: {
      ...baseConfig,
      text: 'カード[発(はつ)][動(どう)]テスト',
      width: 240,
      textAlign: 'right',
    },
  },
  {
    label: 'justify-last-line',
    config: {
      ...baseConfig,
      text: '[相(あい)][手(て)]フィールドのカード１枚を対象として発動できる。',
      width: 260,
      textJustifyLast: true,
    },
  },
  {
    label: 'explicit-newline',
    config: {
      ...baseConfig,
      text: '●[相(あい)][手(て)]フィールド\n①：[自(じ)][分(ぶん)]は１枚引く。',
      width: 280,
    },
  },
  {
    label: 'gradient',
    config: {
      ...baseConfig,
      text: '[魔(ま)][法(ほう)]カード',
      width: 220,
      gradient: true,
    },
  },
  {
    label: 'rt-font-scale-x',
    config: {
      ...baseConfig,
      text: '[魔法(まほう)]',
      width: 160,
      rtFontScaleX: 0.75,
    },
  },
  {
    label: 'word-spacing-and-space',
    config: {
      ...baseConfig,
      text: 'A B [自(じ)] C',
      width: 220,
      wordSpacing: 12,
    },
  },
  {
    label: 'long-rt-padding',
    config: {
      ...baseConfig,
      text: '[魔(まほうほうほう)]カード',
      width: 220,
    },
  },
];

const autoSmallSizeConfig = {
  ...baseConfig,
  text: '[这(これ)]はテスト[用(よう)]の[長(なが)]い[文(ぶん)]です。[高(たか)]さが[足(た)]りない[場(ば)][合(あい)]に、[文(も)][字(じ)][全(ぜん)][体(たい)]が[自(じ)][動(どう)][的(てき)]に[縮(ちぢ)]むかを[確(かく)][認(にん)]します。②：さらに[別(べつ)]の[効(こう)][果(か)]テキストを[追(つい)][加(か)]して、[複(ふく)][数(すう)][行(ぎょう)]での[挙(きょ)][動(どう)]を[見(み)]ます。',
  height: 92,
  autoSmallSize: true,
};

const getRubyList = instance => {
  return instance.rubyList ?? instance.parseList.flat().map(item => item.ruby);
};

const snapshotRuby = ruby => {
  return {
    text: ruby.text,
    x: ruby.rubyLeaf.x,
    y: ruby.rubyLeaf.y,
    width: ruby.width,
    line: ruby.line,
    paddingLeft: ruby.paddingLeft || 0,
    paddingRight: ruby.paddingRight || 0,
  };
};

const summarizeLayout = instance => {
  const rubyList = getRubyList(instance);
  const flatItemList = instance.flatItemList || instance.parseList.flat();

  return {
    bounds: instance.bounds,
    textScale: instance.textScale,
    firstLineTextScale: instance.firstLineTextScale,
    isSmallSize: instance.isSmallSize,
    currentLine: instance.currentLine,
    currentX: instance.currentX,
    currentY: instance.currentY,
    needCompressTwice: instance.needCompressTwice,
    rubyCount: rubyList.length,
    rtCount: flatItemList.filter(item => item.rt.text).length,
    first: rubyList.slice(0, 5).map(snapshotRuby),
    last: rubyList.slice(-5).map(snapshotRuby),
    rt: flatItemList.filter(item => item.rt.text).slice(0, 5).map(item => {
      return {
        rubyText: item.ruby.text,
        rtText: item.rt.text,
        x: item.rt.rtLeaf.x,
        y: item.rt.rtLeaf.y,
        scaleX: item.rt.rtLeaf.scaleX || 1,
        letterSpacing: item.rt.rtLeaf.letterSpacing || 0,
        paddingLeft: item.ruby.paddingLeft || 0,
        paddingRight: item.ruby.paddingRight || 0,
      };
    }),
  };
};

const summarizeRuntimeState = instance => {
  return {
    text: instance.text,
    fontSize: instance.fontSize,
    smallFontSize: instance.smallFontSize,
    width: instance.width,
    height: instance.height,
    textAlign: instance.textAlign,
    layout: summarizeLayout(instance),
  };
};

const summarizeDefaultData = instance => {
  return {
    text: instance.defaultData.text,
    fontSize: instance.defaultData.fontSize,
    smallFontSize: instance.defaultData.smallFontSize,
    width: instance.defaultData.width,
    height: instance.defaultData.height,
    textAlign: instance.defaultData.textAlign,
  };
};

test('CompressText matches yugioh-card@1.9.0 for autoSmallSize layout', () => {
  const next = new NewCompressText(autoSmallSizeConfig);
  const old = new OldCompressText(autoSmallSizeConfig);

  assert.deepEqual(summarizeLayout(next), summarizeLayout(old));
});

test('CompressText matches yugioh-card@1.9.0 for representative layout configurations', () => {
  parityCaseList.forEach(({ config }) => {
    const next = new NewCompressText(config);
    const old = new OldCompressText(config);

    assert.deepEqual(summarizeLayout(next), summarizeLayout(old));
  });
});

test('CompressText parses ruby, bold and explicit newline into caches', () => {
  const text = '<b>[自(じ)]分</b>\n①[魔(ま)]';
  const instance = new NewCompressText({ text, width: 240, ...baseConfig });

  assert.equal(instance.parseList.length, 5);
  assert.deepEqual(instance.parseList[0].map(item => item.ruby.text), ['自']);
  assert.deepEqual(instance.parseList[0].map(item => item.ruby.bold), [true]);
  assert.equal(instance.parseList[0][0].rt.text, 'じ');
  assert.equal(instance.parseList[1][0].ruby.text, '分');
  assert.equal(instance.parseList[1][0].ruby.bold, true);
  assert.equal(instance.parseList[2][0].ruby.text, '\n');
  assert.equal(instance.parseList[3][0].ruby.text, '①');
  assert.equal(instance.parseList[4][0].ruby.text, '魔');
  assert.equal(instance.parseList[4][0].rt.text, 'ま');
  assert.equal(instance.flatItemList.length, instance.parseList.flat().length);
  assert.equal(instance.rubyList.length, instance.flatItemList.length);
  assert.equal(instance.newlineList.length, 2);
  assert.ok(instance.rubyLineMap.size >= 1);
});

test('CompressText keeps malformed bracket text plain while parsing following valid ruby', () => {
  const text = '[その]カードを[破(は)]';
  const instance = new NewCompressText({ text, width: 240, ...baseConfig });
  const flatItemList = instance.flatItemList;
  const validRubyIndex = flatItemList.findIndex(item => item.rt.text === 'は');

  assert.notEqual(validRubyIndex, -1);
  assert.equal(flatItemList[validRubyIndex].ruby.text, '破');
  assert.equal(flatItemList[validRubyIndex].rt.text, 'は');
  assert.equal(flatItemList.slice(0, validRubyIndex).map(item => item.ruby.text).join(''), '[その]カードを');
});

test('CompressText helper getters reflect current size and padding', () => {
  const instance = new NewCompressText({ text: '[魔(ま)]法', width: 200, ...baseConfig });
  const ruby = instance.rubyList[0];

  ruby.paddingLeft = 3;
  ruby.paddingRight = 5;
  assert.equal(instance.getPaddingWidth(ruby), 8);
  assert.equal(instance.getCurrentFontSize(), 32);

  instance.isSmallSize = true;
  assert.equal(instance.getCurrentFontSize(), 16);
});

test('CompressText keeps defaultData pristine and falls back to class defaults', () => {
  const initConfig = {
    ...baseConfig,
    text: '[初(しょ)]期[設(せっ)][定(てい)]',
    fontSize: 30,
    smallFontSize: 15,
    width: 260,
    height: 96,
    textAlign: 'right',
  };
  const revertConfig = {
    text: undefined,
    fontSize: undefined,
    smallFontSize: undefined,
    width: undefined,
    height: undefined,
    textAlign: undefined,
  };

  const instance = new NewCompressText(initConfig);

  assert.deepEqual(summarizeDefaultData(instance), {
    text: '',
    fontSize: 24,
    smallFontSize: 18,
    width: 0,
    height: 0,
    textAlign: 'justify',
  });

  instance.set(revertConfig);

  assert.equal(instance.text, '');
  assert.equal(instance.fontSize, 24);
  assert.equal(instance.smallFontSize, 18);
  assert.equal(instance.width, 0);
  assert.equal(instance.height, 0);
  assert.equal(instance.textAlign, 'justify');
  assert.deepEqual(summarizeDefaultData(instance), {
    text: '',
    fontSize: 24,
    smallFontSize: 18,
    width: 0,
    height: 0,
    textAlign: 'justify',
  });
});

test('CompressText set update sequences match yugioh-card@1.9.0', () => {
  const initialConfig = {
    ...baseConfig,
    text: 'A B [自(じ)] C',
    width: 220,
    wordSpacing: 12,
  };
  const updateList = [
    {
      text: '[相(あい)][手(て)]フィールドのカード１枚を対象として発動できる。',
      width: 260,
      textJustifyLast: true,
    },
    {
      text: '<b>[自(じ)]分</b>①[魔(ま)]',
      width: 180,
      textAlign: 'center',
      firstLineCompress: false,
    },
    {
      text: '[这(これ)]はテスト[用(よう)]の[長(なが)]い[文(ぶん)]です。',
      width: 180,
      height: 70,
      autoSmallSize: true,
      smallFontSize: 14,
      textAlign: 'justify',
    },
  ];

  const next = new NewCompressText(initialConfig);
  const old = new OldCompressText(initialConfig);

  updateList.forEach(update => {
    next.set(update);
    old.set(update);
    assert.deepEqual(summarizeRuntimeState(next), summarizeRuntimeState(old));
  });
});

test('CompressText getFirstLineScale matches manual width calculation', () => {
  const instance = new NewCompressText({
    ...baseConfig,
    text: '[自(じ)][分(ぶん)]フィールド',
    width: 120,
    firstLineCompress: true,
  });
  const firstLineRubyList = instance.newlineList[0].flat().map(item => item.ruby);
  const totalWidth = firstLineRubyList.reduce((sum, ruby) => sum + ruby.originalWidth, 0);
  const paddingWidth = firstLineRubyList.reduce((sum, ruby) => sum + instance.getPaddingWidth(ruby), 0);
  const expected = Math.min(Math.floor((instance.width - paddingWidth) / totalWidth * 1000) / 1000, 1);

  assert.equal(instance.getFirstLineScale(), expected);
});

test('CompressText overflow helper reflects current layout height', () => {
  const instance = new NewCompressText({
    ...baseConfig,
    text: '[自(じ)][分(ぶん)]フィールドのカードです',
    width: 180,
    height: 60,
  });
  const lastRuby = instance.rubyList[instance.rubyList.length - 1];

  instance.currentY = 0;
  assert.equal(instance.doesOverflowHeight(lastRuby), false);

  instance.currentY = instance.height;
  assert.equal(instance.doesOverflowHeight(lastRuby), true);
});

test('CompressText stops height compression after reaching one-line height limit', () => {
  const instance = new NewCompressText({
    ...baseConfig,
    text: '[自(じ)][分(ぶん)]フィールドのカード１枚を対象として発動できる。',
    width: 180,
    height: 80,
  });
  const originalUpdateTextScale = instance.updateTextScale;
  let updateTextScaleCount = 0;

  instance.updateTextScale = (...args) => {
    updateTextScaleCount++;
    return originalUpdateTextScale.apply(instance, args);
  };

  instance.set({ height: 12 });

  const lastRuby = instance.rubyList[instance.rubyList.length - 1];
  assert.equal(instance.currentLine, 0);
  assert.equal(instance.reachedSingleLineHeightLimit(lastRuby), true);
  assert.equal(instance.doesOverflowHeight(lastRuby), true);
  assert.ok(updateTextScaleCount < 40);
});

test('CompressText gradient styling is applied to ruby leaves', () => {
  const instance = new NewCompressText({
    ...baseConfig,
    text: '[魔(ま)][法(ほう)]カード',
    width: 220,
    gradient: true,
  });
  const rubyLeaf = instance.rubyList[0].rubyLeaf;

  assert.equal(rubyLeaf.stroke, 'rgba(0, 0, 0, 0.6)');
  assert.equal(rubyLeaf.strokeAlign, 'outside');
  assert.equal(rubyLeaf.fill.type, 'linear');
  assert.equal(rubyLeaf.fill.stops.length, 5);
  assert.equal(rubyLeaf.shadow.color, 'rgba(0, 0, 0, 0.6)');
});

test('CompressText updates ruby padding when rt is much wider than ruby', () => {
  const instance = new NewCompressText({
    ...baseConfig,
    text: '[魔(まほうほうほう)]カード',
    width: 220,
  });
  const ruby = instance.rubyList[0];
  const rtItem = (instance.flatItemList || instance.parseList.flat())[0];

  assert.ok(ruby.paddingLeft > 0);
  assert.ok(ruby.paddingRight > 0);
  assert.equal(instance.needCompressTwice, true);
  assert.ok(rtItem.rt.rtLeaf.scaleX <= 0.6);
});

test('CompressText stretches rt letter spacing when ruby is much wider than rt', () => {
  const instance = new NewCompressText({
    ...baseConfig,
    text: '[永続(えい)]カード',
    width: 220,
  });
  const rtItem = (instance.flatItemList || instance.parseList.flat())[0];

  assert.ok(rtItem.rt.rtLeaf.letterSpacing > 0);
});

test('CompressText respects explicit rtFontScaleX without extra compression logic', () => {
  const instance = new NewCompressText({
    ...baseConfig,
    text: '[魔法(まほう)]',
    width: 160,
    rtFontScaleX: 0.75,
  });
  const rtItem = (instance.flatItemList || instance.parseList.flat())[0];

  assert.equal(rtItem.rt.rtLeaf.scaleX, 0.75);
});

test('CompressText force-wraps oversized unbreakable text without exceeding width', () => {
  const text = '汉字汉字汉字汉字汉字汉字汉字汉字汉字longlonglonglonglonglonglonglonglonglonglong汉字汉字汉字汉字汉字汉字汉字汉字汉字汉字';
  const instance = new NewCompressText({
    ...baseConfig,
    text,
    width: 320,
  });
  const rubyText = instance.rubyList.map(ruby => ruby.text).join('');
  const maxLineWidth = Math.max(...Array.from(instance.rubyLineMap.values()).map(lineList => {
    const lastRuby = lineList[lineList.length - 1];
    const lastPaddingRight = lastRuby.paddingRight || 0;
    return lastRuby.rubyLeaf.x + lastRuby.width + lastPaddingRight;
  }));

  assert.equal(rubyText, text);
  assert.ok(instance.currentLine > 0);
  assert.ok(maxLineWidth <= instance.width);
  assert.ok(instance.rubyList.some(ruby => ruby.text.length > 1 && ruby.text.length < 'longlonglonglonglonglonglonglonglonglonglong'.length));
});
