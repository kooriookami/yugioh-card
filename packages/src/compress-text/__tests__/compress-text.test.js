import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { useCanvas } from 'leafer-unified';
import skia from 'skia-canvas';
import { loadFontNode } from '../../utils/index.ts';
import { CompressText } from '../compress-text.ts';

useCanvas('skia', skia);
loadFontNode(path.resolve('./src/assets/yugioh-card/yugioh/font'), skia);

const baseConfig = {
  lineHeight: 1.5,
  fontSize: 32,
  rtFontSize: 16,
  rtOffsetY: -8,
  y: 14,
  textAlign: 'justify',
  compressSegments: [],
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
  assert.equal(instance.hardBreakSegments.length, 2);
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
    const nodes = instance.rubyList.map(ruby => ruby.rubyNode);
    const snapshot = () => instance.rubyList.map(ruby => ({
      text: ruby.text, line: ruby.line, x: ruby.rubyNode.x, y: ruby.rubyNode.y, visible: ruby.rubyNode.visible,
    }));
    const before = snapshot();
    const hiddenSpaces = instance.rubyList.filter(ruby => ruby.text === ' ' && ruby.line < 0);
    assert.ok(hiddenSpaces.length > 0);
    let restoredSpace = false;
    for (const scale of [0.65, 1, 0.8, 1]) {
      instance.lastSegmentScaleX = scale;
      instance.relayoutBody();
      instance.alignRuby();
      instance.rubyList.forEach((ruby, index) => {
        assert.equal(ruby.rubyNode, nodes[index]);
        assert.ok(!ruby.rubyNode.destroyed);
        assert.equal(ruby.rubyNode.visible, ruby.line >= 0);
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

test('CompressText calculateSegmentScaleX matches manual width calculation', () => {
  const instance = new CompressText({
    ...baseConfig,
    text: '[自(じ)][分(ぶん)]フィールド',
    width: 120,
    compressSegments: [1],
  });
  const firstLineRubyList = instance.hardBreakSegments[0].flat().map(item => item.ruby);
  const totalWidth = firstLineRubyList.reduce((sum, ruby) => sum + ruby.originalWidth, 0);
  const paddingWidth = firstLineRubyList.reduce((sum, ruby) => sum + instance.getPaddingWidth(ruby), 0);
  const expected = Math.min(Math.floor((instance.width - paddingWidth) / totalWidth * 1000) / 1000, 1);

  assert.equal(instance.calculateSegmentScaleX(instance.hardBreakSegments[0]), expected);
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
  const originalUpdateTextScale = instance.relayoutBody;
  let updateTextScaleCount = 0;

  instance.relayoutBody = (...args) => {
    updateTextScaleCount++;
    return originalUpdateTextScale.apply(instance, args);
  };

  instance.set({ height: 12 });

  const lastRuby = instance.rubyList[instance.rubyList.length - 1];
  assert.equal(instance.lastSegmentScaleX, 1);
  assert.ok(instance.rubyList.every(ruby => ruby.rubyNode.scaleX > 0));
  assert.equal(instance.doesOverflowHeight(lastRuby), true);
  assert.ok(updateTextScaleCount < 40);
});

test('CompressText gradient styling is applied to ruby nodes', () => {
  const instance = new CompressText({
    ...baseConfig,
    text: '[魔(ま)][法(ほう)]カード',
    width: 220,
    gradient: true,
  });
  const rubyNode = instance.rubyList[0].rubyNode;

  assert.equal(rubyNode.stroke, 'rgba(0, 0, 0, 0.6)');
  assert.equal(rubyNode.strokeAlign, 'outside');
  assert.equal(rubyNode.fill.type, 'linear');
  assert.equal(rubyNode.fill.stops.length, 5);
  assert.equal(rubyNode.shadow.color, 'rgba(0, 0, 0, 0.6)');
});

test('CompressText compresses wide annotations before reserving their remaining width', t => {
  const instance = new CompressText({
    ...baseConfig,
    text: '[魔(まほう)][法(ほうほうほう)]',
    textAlign: 'left',
  });
  t.after(() => instance.destroy());
  const [first, second] = instance.flatItemList;

  assert.ok(first.rt.rtNode.scaleX > 0.6 && first.rt.rtNode.scaleX < 1);
  assert.equal(first.rt.rtNode.scaleX, first.ruby.width / first.rt.width);
  assert.equal(instance.getPaddingWidth(first.ruby), 0);

  assert.ok(Math.abs(second.rt.rtNode.scaleX - 0.6) < 1e-7);
  assert.ok(second.ruby.paddingLeft > 5);
  assert.equal(second.ruby.paddingRight, second.ruby.paddingLeft);
  const occupiedWidth = second.ruby.width + instance.getPaddingWidth(second.ruby);
  assert.ok(Math.abs(occupiedWidth - second.rt.width * second.rt.rtNode.scaleX) < 1e-7);
  assert.equal(instance.bounds.width, first.ruby.width + occupiedWidth);
});

test('CompressText preserves configured annotation letter spacing', t => {
  const instance = new CompressText({
    ...baseConfig,
    text: '[永続(えい)]カード',
    width: 220,
    rtLetterSpacing: 0.5,
  });
  t.after(() => instance.destroy());

  assert.equal(instance.flatItemList[0].rt.rtNode.letterSpacing, 0.5);
});

test('CompressText applies fixed annotation scale and can return to automatic fitting', t => {
  const instance = new CompressText({
    ...baseConfig,
    text: '[魔(まほうほうほう)]',
    width: 160,
    rtScaleXOverride: 0.75,
  });
  t.after(() => instance.destroy());
  const scaleX = () => instance.flatItemList[0].rt.rtNode.scaleX;

  assert.equal(scaleX(), 0.75);
  instance.set({ rtScaleXOverride: 1 });
  assert.equal(scaleX(), 1);
  assert.equal(instance.getPaddingWidth(instance.rubyList[0]), 0);

  instance.set({ rtScaleXOverride: null });
  assert.ok(Math.abs(scaleX() - 0.6) < 1e-7);
  assert.ok(instance.rubyList[0].paddingLeft > 0);
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
    return lastRuby.rubyNode.x + lastRuby.width + lastPaddingRight;
  }));

  assert.equal(rubyText, text);
  assert.ok(instance.currentLine > 0);
  assert.ok(maxLineWidth <= instance.width);
  assert.ok(instance.rubyList.some(ruby => ruby.text.length > 1 && ruby.text.length < 'longlonglonglonglonglonglonglonglonglonglong'.length));
});
