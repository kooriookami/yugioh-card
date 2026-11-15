import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { useCanvas } from 'leafer-unified';
import skia from 'skia-canvas';
import { loadFontNode } from '../../utils/index.js';
import { CompressText } from '../compress-text.js';

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

test('CompressText parses ruby, bold and explicit newline into caches', () => {
  const text = '<b>[自(じ)]分</b>\n①[魔(ま)]';
  const instance = new CompressText({ text, width: 240, ...baseConfig });

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
  const instance = new CompressText({ text, width: 240, ...baseConfig });
  const flatItemList = instance.flatItemList;
  const validRubyIndex = flatItemList.findIndex(item => item.rt.text === 'は');

  assert.notEqual(validRubyIndex, -1);
  assert.equal(flatItemList[validRubyIndex].ruby.text, '破');
  assert.equal(flatItemList[validRubyIndex].rt.text, 'は');
  assert.equal(flatItemList.slice(0, validRubyIndex).map(item => item.ruby.text).join(''), '[その]カードを');
});

test('CompressText applies group scaling once to multiline bounds', () => {
  const instance = new CompressText({ text: 'one two three\nx\ny', fontFamily: 'ygo-en', fontSize: 20, width: 300, textAlign: 'left' });
  try {
    assert.equal(instance.currentLine, 2);
    const unscaledBounds = { ...instance.bounds };
    for (const [scaleX, scaleY] of [[2, 3], [0.5, 0.75], [1, 1]]) {
      instance.set({ scaleX, scaleY });
      const expectedBounds = {
        width: unscaledBounds.width * scaleX,
        height: unscaledBounds.height * scaleY,
      };
      assert.deepEqual(instance.bounds, expectedBounds);
      instance.createBounds();
      assert.deepEqual(instance.bounds, expectedBounds);
    }
  } finally {
    instance.destroy();
  }
});

test('CompressText preserves space nodes across trial layouts', () => {
  const instance = new CompressText({
    text: 'one two three four five six seven eight',
    fontFamily: 'ygo-en', fontSize: 20, lineHeight: 1.05, width: 120,
  });
  try {
    const leaves = instance.rubyList.map(ruby => ruby.rubyLeaf);
    const snapshot = () => instance.rubyList.map(ruby => ({
      text: ruby.text, line: ruby.line, x: ruby.rubyLeaf.x, y: ruby.rubyLeaf.y, visible: ruby.rubyLeaf.visible,
    }));
    const before = snapshot();
    const hiddenSpaces = instance.rubyList.filter(ruby => ruby.text === ' ' && ruby.line < 0);
    assert.ok(hiddenSpaces.length > 0);
    let restoredSpace = false;
    for (const scale of [0.65, 1, 0.8, 1]) {
      instance.textScale = scale;
      instance.updateTextScale();
      instance.alignRuby();
      instance.rubyList.forEach((ruby, index) => {
        assert.equal(ruby.rubyLeaf, leaves[index]);
        assert.ok(!ruby.rubyLeaf.destroyed);
        assert.equal(ruby.rubyLeaf.visible, ruby.line >= 0);
      });
      restoredSpace ||= hiddenSpaces.some(ruby => ruby.line >= 0);
    }
    assert.ok(restoredSpace);
    assert.deepEqual(snapshot(), before);
  } finally {
    instance.destroy();
  }
});

test('CompressText helper getters reflect current size and padding', () => {
  const instance = new CompressText({ text: '[魔(ま)]法', width: 200, ...baseConfig });
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

  const instance = new CompressText(initConfig);

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

test('CompressText getFirstLineScale matches manual width calculation', () => {
  const instance = new CompressText({
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
  const instance = new CompressText({
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

test('CompressText keeps unresolvable one-line height readable and stops searching', () => {
  const instance = new CompressText({
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
  assert.equal(instance.textScale, 1);
  assert.ok(instance.rubyList.every(ruby => ruby.rubyLeaf.scaleX > 0));
  assert.equal(instance.doesOverflowHeight(lastRuby), true);
  assert.ok(updateTextScaleCount < 40);
});

test('CompressText gradient styling is applied to ruby leaves', () => {
  const instance = new CompressText({
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
  const instance = new CompressText({
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
  const instance = new CompressText({
    ...baseConfig,
    text: '[永続(えい)]カード',
    width: 220,
  });
  const rtItem = (instance.flatItemList || instance.parseList.flat())[0];

  assert.ok(rtItem.rt.rtLeaf.letterSpacing > 0);
});

test('CompressText respects explicit rtFontScaleX without extra compression logic', () => {
  const instance = new CompressText({
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
  const instance = new CompressText({
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
