import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { useCanvas } from 'leafer-unified';
import skia from 'skia-canvas';
import { YugiohCard, YugiohSeries2Card, RushDuelCard } from '../../../index.ts';
import { getNodeFontResource } from '../../utils/font-loader.ts';
import { getFontInfo } from '../../utils/font-info.ts';
import { inheritProp } from '../../utils/index.ts';
import { CompressText } from '../compress-text.ts';
import { withTextLayoutContext } from '../layout-context.ts';
import { trialLayoutHeight } from '../layout/trial-layout.ts';

useCanvas('skia', skia);
const resourcePath = path.resolve('src/assets/yugioh-card');
const fonts = getNodeFontResource(path.join(resourcePath, 'yugioh/font'), skia).fonts;
const rushFonts = getNodeFontResource(path.join(resourcePath, 'rush-duel/font'), skia).fonts;
const trim = 'both';
const make = (t, data) => {
  const text = new CompressText({ fontFamily: 'ygo-jp', fontSize: 38, textAlign: 'left', punctuationTrim: trim, ...data });
  t.after(() => text.destroy());
  return text;
};
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
const bearing = (family, char, edge, fontSize, entries = fonts) => {
  const font = getFontInfo(entries.get(family));
  const glyph = font.glyphForCodePoint(char.codePointAt(0));
  const space = edge === 'start' ? glyph.bbox.minX : glyph.advanceWidth - glyph.bbox.maxX;
  return space * fontSize / font.unitsPerEm;
};
const lines = text => [...text.rubyLineMap.values()].map(line => line.filter(ruby => ruby.rubyNode.visible).map(ruby => ruby.text).join(''));

test('line-edge punctuation uses font bearings, including already-proportional glyphs', t => {
  const data = { text: '【甲】' };
  const natural = make(t, { ...data, punctuationTrim: undefined });
  const adjusted = make(t, data);
  const start = bearing('ygo-jp', '【', 'start', 38);
  const end = bearing('ygo-jp', '】', 'end', 38);
  close(adjusted.rubyList[0].rubyNode.x, -start);
  close(adjusted.bounds.width, natural.bounds.width - start - end);
  assert.equal(adjusted.rubyList[0].rubyNode.scaleX, 1);
  assert.equal(adjusted.rubyList[0].rubyNode.text, natural.rubyList[0].rubyNode.text);

  const sc = { text: '、', fontFamily: 'ygo-sc', punctuationTrim: 'end', letterSpacing: 2, strokeWidth: 4 };
  const comma = make(t, sc);
  const commaNatural = make(t, { ...sc, punctuationTrim: undefined });
  close(comma.bounds.width, commaNatural.bounds.width - bearing('ygo-sc', '、', 'end', 38));
  close(comma.rubyList[0].rubyNode.x, 0);

  for (const char of ['“', '”', '＋']) {
    const symbol = make(t, { text: char });
    const original = make(t, { text: char, punctuationTrim: undefined });
    close(symbol.rubyList[0].rubyNode.x, -bearing('ygo-jp', char, 'start', 38));
    close(symbol.bounds.width, original.bounds.width - bearing('ygo-jp', char, 'start', 38) - bearing('ygo-jp', char, 'end', 38));
  }

  for (const text of ['甲。乙', '甲「乙」丙', '[ABC]', '+', '０１２', 'ＡＢＣ']) {
    const withTrim = make(t, { text });
    const withoutTrim = make(t, { text, punctuationTrim: undefined });
    assert.deepEqual(withTrim.bounds, withoutTrim.bounds, text);
    assert.deepEqual(withTrim.rubyList.map(ruby => ruby.rubyNode.x), withoutTrim.rubyList.map(ruby => ruby.rubyNode.x), text);
  }
});

test('candidate line width restores inner punctuation space when text is appended', t => {
  const text = make(t, { text: '日甲。乙', width: 90 });
  assert.deepEqual(lines(text), ['日甲。', '乙']);
  text.set({ punctuationTrim: undefined });
  assert.deepEqual(lines(text), ['日', '甲。', '乙']);
  text.set({ punctuationTrim: trim, width: 131 });
  assert.deepEqual(lines(text), ['日甲。', '乙'], 'punctuation inside the candidate cannot contribute its edge clearance');
  text.set({ width: 133 });
  assert.deepEqual(lines(text), ['日甲。乙']);
  close(text.bounds.width, 133);

  const explicit = make(t, { text: '甲。 \u2060\n【乙】\n　【丙】', width: 90 });
  assert.deepEqual(lines(explicit), ['甲。', '【乙】', '　【丙】']);
  assert.ok(explicit.rubyList.find(ruby => ruby.text === '【乙】').rubyNode.x < 0);
  assert.ok(explicit.rubyList.find(ruby => ruby.text === '【丙】').rubyNode.x > 0);
  assert.deepEqual(lines(make(t, { text: '【甲】', width: 60 })), ['【甲】'], 'overflow fallback uses the trimmed edge width');
});

test('edge alignment and compression use occupied rather than natural line width', t => {
  const width = 120;
  const text = make(t, { text: '【甲】', width, textAlign: 'right' });
  const right = bearing('ygo-jp', '】', 'end', 38);
  close(text.rubyList[0].rubyNode.x + text.rubyList[0].width - right, width);

  const justified = make(t, { text: '日甲。\u200B乙', width: 91, textAlign: 'justify' });
  assert.deepEqual(lines(justified), ['日甲。', '乙']);
  const last = justified.rubyLineMap.get(0).findLast(ruby => ruby.rubyNode.visible);
  close(last.rubyNode.x + last.width - bearing('ygo-jp', '。', 'end', 38), 91);

  const segment = make(t, { text: '甲。\n【乙】', width: 50, compressSegments: [1] });
  assert.equal(segment.segmentScaleX.get(0), 1);
  assert.deepEqual(lines(segment), ['甲。', '【乙】']);

  const data = { text: '【日甲。】  \u200B乙\n【[甲(こう)]】 日。乙', width: 73, fontSize: 38 };
  const fitted = make(t, data);
  const layout = { fontSize: 38, fontSizeRatio: 1, letterSpacing: 0, strokeOutset: 0, rtStrokeOutset: 0 };
  for (const scale of [1, 0.85, 0.62, 0.2]) {
    const height = trialLayoutHeight(fitted.hardBreakSegments, fitted.width, fitted.getLineHeight(), fitted.segmentScaleX, scale, layout);
    fitted.lastSegmentScaleX = scale;
    fitted.relayoutBody();
    close(fitted.getLayoutHeight(), height);
  }

  const small = make(t, { text: '【甲】', width: 100, height: 25, smallFontSize: 20, autoSmallSize: true, letterSpacing: 2 });
  assert.equal(small.isSmallSize, true);
  close(small.rubyList[0].rubyNode.x, -bearing('ygo-jp', '【', 'start', 20));
  close(small.bounds.width, 46 - bearing('ygo-jp', '【', 'start', 20) - bearing('ygo-jp', '】', 'end', 20) - 2);
});

test('punctuation trimming reserves room for annotations and follows the active face', t => {
  const source = '[【甲】(とてもながいかもしれないちゅうおんです)]';
  const text = make(t, { text: source });
  const natural = make(t, { text: source, punctuationTrim: undefined });
  assert.deepEqual(text.bounds, natural.bounds);
  assert.equal(text.flatItemList.length, 1);
  close(text.flatItemList[0].rt.rtNode.scaleX, 0.6);
  close(text.flatItemList[0].rt.rtNode.x, natural.flatItemList[0].rt.rtNode.x);

  const adjacent = make(t, { text: '[甲(こう)]。', width: 50 });
  assert.deepEqual(lines(adjacent), ['甲。']);
  const [{ ruby, rt }] = adjacent.flatItemList;
  close(rt.rtNode.x, ruby.rubyNode.x + ruby.width / 2);

  const pending = withTextLayoutContext({ fontVersion: 1, loadedFonts: new Map() }, () => make(t, { text: '【甲】' }));
  close(pending.rubyList[0].rubyNode.x, 0);
  withTextLayoutContext({ fontVersion: 2, loadedFonts: fonts }, () => pending.set());
  close(pending.rubyList[0].rubyNode.x, -bearing('ygo-jp', '【', 'start', 38));
});

test('language styles inherit punctuation trimming and preserve explicit field overrides', () => {
  const style = inheritProp({
    punctuationTrim: true,
    cardText: { fontSize: 38 },
    monsterTypeLine: { fontSize: 46, punctuationTrim: false },
  });
  assert.equal(style.cardText.punctuationTrim, true);
  assert.equal(style.monsterTypeLine.punctuationTrim, false);
});

test('OCG only trims line-edge punctuation in Japanese, including after language changes', async t => {
  const edgeText = '【ABC】';
  const card = new YugiohCard({
    resourcePath,
    skia,
    data: { cardText: edgeText, pendulumEffect: edgeText, monsterTypeLine: 'ABC', cardTextAlign: 'left', renderScale: 0.15 },
  });
  t.after(() => card.leafer.destroy(true));
  for (const [language, textStylePreset, right] of [
    ['jp', 'custom1', 149],
    ['en', 'custom1', 149],
    ['jp', 'custom1', 149],
    ['kr', 'custom2', 149],
    ['tc', 'custom2', 149],
    ['sc', '', 134],
    ['tc', '', 138],
    ['en', '', 145],
    ['kr', '', 142],
    ['astral', '', 144],
    ['jp', '', 149],
  ]) {
    const japanese = language === 'jp';
    card.setData({ cardLayout: 'pendulum', language, textStylePreset });
    await card.ready;
    for (const text of [card.cardTextNode, card.pendulumEffectNode, card.monsterTypeLineNode]) {
      const inset = japanese ? bearing(text.fontFamily, '【', 'start', text.fontSize) : 0;
      close(text.rubyList[0].rubyNode.x, -inset);
    }

    card.setData({ cardLayout: 'trap' });
    await card.ready;
    const [rightBracket, , leftLabel] = card.spellTrapLabelNode.children;
    const inset = japanese ? bearing(leftLabel.fontFamily, '【', 'start', leftLabel.fontSize) : 0;
    close(leftLabel.rubyList[0].rubyNode.x, -inset);
    assert.equal(card.style.spellTrapLabel.right, right);
    close(rightBracket.x + rightBracket.bounds.width, card.cardWidth - right);
    assert.equal(rightBracket.text, language === 'en' || language === 'kr' ? ']' : '】');
    if (japanese) assert.ok(rightBracket.bounds.width < rightBracket.rubyList[0].width);
    else close(rightBracket.bounds.width, rightBracket.rubyList[0].width);
  }
});

test('Rush Duel restores natural punctuation spacing when switching to Simplified Chinese', async t => {
  const card = new RushDuelCard({
    resourcePath,
    skia,
    data: { language: 'jp', cardText: '【ABC】', monsterTypeLine: 'ABC', cardTextAlign: 'left', renderScale: 0.15 },
  });
  t.after(() => card.leafer.destroy(true));
  for (const language of ['jp', 'sc', 'jp']) {
    card.setData({ language, cardLayout: 'monster' });
    await card.ready;
    for (const text of [card.cardTextNode, card.monsterTypeLineNode]) {
      const inset = language === 'jp' ? bearing(text.fontFamily, '【', 'start', text.fontSize, rushFonts) : 0;
      close(text.rubyList[0].rubyNode.x, -inset);
    }

    card.setData({ cardLayout: 'trap' });
    await card.ready;
    const [leftLabel, , rightBracket] = card.spellTrapLabelNode.children;
    const inset = language === 'jp' ? bearing(leftLabel.fontFamily, '【', 'start', leftLabel.fontSize, rushFonts) : 0;
    close(leftLabel.rubyList[0].rubyNode.x, -inset);
    if (language === 'jp') assert.ok(rightBracket.bounds.width < rightBracket.rubyList[0].width);
    else close(rightBracket.bounds.width, rightBracket.rubyList[0].width);
  }
});

test('spell and trap labels trim the outer bracket while keeping space around the icon', async t => {
  for (const [Card, resource, fontFamily, fontSize, anchor] of [
    [YugiohCard, fonts, 'ygo-jp', 80, 1245],
    [YugiohSeries2Card, fonts, 'ygo-jp', 80, 1220],
    [RushDuelCard, rushFonts, 'rd-jp-effect', 46, 99],
  ]) {
    await t.test(Card.name, async t => {
      const card = new Card({ resourcePath, skia, data: { language: 'jp', cardLayout: 'trap', spellTrapIcon: 'continuous', renderScale: 0.15 } });
      t.after(() => card.leafer.destroy(true));
      for (const [cardLayout, spellTrapIcon] of [['trap', 'continuous'], ['spell', '']]) {
        card.setData({ cardLayout, spellTrapIcon });
        await card.ready;
        const rush = Card === RushDuelCard;
        const [first, icon, last] = card.spellTrapLabelNode.children;
        const [left, right] = rush ? [first, last] : [last, first];
        const margins = card.style.spellTrapLabel.icon;
        close(icon.x - left.x - left.bounds.width, spellTrapIcon ? margins.marginLeft ?? 0 : 0);
        close(right.x - icon.x - (spellTrapIcon ? (rush ? 60 : 72) : 0), spellTrapIcon ? margins.marginRight ?? 0 : 0);
        close(left.rubyList[0].rubyNode.x, -bearing(fontFamily, '【', 'start', fontSize, resource));
        close(right.rubyList[0].rubyNode.x, 0);
        if (rush) close(left.x, anchor);
        else close(right.x + right.rubyList[0].width - bearing(fontFamily, '】', 'end', fontSize, resource), anchor);
      }
    });
  }
});
