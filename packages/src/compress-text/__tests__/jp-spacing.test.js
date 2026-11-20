import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { Leafer, useCanvas } from 'leafer-unified';
import skia from 'skia-canvas';
import { YugiohCard, YugiohSeries2Card } from '../../../index.ts';
import { getNodeFontResource } from '../../utils/font-loader.ts';
import { getFontInfo } from '../../utils/font-info.ts';
import { CompressText } from '../compress-text.ts';
import { getGlyphMetrics, isSpacingCharacter } from '../glyph-metrics.ts';
import { withTextLayoutContext } from '../layout-context.ts';

useCanvas('skia', skia);
const resourcePath = path.resolve('src/assets/yugioh-card');
const fonts = getNodeFontResource(`${resourcePath}/yugioh/font`, skia);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
const make = (t, data = {}) => {
  const text = new CompressText({ text: '日', fontFamily: 'ygo-jp', fontSize: 38, width: 1000, textAlign: 'left', sideBearingRatio: 0.5, ...data });
  t.after(() => text.destroy());
  return text;
};
const children = ruby => ruby.bodyRun ? ruby.rubyNode.children : [ruby.rubyNode];

test('loaded font metadata and donor digit widths come from the actual file', t => {
  const entry = fonts.fonts.get('ygo-jp');
  const font = getFontInfo(entry);
  assert.equal(getFontInfo(entry), font, 'one parse per loaded font entry');
  assert.equal(font.unitsPerEm, 1024);
  assert.equal(font.hasGlyphForCodePoint('日'.codePointAt(0)), true);
  assert.equal(font.hasGlyphForCodePoint('𠮷'.codePointAt(0)), false);
  close(make(t, { text: '０', sideBearingRatio: 1 }).bounds.width, 702 * 38 / 1024);
  close(make(t, { text: '日', sideBearingRatio: 1 }).bounds.width, 38);
  close(make(t, { text: 'あ', sideBearingRatio: 1 }).bounds.width, 38);
});

test('Han, kana and explicit marks trim margins without scaling the glyph', t => {
  close(make(t).bounds.width, 774 * 38 / 1024);
  close(make(t, { text: 'あ' }).bounds.width, 861 * 38 / 1024);
  for (const char of '々〆゛゜ゝゞー') {
    const text = make(t, { text: char });
    const original = make(t, { text: char, sideBearingRatio: 1 });
    assert.equal(isSpacingCharacter(char), true, char);
    assert.ok(text.bounds.width > 0 && text.bounds.width <= original.bounds.width, char);
    assert.ok(text.rubyList[0].bodyRun, char);
    assert.ok(children(text.rubyList[0]).every(node => node.scaleX === 1), char);
  }
  for (const content of ['コーヒー', 'スーパー', 'ーー']) {
    const text = make(t, { text: content });
    assert.ok(text.bounds.width < make(t, { text: content, sideBearingRatio: 1 }).bounds.width);
  }
});

test('every eligible glyph in this font has finite nonexpanding advances at all ratios', () => {
  const font = getFontInfo(fonts.fonts.get('ygo-jp'));
  const half = getGlyphMetrics('ygo-jp', 0.5);
  const zero = getGlyphMetrics('ygo-jp', 0);
  let count = 0;
  for (const code of font.characterSet) {
    const char = String.fromCodePoint(code);
    if (!isSpacingCharacter(char)) continue;
    count++;
    const a = half(char), b = zero(char);
    assert.ok(a && b && b.width > 0 && a.width >= b.width && Number.isFinite(a.offset), char);
  }
  assert.ok(count >= 6901, `covered ${count} eligible glyphs`);
});

test('digits, letters, punctuation, whitespace and uncovered characters keep native metrics', t => {
  for (const char of ['０', '0', 'Ａ', 'A', 'Ω', 'Ж', '。', '、', '【', '】', '・', ' ', '　', '𠮷']) {
    assert.equal(getGlyphMetrics('ygo-jp', 0.5)(char), null, char);
    const text = make(t, { text: `${char}X` });
    close(text.bounds.width, make(t, { text: `${char}X`, sideBearingRatio: 1 }).bounds.width);
    assert.ok(text.rubyList.every(ruby => !ruby.bodyRun), char);
  }
});

test('ratio 1 and invalid inputs use the native path; ratio changes replace old nodes', t => {
  const text = make(t);
  for (const ratio of [1, undefined, null, NaN, Infinity, '0.5', 2]) {
    text.set({ sideBearingRatio: ratio });
    close(text.bounds.width, 38);
    assert.equal(text.rubyList[0].rubyNode.tag, 'Text');
  }
  text.set({ sideBearingRatio: 0.5 });
  const previous = text.rubyList[0].rubyNode;
  close(text.bounds.width, 774 * 38 / 1024);
  text.set({ sideBearingRatio: 0 });
  assert.equal(previous.destroyed, true);
  close(text.bounds.width, 523 * 38 / 1024);
  assert.equal(Object.hasOwn(text, 'sideBearingRatio'), false, 'internal parameter is not an instance API');
  text.set({ fontFamily: 'ygo-en' });
  assert.ok(text.rubyList.every(ruby => !ruby.bodyRun));
});

test('fallback, unavailable metadata and invalid metrics do not trim margins', t => {
  const fallback = withTextLayoutContext({ fontVersion: 0, loadedFonts: new Map() }, () => make(t));
  assert.ok(fallback.rubyList.every(ruby => !ruby.bodyRun));
  withTextLayoutContext({ fontVersion: 1, loadedFonts: fonts.fonts }, () => fallback.set({}));
  assert.ok(fallback.rubyList[0].bodyRun);
  assert.equal(getGlyphMetrics('ygo-jp', 0.5, new Map([['ygo-jp', { status: 'loaded' }]]), 0), null);
  assert.equal(getFontInfo({ fontData: new Uint8Array([0, 1, 2]) }), null);
  const entry = { status: 'loaded', fontData: fonts.fonts.get('ygo-jp').fontData };
  t.mock.method(getFontInfo(entry), 'glyphForCodePoint', () => ({ advanceWidth: NaN, bbox: {} }));
  assert.equal(getGlyphMetrics('ygo-jp', 0.5, new Map([['ygo-jp', entry]]))('日'), null);
});

test('glyph measurement is shared across text instances and remains demand-driven', t => {
  const entry = { status: 'loaded', fontData: fonts.fonts.get('ygo-jp').fontData };
  const loadedFonts = new Map([['ygo-jp', entry]]);
  const font = getFontInfo(entry);
  const measure = font.glyphForCodePoint.bind(font);
  const measurements = [];
  t.mock.method(font, 'glyphForCodePoint', code => { measurements.push(String.fromCodePoint(code)); return measure(code); });
  const first = getGlyphMetrics('ygo-jp', 0.5, loadedFonts);
  assert.deepEqual(measurements, [], 'reading metadata does not measure any character');
  first('日'); first('日');
  const second = getGlyphMetrics('ygo-jp', 0.25, loadedFonts);
  second('日');
  assert.deepEqual(measurements, ['日'], 'changing ratio reuses the original metrics');
  for (const fontVersion of [0, 1, 7]) {
    withTextLayoutContext({ fontVersion, loadedFonts }, () => make(t, { text: '[日(X)]', fontSize: 20 + fontVersion }));
  }
  assert.equal(measurements.filter(char => char === '日').length, 1, 'another instance, size or card version does not remeasure the glyph');
  assert.equal(measurements.includes('あ'), false, 'unused characters are not premeasured');
  second('あ');
  assert.equal(measurements.filter(char => char === 'あ').length, 1);
});

test('spacing supports another family and another font unit grid without a generated profile', t => {
  const alias = 'runtime-spacing-font';
  const file = `${resourcePath}/yugioh/font/ygo-jp.woff2`;
  skia.FontLibrary.use(alias, [file]);
  const entry = { status: 'loaded', fontData: new Uint8Array(fs.readFileSync(file)) };
  const context = { fontVersion: 0, loadedFonts: new Map([[alias, entry]]) };
  const text = withTextLayoutContext(context, () => make(t, { fontFamily: alias }));
  close(text.bounds.width, 774 * 38 / 1024);
  const sc = make(t, { fontFamily: 'ygo-sc' });
  const scOriginal = make(t, { fontFamily: 'ygo-sc', sideBearingRatio: 1 });
  assert.equal(getFontInfo(fonts.fonts.get('ygo-sc')).unitsPerEm, 1000);
  assert.ok(sc.rubyList[0].bodyRun && sc.bounds.width < scOriginal.bounds.width);
});

test('mixed native runs retain shaping, letter spacing and full-width spaces', t => {
  const text = make(t, { text: '[日AV。　あ(X)]', letterSpacing: 2 });
  const ruby = text.rubyList[0];
  const nodes = children(ruby);
  assert.deepEqual(nodes.map(node => node.text), ['日', 'AV。　', 'あ']);
  close(ruby.width, (774 + 861) * 38 / 1024 + 4 + nodes[1].getBounds('content', 'inner').width);
  assert.equal(nodes[0].letterSpacing, 0);
  assert.equal(nodes[1].letterSpacing, 2);
  const spaces = make(t, { text: '日  日', letterSpacing: 2, wordSpacing: 3 });
  close(spaces.bounds.width, make(t, { letterSpacing: 2 }).bounds.width * 2 + make(t, { text: '  X', letterSpacing: 2, wordSpacing: 3 }).rubyList.slice(0, 2).reduce((sum, ruby) => sum + ruby.width, 0));
});

test('grapheme clusters and IVS survive normal parsing and overflow fallback', t => {
  const content = '葛\u{E0100}か\u3099A\u0301';
  const text = make(t, { text: content, width: 1 });
  assert.equal(text.rubyList.map(ruby => ruby.text).join(''), content);
  assert.deepEqual(text.getTextCharList(content), ['葛\u{E0100}', 'か\u3099', 'A\u0301']);
  assert.ok(text.rubyList.every(ruby => !ruby.bodyRun));
});

test('wrapping uses the trimmed advance; ruby remains atomic and aligns to logical bounds', t => {
  const text = make(t, { text: '[日日(にちにち)]', width: 60 });
  assert.equal(text.rubyList.length, 1);
  const item = text.flatItemList[0];
  close(item.ruby.width, 774 * 38 / 1024 * 2);
  close(item.rt.rtNode.x, item.ruby.rubyNode.x + item.ruby.width / 2);
  const trimmed = make(t, { text: '日日', width: 60 });
  assert.equal(trimmed.currentLine, 0);
  assert.equal(make(t, { text: '日日', width: 60, sideBearingRatio: 1 }).currentLine, 1);
});

test('short and wide annotations keep native spacing across body side bearing ratios', t => {
  for (const input of ['[艮神鬼門(アシュトラーシェン)]', '[日(にちにち)]']) {
    const text = make(t, { text: input, sideBearingRatio: 1 });
    const { ruby: reference, rt: referenceRt } = text.flatItemList[0];

    for (const ratio of [1, 0.5, 0]) {
      text.set({ sideBearingRatio: ratio });
      const { ruby, rt } = text.flatItemList[0];
      if (ratio < 1) assert.ok(ruby.width < reference.width);
      assert.equal(rt.rtNode.letterSpacing, 0);
      assert.equal(rt.rtNode.scaleX, 1);
      close(rt.rtNode.getBounds('content', 'inner').width, referenceRt.width);
      close(rt.rtNode.x, ruby.rubyNode.x + ruby.width / 2);
    }
  }
});

test('body compression reserves the natural width of adjacent annotations', t => {
  const input = '[日(にちにち)][日(にちにち)][日日(にちにち)]';
  for (const limits of [{ compressSegments: [1] }, { height: 45 }]) {
    const text = make(t, { text: input, width: 157, ...limits });
    let right = 0;
    for (const { ruby, rt } of text.flatItemList) {
      assert.equal(ruby.line, 0);
      assert.ok(ruby.rubyNode.scaleX < 1);
      assert.equal(rt.rtNode.scaleX, 1);
      const bounds = rt.rtNode.getBounds('content', 'local');
      assert.ok(bounds.x >= right - 1e-7);
      right = bounds.x + bounds.width;
    }
    assert.ok(right <= text.width);
  }
});

test('small font fallback and external scale update both logical and drawn positions', t => {
  const data = { text: '[日あー(X)]\n[日あー(X)]', width: 300, height: 30, autoSmallSize: true, smallFontSize: 10, lineHeight: 1.1, letterSpacing: 2 };
  const text = make(t, data);
  assert.equal(text.isSmallSize, true);
  for (const ruby of text.rubyList.filter(ruby => ruby.bodyRun)) {
    close(ruby.width, ruby.bodyRun.width * ruby.rubyNode.scaleX);
    assert.ok(children(ruby).every(node => node.fontSize === 10));
  }
  const scaled = make(t, { ...data, scaleX: 1.5, scaleY: 2 });
  close(scaled.bounds.width, text.bounds.width * 1.5);
  close(scaled.bounds.height, text.bounds.height * 2);
  text.set({ height: 200, gradient: true, color: '#f00', strokeWidth: 1 });
  const nodes = children(text.rubyList[0]);
  assert.ok(nodes.every(node => node.fontSize === 38 && node.fill.type === 'linear' && node.stroke));
  close(nodes[0].x + nodes[0].fill.from.x, nodes[1].x + nodes[1].fill.from.x);
});

test('trimmed and native single-glyph renders have identical ink pixels', async () => {
  const crop = async ratio => {
    const view = new Leafer({ width: 130, height: 110 });
    try {
      view.add(new CompressText({ text: '日', fontFamily: 'ygo-jp', fontSize: 64, sideBearingRatio: ratio, x: 20, y: 10, textAlign: 'left' }));
      const image = await skia.loadImage((await view.export('png', { screenshot: true })).data);
      const canvas = new skia.Canvas(image.width, image.height);
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, image.width, image.height).data;
      let left = image.width, right = 0, top = image.height, bottom = 0;
      for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
        if (pixels[(y * image.width + x) * 4 + 3]) {
          left = Math.min(left, x); right = Math.max(right, x);
          top = Math.min(top, y); bottom = Math.max(bottom, y);
        }
      }
      return { width: right - left + 1, height: bottom - top + 1, pixels: context.getImageData(left, top, right - left + 1, bottom - top + 1).data };
    } finally { view.destroy(true); }
  };
  assert.deepEqual(await crop(0.5), await crop(1));
});

test('both Japanese card styles propagate the internal ratio and still become ready/export', async t => {
  for (const Card of [YugiohCard, YugiohSeries2Card]) {
    const card = new Card({ resourcePath, skia, data: { language: 'jp', renderScale: 0.15, name: '[日あー(にち)]', monsterTypeLine: 'ドラゴン族／通常', cardText: '[日あー(にち)] ０１２３４５６７８９', cardLayout: 'spell', artwork: path.resolve('src/assets/image/blue-eyes.jpg') } });
    t.after(() => card.leafer.destroy(true));
    await card.ready;
    assert.ok(card.nameNode.rubyList.some(ruby => ruby.bodyRun));
    assert.ok(card.cardTextNode.rubyList.some(ruby => ruby.bodyRun));
    assert.ok(card.spellTrapLabelNode.children[2].rubyList.some(ruby => ruby.bodyRun));
    assert.match((await card.leafer.export('png', { screenshot: true })).data, /^data:image\/png;base64,/);
    if (Card === YugiohCard) {
      card.setData({ language: 'en', name: 'Normal English', cardText: 'Normal English' });
      await card.ready;
      assert.ok(card.nameNode.rubyList.every(ruby => !ruby.bodyRun));
      card.setData({ language: 'jp', cardLayout: 'pendulum', pendulumEffect: '日あー' });
      await card.ready;
      assert.ok(card.pendulumEffectNode.rubyList.some(ruby => ruby.bodyRun));
    } else {
      card.setData({ cardLayout: 'monster', atk: 3000, def: 2500 });
      await card.ready;
      assert.ok(card.battleStatsNode.children.every(text => text.rubyList.some(ruby => ruby.bodyRun)));
      assert.ok(card.battleStatsNode.children.every(text => text.rubyList.filter(ruby => /^\d+$/.test(ruby.text)).every(ruby => !ruby.bodyRun)));
    }
  }
});

test('Series 2 custom fonts preserve Japanese spacing for fixed-font attack and defense labels', async t => {
  const card = new YugiohSeries2Card({ resourcePath, skia, data: { language: 'jp', cardLayout: 'monster', renderScale: 0.1, name: '日あー', cardText: '日あー', atk: 3000, def: 2500 } });
  t.after(() => card.leafer.destroy(true));
  await card.ready;
  const labels = () => card.battleStatsNode.children.map(text => text.rubyList.find(ruby => ruby.text === '攻' || ruby.text === '守'));
  const normalWidths = labels().map(ruby => ruby.normalWidth);
  for (const font of ['custom1', 'custom2', '']) {
    card.setData({ fontPreset: font });
    await card.ready;
    labels().forEach((ruby, index) => {
      assert.ok(ruby.bodyRun, `fixed Japanese label remains trimmed with ${font || 'default'}`);
      close(ruby.normalWidth, normalWidths[index]);
    });
    assert.equal(card.nameNode.fontFamily, font || 'ygo-jp');
    assert.equal(card.nameNode.rubyList.some(ruby => ruby.bodyRun), !font);
    for (const text of card.battleStatsNode.children) {
      assert.equal(text.fontFamily, 'ygo-jp');
      assert.ok(text.rubyList.filter(ruby => /^\d+$/.test(ruby.text)).every(ruby => !ruby.bodyRun));
    }
  }
});
