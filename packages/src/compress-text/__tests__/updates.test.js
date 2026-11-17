import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { useCanvas } from 'leafer-unified';
import skia from 'skia-canvas';
import { textSnapshot, updateCases } from '../../../../tools/perf/layout-cases.js';
import { getNodeFontResource } from '../../utils/font-loader.js';
import { withTextLayoutContext } from '../layout-context.js';
import { CompressText } from '../compress-text.js';

useCanvas('skia', skia);
const fonts = getNodeFontResource(path.resolve('src/assets/yugioh-card/yugioh/font'), skia);

for (const extra of [{}, { gradient: true }, { strokeWidth: 1, rtStrokeWidth: 1 }, { sideBearingRatio: 1 }, { width: 150, height: 35, autoSmallSize: true, smallFontSize: 12 }]) {
  test(`incremental text updates match fresh layout and paint: ${JSON.stringify(extra)}`, () => {
    const data = { text: '[日あー(X)] AV。\n日  日', fontFamily: 'ygo-jp', fontSize: 38, width: 400, sideBearingRatio: 0.5, ...extra };
    const text = new CompressText(data);
    try {
      for (const update of updateCases) {
        Object.assign(data, update);
        text.set(update);
        const fresh = new CompressText(data);
        try { assert.deepEqual(textSnapshot(text), textSnapshot(fresh)); }
        finally { fresh.destroy(); }
      }
    } finally { text.destroy(); }
  });
}

test('container and plain color updates preserve measured leaves; complex paint still matches fresh output', () => {
  const data = { text: '[日(にち)] AV', fontFamily: 'ygo-jp', width: 400, sideBearingRatio: 0.5, strokeWidth: 1, rtStrokeWidth: 1 };
  const text = new CompressText(data);
  try {
    const leaves = text.rubyList.map(ruby => ruby.rubyLeaf);
    const bounds = { ...text.bounds };
    text.set({ color: 'red', rtColor: 'blue', x: 20, y: 30 });
    assert.deepEqual(text.rubyList.map(ruby => ruby.rubyLeaf), leaves);
    assert.deepEqual(text.bounds, bounds);
    assert.equal(text.flatItemList[0].rt.rtLeaf.stroke, 'red');
    const color = { type: 'linear', stops: [{ offset: 0, color: 'red' }, { offset: 1, color: 'blue' }] };
    text.set({ color });
    const fresh = new CompressText({ ...data, color, rtColor: 'blue', x: 20, y: 30 });
    try { assert.deepEqual(textSnapshot(text), textSnapshot(fresh)); }
    finally { fresh.destroy(); }
  } finally { text.destroy(); }
});

test('font context changes invalidate layout even when only container or color fields are supplied', () => {
  const data = { text: '[日(にち)]', fontFamily: 'ygo-jp', width: 200, sideBearingRatio: 0.5 };
  const context = { fontVersion: 0, loadedFonts: fonts.fonts };
  const text = withTextLayoutContext(context, () => new CompressText(data));
  try {
    const group = text.group;
    withTextLayoutContext({ ...context, fontVersion: 1 }, () => text.set({ x: 20, color: 'blue' }));
    assert.equal(group.destroyed, true);
    const fresh = withTextLayoutContext({ ...context, fontVersion: 1 }, () => new CompressText({ ...data, x: 20, color: 'blue' }));
    try { assert.deepEqual(textSnapshot(text), textSnapshot(fresh)); }
    finally { fresh.destroy(); }
  } finally { text.destroy(); }
});

test('reused parsing never retains mutable layout or caller changes', () => {
  const data = { text: '<b>[日(にち)]</b> AV  日', fontFamily: 'ygo-jp', fontSize: 38, width: 400, sideBearingRatio: 0.5 };
  const text = new CompressText(data);
  try {
    const parsed = text.getParseList();
    parsed[0][0].ruby.text = 'changed';
    parsed[0][0].ruby.paddingLeft = 100;
    parsed[0][0].rt.text = 'changed';
    const again = text.getParseList();
    assert.equal(again[0][0].ruby.text, '日');
    assert.equal(again[0][0].ruby.paddingLeft, undefined);
    assert.equal(again[0][0].rt.text, 'にち');
    for (const update of [{ width: 100, height: 30, autoSmallSize: true, smallFontSize: 12 }, { width: 400, height: 0 }, { text: '別の文字' }, { text: data.text }]) {
      Object.assign(data, update);
      text.set(update);
      const fresh = new CompressText(data);
      try { assert.deepEqual(textSnapshot(text), textSnapshot(fresh)); }
      finally { fresh.destroy(); }
    }
  } finally { text.destroy(); }
});

test('long native words preserve shaping, bold state and restored input across repeated fits', () => {
  const data = { text: 'W'.repeat(300), fontFamily: 'ygo-en', fontSize: 38, width: 300 };
  const text = new CompressText(data);
  try {
    for (const update of [{ width: 180 }, { text: `<b>${'AVffi'.repeat(80)}</b>` }, { width: 450, fontSize: 30 }, { text: data.text, fontSize: 38, width: 300 }]) {
      Object.assign(data, update);
      text.set(update);
      const fresh = new CompressText(data);
      try { assert.deepEqual(textSnapshot(text), textSnapshot(fresh)); }
      finally { fresh.destroy(); }
    }
  } finally { text.destroy(); }
});
