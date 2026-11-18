import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { useCanvas } from 'leafer-unified';
import skia from 'skia-canvas';
import { getNodeFontResource } from '../../utils/font-loader.js';
import { CompressText } from '../compress-text.js';

useCanvas('skia', skia);
getNodeFontResource(path.resolve('src/assets/yugioh-card/yugioh/font'), skia);
const make = (t, data) => {
  const text = new CompressText({ fontFamily: 'ygo-jp', fontSize: 20, rtFontSize: 6, width: 80, textAlign: 'left', ...data });
  t.after(() => text.destroy());
  return text;
};
const lines = text => [...text.rubyLineMap.values()].map(row => row.filter(ruby => ruby.rubyLeaf.visible).map(ruby => ruby.text).join(''));

test('adding a short annotation does not introduce Latin/CJK word binding', t => {
  assert.deepEqual(lines(make(t, { text: '前前A[日(x)]B' })), ['前前A日', 'B']);
  assert.deepEqual(lines(make(t, { text: '前前A日B' })), ['前前A日', 'B']);
});

test('a no-break-space phrase that fits an empty line moves together', t => {
  const text = make(t, { text: 'X 100\u00A0ATK', width: 75, fontFamily: 'ygo-en' });
  assert.deepEqual(lines(text), ['X', '100\u00A0ATK']);
});

test('punctuation stays with preceding content even after a space or overflow fallback', t => {
  assert.deepEqual(lines(make(t, { text: '前甲 ，乙', width: 48 })), ['前', '甲 ，', '乙']);
  for (const source of ['甲。乙。', '[甲(こう)]。乙', '甲（乙丙）']) {
    const text = make(t, { text: source, width: 25 });
    for (const row of lines(text)) {
      assert.doesNotMatch(row, /^[。，、）]/u);
      assert.doesNotMatch(row, /[（「【]$/u);
    }
  }
});

test('oversized ruby, including an empty annotation, is never split', t => {
  const body = '这是一段很长的文本'.repeat(3);
  for (const annotation of ['ruby', '']) {
    const text = make(t, { text: `[${body}(${annotation})]。乙`, width: 60 });
    assert.equal(text.rubyList.filter(ruby => ruby.text === body).length, 1);
    assert.ok(text.bounds.width > text.width, 'unresolvable atomic content keeps its full width');
    assert.equal(text.rubyList.find(ruby => ruby.text === body).atomic, true);
    assert.ok(lines(text)[0].endsWith('。'));
  }
});

test('hard break variants give the same measured layout as LF', t => {
  const expected = make(t, { text: '甲\n\n乙', width: 200 });
  for (const separator of ['\r\n', '\r', '\u0085', '\u2028', '\u2029']) {
    const text = make(t, { text: `甲${separator}${separator}乙`, width: 200 });
    assert.deepEqual(lines(text), lines(expected));
    assert.deepEqual(text.bounds, expected.bounds);
    assert.equal(text.currentLine, 2);
  }
});

test('literal placeholders and zero width controls keep their content and intended widths', t => {
  const text = make(t, { text: '__RB0__ [日(にち)]', width: 400 });
  assert.equal(text.rubyList.map(ruby => ruby.text).join(''), '__RB0__ 日');
  const controlled = make(t, { text: '甲\u200B乙[日(x)]', width: 40 });
  const control = controlled.rubyList.find(ruby => ruby.text === '\u200B');
  assert.ok(control);
  assert.equal(control.width, 0);
  assert.equal(control.rubyLeaf.visible, false);
  assert.equal(controlled.rubyList.map(ruby => ruby.text).join(''), '甲\u200B乙日');
  const plain = make(t, { text: '甲\u200B乙', width: 40 });
  assert.equal(plain.bounds.width, 40);
  assert.deepEqual(lines(plain), ['甲乙']);
});

test('normal and small height trials remain consistent with refined breaking and restored input', t => {
  const data = { text: 'X 100\u00A0ATK [甲(こう)]。'.repeat(5), fontFamily: 'ygo-en', width: 100, height: 50, autoSmallSize: true, smallFontSize: 10 };
  const reused = make(t, data);
  for (const update of [{ width: 160 }, { text: '[長い正文()]。乙' }, { ...data }]) {
    reused.set(update);
    Object.assign(data, update);
    const fresh = make(t, data);
    assert.deepEqual(lines(reused), lines(fresh));
    assert.deepEqual(reused.bounds, fresh.bounds);
    assert.equal(reused.lastSegmentScaleX, fresh.lastSegmentScaleX);
    assert.equal(reused.isSmallSize, fresh.isSmallSize);
  }
});
