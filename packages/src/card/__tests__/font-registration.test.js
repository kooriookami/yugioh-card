import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Text, LeaferEvent, useCanvas } from 'leafer-unified';
import skia from 'skia-canvas';
import { CompressText } from '../../compress-text/compress-text.js';
import { getGlyphMetrics } from '../../compress-text/glyph-metrics.js';
import { getBrowserFontResource, getLoadedFontEntry, getNodeFontResource } from '../../utils/font-loader.js';
import { CardReadiness } from '../readiness.js';

useCanvas('skia', skia);
const fontDirectory = path.resolve('src/assets/yugioh-card/yugioh/font');
const flush = async () => { await new Promise(resolve => setImmediate(resolve)); };
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);

class View extends EventEmitter {
  children = [];
  frames = new Set();
  imageReady = true;

  nextRender(callback, bind, off) {
    if (off) this.frames.delete(callback);
    else this.frames.add(callback);
  }

  render() {
    const frames = [...this.frames];
    this.frames.clear();
    frames.forEach(callback => callback());
    this.emit(LeaferEvent.VIEW_COMPLETED);
  }
}

const makeCard = (t, fonts, family = 'ygo-jp') => {
  const card = { leafer: new View(), data: { text: '日', family }, draws: 0 };
  card.draw = () => {
    card.draws++;
    if (!card.label) {
      card.label = new CompressText();
      card.native = new Text({ text: '０', fontSize: 38 });
      card.leafer.children.push(card.label, card.native);
    }
    card.label.set({ text: card.data.text, fontFamily: card.data.family, fontSize: 38, width: 1000, textAlign: 'left', sideBearingRatio: 0.5 });
    card.native.set({ fontFamily: card.data.family });
    card.position = card.label.bounds.width;
    card.nativePosition = card.native.getBounds('content', 'inner').width;
  };
  const readiness = new CardReadiness(card, () => fonts);
  Object.defineProperty(card, 'ready', { get: () => readiness.promise });
  card.setData = data => { Object.assign(card.data, data); readiness.update(); };
  t.after(() => {
    readiness.destroy();
    card.leafer.children.forEach(node => node.destroy());
  });
  card.setData({});
  return { card, readiness };
};

const browser = t => {
  const originals = new Map(['document', 'FontFace', 'fetch'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const faces = [];
  const resources = [];
  const fonts = new Set();
  globalThis.document = { baseURI: 'http://localhost/', fonts };
  globalThis.FontFace = class {
    constructor(family) { this.family = family; this.loading = deferred(); faces.push(this); }
    load() { return this.loading.promise; }
  };
  globalThis.fetch = async url => {
    if (String(url).endsWith('font-list.json')) return { ok: true, json: async () => [String(url).includes('/unused/') ? 'unused-font' : 'ygo-jp'] };
    const data = fs.readFileSync(`${fontDirectory}/${String(url).includes('/b/') ? 'ygo-sc' : 'ygo-jp'}.woff2`);
    return { ok: true, arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) };
  };
  t.after(async () => {
    faces.forEach(face => face.loading.resolve());
    await Promise.all(resources.map(resource => resource.promise));
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return {
    faces,
    resource(name) { const resource = getBrowserFontResource(`/${name}`); resources.push(resource); return resource; },
  };
};

const settle = async card => {
  await flush();
  card.leafer.render();
  await card.ready;
};

test('a settled card follows another directory replacing its font, including unchanged updates and disposal', async t => {
  const env = browser(t);
  const a = env.resource('a');
  await flush();
  env.faces[0].loading.resolve();
  await a.promise;
  const { card, readiness } = makeCard(t, a, '"YGO-JP"');
  const { card: destroyed, readiness: disposed } = makeCard(t, a);
  await settle(card);
  await settle(destroyed);
  disposed.destroy();
  const destroyedReady = destroyed.ready, destroyedDraws = destroyed.draws;
  const previous = card.ready, group = card.label.group, position = card.position;
  const unused = env.resource('unused');
  await flush();
  env.faces[1].loading.resolve();
  await unused.promise;
  assert.equal(card.ready, previous, 'unrelated families do not start a cycle');
  const b = env.resource('b');
  await flush();
  env.faces[2].loading.resolve();
  await b.promise;
  await flush();
  assert.notEqual(card.ready, previous);
  assert.equal(readiness.pending, true, 'the replacement must still be drawn');
  assert.equal(readiness.loadedFonts.get('ygo-jp'), b.fonts.get('ygo-jp'));
  assert.notEqual(card.label.group, group);
  assert.notEqual(card.position, position);
  close(card.position, getGlyphMetrics('ygo-jp', 0.5)('日').width * 38);
  await settle(card);
  card.setData({});
  assert.equal(readiness.loadedFonts.get('ygo-jp'), b.fonts.get('ygo-jp'), 'unchanged updates retain the actual font');
  close(card.position, getGlyphMetrics('ygo-jp', 0.5)('日').width * 38);
  await settle(card);
  card.setData({ text: '日日' });
  close(card.position, getGlyphMetrics('ygo-jp', 0.5)('日').width * 38 * 2);
  await settle(card);
  assert.equal(destroyed.ready, destroyedReady);
  assert.equal(destroyed.draws, destroyedDraws, 'disposed cards do not respond to global font changes');
});

for (const order of [[0, 1], [1, 0]]) {
  test(`pending cards use the last registered face for completion order ${order.join(' -> ')}`, async t => {
    const env = browser(t);
    const resources = [env.resource('a'), env.resource('b')];
    const fixtures = resources.map(resource => makeCard(t, resource));
    const promises = fixtures.map(({ card }) => card.ready);
    await flush();
    const first = order[0], last = order[1];
    env.faces[first].loading.resolve();
    await resources[first].promise;
    await flush();
    const [stale] = fixtures[first].card.leafer.frames;
    let completed = false;
    promises[first].then(() => { completed = true; });
    env.faces[last].loading.resolve();
    await resources[last].promise;
    stale();
    await flush();
    assert.equal(completed, false, 'an old frame cannot finish the cycle after the font changes');
    const entry = resources[last].fonts.get('ygo-jp');
    for (const [index, { card, readiness }] of fixtures.entries()) {
      assert.equal(card.ready, promises[index], 'pending updates retain the same promise');
      assert.equal(readiness.loadedFonts.get('ygo-jp'), entry);
      close(card.position, getGlyphMetrics('ygo-jp', 0.5)('日').width * 38);
      await settle(card);
    }
  });
}

test('a pending local font uses the registered face for preview but its own failure still rejects ready', async t => {
  const env = browser(t);
  const b = env.resource('b');
  await flush();
  env.faces[0].loading.resolve();
  await b.promise;
  const a = env.resource('a');
  const { card, readiness } = makeCard(t, a);
  await flush();
  // 清单已返回后的一次同步更新也必须跟随全局实际字体，而非等待本目录字体。
  card.setData({ text: '日日' });
  close(card.position, getGlyphMetrics('ygo-jp', 0.5)('日').width * 38 * 2);
  assert.equal(readiness.pending, true);
  env.faces[1].loading.reject(new Error('Expected local font failure'));
  await a.promise;
  await assert.rejects(card.ready, error => error.resource === 'http://localhost/a/ygo-jp.woff2');
  assert.equal(getLoadedFontEntry('ygo-jp'), b.fonts.get('ygo-jp'));
});

test('Node cards follow actual FontLibrary registration and cache hits retain that identity', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'yugioh-font-registration-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const family = 'registered-card-node';
  for (const [name, file] of [['a', 'ygo-jp'], ['b', 'ygo-sc']]) {
    fs.mkdirSync(`${directory}/${name}`);
    fs.writeFileSync(`${directory}/${name}/font-list.json`, JSON.stringify([family]));
    fs.copyFileSync(`${fontDirectory}/${file}.woff2`, `${directory}/${name}/${family}.woff2`);
  }
  const a = getNodeFontResource(`${directory}/a`, skia);
  const { card, readiness } = makeCard(t, a, family);
  await settle(card);
  const previous = card.ready, native = card.nativePosition;
  const b = getNodeFontResource(`${directory}/b`, skia);
  assert.notEqual(card.ready, previous);
  await settle(card);
  assert.equal(readiness.loadedFonts.get(family), b.fonts.get(family));
  assert.notEqual(card.nativePosition, native, 'ordinary Text measurements are invalidated too');
  const context = new skia.Canvas(100, 100).getContext('2d');
  context.font = `38px "${family}"`;
  close(card.nativePosition, context.measureText('０').width);
  assert.equal(getNodeFontResource(`${directory}/a`, skia), a);
  assert.equal(getLoadedFontEntry(family, skia.FontLibrary), b.fonts.get(family), 'cached A did not register a face again');
  card.setData({ text: '日日' });
  close(card.position, getGlyphMetrics(family, 0.5)('日').width * 38 * 2);
  await settle(card);
});
