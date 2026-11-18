import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import skia from 'skia-canvas';
import { useCanvas } from 'leafer-unified';
import { CompressText } from '../compress-text.js';
import { getNodeFontResource } from '../../utils/font-loader.js';

useCanvas('skia', skia);
getNodeFontResource(path.resolve('src/assets/yugioh-card/yugioh/font'), skia);
class MeasuredText extends CompressText {
  relayoutBody() {
    this.layoutCalls = (this.layoutCalls || 0) + 1;
    return super.relayoutBody();
  }
}
const makeText = (t, data) => {
  const text = new MeasuredText({ fontFamily: 'ygo-en', fontSize: 20, lineHeight: 1.05, width: 100, textAlign: 'left', ...data });
  t.after(() => text.destroy());
  return text;
};
const closeTo = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

for (const [content, lines] of [['ABC\nDEF', 2], ['ABC\nDEF\nGHI', 3], ['ABC\n\nDEF', 3], ['\nABC', 2], ['', 0], ['ABC\n\n', 1]]) {
  test(`line-box bounds preserve hard breaks and empty rows: ${JSON.stringify(content)}`, t => {
    const text = makeText(t, { text: content, height: lines * 21 });
    closeTo(text.bounds.height, lines * 21);
    assert.equal(text.lastSegmentScaleX, 1);
    assert.equal(Boolean(text.doesOverflowHeight(text.rubyList.at(-1))), false);
    for (const ruby of text.rubyList.filter(ruby => ruby.text !== '\n' && ruby.line >= 0)) closeTo(ruby.rubyLeaf.y, ruby.line * 21);
  });
}

test('hard breaks do not contribute width or displace centered and right-aligned rows', t => {
  for (const textAlign of ['left', 'center', 'right']) {
    const text = makeText(t, { text: 'ABC\n\nDEF', width: 200, textAlign });
    for (const ruby of text.rubyList.filter(ruby => ruby.text !== '\n')) {
      const expected = textAlign === 'center' ? (200 - ruby.width) / 2 : textAlign === 'right' ? 200 - ruby.width : 0;
      closeTo(ruby.rubyLeaf.x, expected);
    }
    assert.ok(text.bounds.width > 0 && text.bounds.width <= 200);
    closeTo(text.bounds.height, 63);
  }
});

test('fractional line height that fits exactly does not trigger horizontal compression', t => {
  const text = makeText(t, { text: 'ABC DEF GHI JKL MNO PQR', fontSize: 18, lineHeight: 1.2, height: 64.8 });
  assert.equal(text.currentLine, 2);
  assert.equal(text.lastSegmentScaleX, 1);
  closeTo(text.bounds.height, 64.8);
});

test('floating-point tails do not trigger the one-line height limit, real shortages still do', t => {
  const options = { text: '[Beast-Warrior / Pendulum / Tuner / Effect]', fontFamily: 'ygo-en-race', fontSize: 56, lineHeight: 1.02, letterSpacing: 1, width: 1175 };
  const normal = makeText(t, { ...options, height: 100 });
  const exact = makeText(t, { ...options, height: 57.12 });
  closeTo(exact.lastSegmentScaleX, normal.lastSegmentScaleX);
  assert.equal(exact.currentLine, 0);
  assert.equal(exact.reachedSingleLineHeightLimit(exact.rubyList.at(-1)), false);
  assert.equal(Boolean(exact.doesOverflowHeight(exact.rubyList.at(-1))), false);
  exact.height = 57.1199;
  assert.equal(exact.reachedSingleLineHeightLimit(exact.rubyList.at(-1)), true);
  assert.equal(Boolean(exact.doesOverflowHeight(exact.rubyList.at(-1))), true);
});

for (const content of ['ABC', 'ABC\nDEF']) {
  test(`small-font fallback can resolve an initially impossible height: ${JSON.stringify(content)}`, t => {
    const text = makeText(t, { text: content, height: content.includes('\n') ? 30 : 15, autoSmallSize: true, smallFontSize: 10 });
    assert.equal(text.isSmallSize, true);
    assert.equal(text.lastSegmentScaleX, 1);
    closeTo(text.bounds.height, content.includes('\n') ? 21 : 10.5);
    assert.ok(text.layoutCalls <= 70);
    assert.equal(Boolean(text.doesOverflowHeight(text.rubyList.at(-1))), false);
  });
}

test('an impossible height refits the first paragraph at the fallback font size', t => {
  const options = { text: 'ABC DEF GHI JKL MNO PQR STU VWX', compressFirstSegment: true, autoSmallSize: true, smallFontSize: 10 };
  const normal = makeText(t, options);
  const small = makeText(t, { ...options, height: 15 });
  assert.equal(small.isSmallSize, true);
  assert.equal(small.currentLine, 0);
  assert.equal(small.lastSegmentScaleX, 1);
  assert.ok(small.firstSegmentScaleX > normal.firstSegmentScaleX);
  assert.ok(small.bounds.width <= small.width);
  closeTo(small.bounds.height, 10.5);
});

test('manual enlargement keeps the existing restriction on automatic small-font fallback', t => {
  const text = makeText(t, { text: 'ABC\nDEF', height: 30, fontSizeScale: 1.25, autoSmallSize: true, smallFontSize: 10 });
  assert.equal(text.isSmallSize, false);
  assert.equal(text.lastSegmentScaleX, 1);
  closeTo(text.bounds.height, 52.5);
  assert.ok(text.layoutCalls <= 35);
});

for (const options of [{ autoSmallSize: false }, { autoSmallSize: true, smallFontSize: 10 }, { autoSmallSize: true, smallFontSize: 0 }, { autoSmallSize: true, smallFontSize: 30 }]) {
  test(`unresolvable hard lines remain visible and terminate: ${JSON.stringify(options)}`, t => {
    const text = makeText(t, { text: 'ABC\nDEF', height: 8, ...options });
    assert.ok(text.layoutCalls <= 70);
    assert.equal(text.lastSegmentScaleX, 1);
    assert.equal(text.isSmallSize, options.autoSmallSize && options.smallFontSize === 10);
    assert.equal(Boolean(text.doesOverflowHeight(text.rubyList.at(-1))), true);
    assert.ok(text.rubyList.filter(ruby => ruby.text !== '\n').every(ruby => ruby.rubyLeaf.visible && ruby.rubyLeaf.scaleX > 0));
    assert.ok(text.bounds.height > text.height);
  });
}

test('fixed wrapped prefixes are included when detecting an impossible height', t => {
  const prefix = Array(18).fill('ABC').join(' ');
  const text = makeText(t, { text: `${prefix}\nDEF`, width: 80, height: 42 });
  assert.ok(text.layoutCalls <= 35);
  assert.equal(text.lastSegmentScaleX, 1);
  assert.ok(text.currentLine > 1);
  assert.ok(text.bounds.height > 42);
});

test('protected symbols that cannot shrink still have a strict search budget', t => {
  const text = makeText(t, { text: '①'.repeat(40), width: 60, height: 42 });
  assert.ok(text.layoutCalls <= 35);
  assert.equal(text.lastSegmentScaleX, 1);
  assert.ok(text.bounds.height > text.height);
  assert.ok(text.rubyList.every(ruby => ruby.rubyLeaf.scaleX === 1));
});

test('line height uses fontSizeScale locally and applies group scaling once', t => {
  for (const fontSizeScale of [0.75, 1, 1.25]) {
    const height = 3 * 20 * 1.05 * fontSizeScale;
    const text = makeText(t, { text: 'ABC\n\nDEF', fontSizeScale, height, scaleX: 0.5, scaleY: 2 });
    closeTo(text.bounds.height, height * 2);
    assert.equal(text.lastSegmentScaleX, 1);
    assert.equal(Boolean(text.doesOverflowHeight(text.rubyList.at(-1))), false);
    text.createBounds();
    closeTo(text.bounds.height, height * 2);
  }
});

test('switching between normal, fallback and unresolvable states matches a fresh layout', t => {
  const initial = { text: 'ABC\nDEF', autoSmallSize: true, smallFontSize: 10 };
  const reused = makeText(t, { ...initial, height: 42 });
  const snapshot = text => ({ small: text.isSmallSize, scale: text.lastSegmentScaleX, bounds: { ...text.bounds }, rows: text.rubyList.filter(ruby => ruby.text !== '\n').map(ruby => [ruby.rubyLeaf.x, ruby.rubyLeaf.y, ruby.width, ruby.height, ruby.rubyLeaf.fontSize]) });
  for (const height of [30, 8, 42, 30, 42]) {
    reused.set({ height });
    const fresh = makeText(t, { ...initial, height });
    assert.deepEqual(snapshot(reused), snapshot(fresh));
  }
});

test('ruby expansion, first-line compression and protected symbols retain a bounded fallback', t => {
  const text = makeText(t, { text: '[魔(まほうほうほう)]\n①[永続(えい)]カード'.repeat(3), width: 120, height: 50, compressFirstSegment: true, autoSmallSize: true, smallFontSize: 10 });
  assert.ok(text.layoutCalls < 150);
  assert.ok(text.lastSegmentScaleX > 0 && Number.isFinite(text.lastSegmentScaleX));
  assert.ok(text.firstSegmentScaleX > 0);
  assert.ok(text.rubyList.filter(ruby => ruby.text === '①').every(ruby => ruby.rubyLeaf.scaleX === 1));
  assert.ok(text.flatItemList.filter(item => item.rt.text).every(item => Number.isFinite(item.rt.rtLeaf.x) && Number.isFinite(item.rt.rtLeaf.y)));
});
