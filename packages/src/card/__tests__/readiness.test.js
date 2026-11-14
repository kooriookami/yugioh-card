import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import path from 'node:path';
import { Group, Text, ImageManager, LeaferEvent, useCanvas } from 'leafer-unified';
import skia from 'skia-canvas';
import { CompressText } from '../../compress-text/compress-text.js';
import { resourceError } from '../../utils/resource-error.js';
import { CardReadiness } from '../readiness.js';

useCanvas('skia', skia);
const flush = async () => { await new Promise(resolve => setImmediate(resolve)); };

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

const fontResource = families => {
  const listeners = new Set();
  return {
    path: '/font',
    status: 'loading',
    fonts: new Map(families.map(family => [family, { status: 'loading' }])),
    subscribe(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    notify() { listeners.forEach(callback => callback()); },
    get listenerCount() { return listeners.size; },
  };
};

const fixture = (t, fonts = null, timeout) => {
  const card = { leafer: new View(), data: { text: 'Preview', family: 'sans-serif' }, draws: 0 };
  card.draw = () => {
    card.draws++;
    if (!card.label) {
      card.label = new Text();
      card.leafer.children.push(card.label);
    }
    card.label.set({ text: card.data.text, fontFamily: card.data.family });
  };
  const readiness = new CardReadiness(card, () => fonts, timeout);
  card.setData = data => {
    Object.assign(card.data, data);
    readiness.update();
  };
  Object.defineProperty(card, 'ready', { get: () => readiness.promise });
  t.after(() => {
    readiness.destroy();
    card.leafer.children.forEach(node => node.destroy());
  });
  return { card, readiness };
};

const trackImage = (readiness, url, status, error = null) => {
  const image = ImageManager.get({ url });
  readiness.images.records.set(url, { image, targets: [], status, error });
};

test('pending updates share one promise and stay synchronous; a completed cycle gets a new promise', async t => {
  const { card } = fixture(t);
  const first = card.ready;
  card.setData({ text: 'First' });
  card.setData({ text: 'Latest' });
  assert.equal(card.label.text, 'Latest');
  assert.equal(card.ready, first);
  let settled = false;
  first.then(() => { settled = true; });
  await flush();
  assert.equal(settled, false);
  card.leafer.render();
  await first;
  const draws = card.draws;
  card.setData({ text: 'Cached update' });
  assert.equal(card.label.text, 'Cached update');
  assert.notEqual(card.ready, first);
  const next = card.ready;
  await flush();
  card.leafer.render();
  await next;
  assert.equal(card.draws, draws + 1, 'no extra asynchronous draw for cached resources');
});

test('manifest and every currently used font must load; real metrics and dependent positions are refreshed once', async t => {
  const families = ['ready-body', 'ready-ruby', 'ready-native'];
  const fonts = fontResource(families);
  const { card } = fixture(t, fonts);
  const root = new Group();
  card.leafer.children = [root];
  card.draw = () => {
    card.draws++;
    if (!card.compressed) {
      card.compressed = new CompressText();
      card.native = new Text({ fontFamily: 'ready-native', text: 'WWWWWWiiiiii', fontSize: 40 });
      root.addMany(card.compressed, card.native);
    }
    card.compressed.set({ text: '[WWWW(iiii)] WWWWiiii', fontFamily: 'ready-body', rtFontFamily: 'ready-ruby', fontSize: 40, width: 260, textAlign: 'left' });
    card.position = card.compressed.bounds.width;
    card.nativePosition = card.native.getBounds('content', 'inner').width;
  };
  card.setData({});
  const preview = card.compressed.group;
  const previewPosition = card.position;
  const previewNative = card.nativePosition;
  await flush();
  card.leafer.render();
  assert.equal(card.draws, 1);
  fonts.status = 'loaded';
  for (const family of families.slice(0, 2)) {
    skia.FontLibrary.use(family, [path.resolve('src/assets/yugioh-card/yugioh/font/ygo-en-race.woff2')]);
    fonts.fonts.get(family).status = 'loaded';
    fonts.notify();
  }
  await flush();
  assert.equal(card.draws, 1, 'wait for all used fonts before the final correction');
  skia.FontLibrary.use('ready-native', [path.resolve('src/assets/yugioh-card/yugioh/font/ygo-password.woff2')]);
  fonts.fonts.get('ready-native').status = 'loaded';
  fonts.notify();
  fonts.notify();
  await flush();
  assert.equal(card.draws, 2);
  assert.notEqual(card.compressed.group, preview, 'unchanged text configuration is remeasured');
  assert.notEqual(card.position, previewPosition);
  assert.notEqual(card.nativePosition, previewNative);
  card.leafer.render();
  await card.ready;
});

test('unused font failures and obsolete language dependencies do not fail the latest update', async t => {
  const fonts = fontResource(['ygo-sc', 'ygo-en', 'ygo-kr']);
  const { card } = fixture(t, fonts);
  card.setData({ family: 'ygo-sc' });
  card.setData({ family: 'ygo-en', text: 'Latest language' });
  const promise = card.ready;
  fonts.status = 'loaded';
  fonts.fonts.get('ygo-sc').status = 'failed';
  fonts.fonts.get('ygo-sc').error = new Error('obsolete');
  fonts.fonts.get('ygo-kr').status = 'failed';
  fonts.fonts.get('ygo-en').status = 'loaded';
  fonts.notify();
  await flush();
  card.leafer.render();
  await promise;
  assert.equal(card.label.text, 'Latest language');
});

test('a required font failure rejects the original promise and a later update can recover', async t => {
  const fonts = fontResource(['ygo-sc']);
  const { card } = fixture(t, fonts);
  card.setData({ family: 'ygo-sc' });
  const first = card.ready;
  const error = new Error('required font failed');
  fonts.status = 'loaded';
  Object.assign(fonts.fonts.get('ygo-sc'), { status: 'failed', error });
  fonts.notify();
  await assert.rejects(first, error);
  assert.equal(card.label.text, 'Preview');
  fonts.fonts.set('ygo-sc', { status: 'loaded' });
  card.setData({ text: 'Recovered' });
  assert.notEqual(card.ready, first);
  await flush();
  card.leafer.render();
  await card.ready;
});

test('global resources can delay view completion without extra card drawing', async t => {
  const { card } = fixture(t);
  card.leafer.imageReady = false;
  card.setData({});
  let complete = false;
  card.ready.then(() => { complete = true; });
  await flush();
  card.leafer.render();
  await flush();
  assert.equal(complete, false);
  card.leafer.imageReady = true;
  card.leafer.emit(LeaferEvent.VIEW_COMPLETED);
  await card.ready;
  assert.equal(card.draws, 1);
});

test('stale render callbacks cannot complete a later update', async t => {
  const { card } = fixture(t);
  card.setData({ text: 'A' });
  await flush();
  const [stale] = card.leafer.frames;
  card.setData({ text: 'B' });
  let complete = false;
  card.ready.then(() => { complete = true; });
  stale();
  await flush();
  assert.equal(complete, false);
  card.leafer.render();
  await card.ready;
  assert.equal(card.label.text, 'B');
});

test('destroy rejects pending readiness, removes subscriptions and ignores late font signals', async t => {
  const fonts = fontResource(['ygo-sc']);
  const { card, readiness } = fixture(t, fonts);
  card.setData({ family: 'ygo-sc' });
  const waiting = card.ready;
  assert.equal(fonts.listenerCount, 1);
  card.leafer.emit(LeaferEvent.END);
  await assert.rejects(waiting, { code: 'CARD_DESTROYED' });
  assert.equal(fonts.listenerCount, 0);
  fonts.status = 'loaded';
  fonts.fonts.get('ygo-sc').status = 'loaded';
  fonts.notify();
  await flush();
  assert.equal(card.draws, 1);
  assert.throws(() => readiness.update(), { code: 'CARD_DESTROYED' });
});

test('readiness has a bounded timeout and keeps synchronous draw errors synchronous', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { card } = fixture(t, null, 100);
  card.leafer.imageReady = false;
  card.setData({});
  const waiting = card.ready;
  t.mock.timers.tick(100);
  await assert.rejects(waiting, { code: 'READY_TIMEOUT' });
  const failure = new Error('invalid card configuration');
  card.draw = () => { throw failure; };
  assert.throws(() => card.setData({}), failure);
  await assert.rejects(card.ready, failure);
});

for (const stage of ['manifest', 'font']) {
  test(`known image errors take priority over a pending ${stage}`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const fonts = fontResource(['ygo-sc']);
    if (stage === 'font') fonts.status = 'loaded';
    const { card, readiness } = fixture(t, fonts, 100);
    card.setData({ family: 'ygo-sc' });
    const url = `ready-error:${stage}/failed.png`;
    const cause = new Error('Required image failed');
    const failure = resourceError('image', url, cause);
    trackImage(readiness, url, 'failed', failure);
    await flush();
    t.mock.timers.tick(100);
    await assert.rejects(card.ready, error => error === failure && error.resource === url && error.cause === cause);
  });
}

test('a loading image cannot hide a later required image error', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { card, readiness } = fixture(t, null, 100);
  card.setData({});
  const failure = resourceError('image', 'ready-error:later-failed.png', new Error('Second image failed'));
  trackImage(readiness, 'ready-error:first-loading.png', 'loading');
  trackImage(readiness, failure.resource, 'failed', failure);
  await flush();
  t.mock.timers.tick(100);
  await assert.rejects(card.ready, error => error === failure);
});

test('a loading font or image cannot hide a required font error', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const fonts = fontResource(['waiting-font', 'failed-font']);
  fonts.status = 'loaded';
  const failure = resourceError('font', '/font/failed-font.woff2', new Error('Required font failed'));
  Object.assign(fonts.fonts.get('failed-font'), { status: 'failed', error: failure });
  const { card, readiness } = fixture(t, fonts, 100);
  card.setData({ family: 'waiting-font, failed-font' });
  trackImage(readiness, 'ready-error:waiting-for-font.png', 'loading');
  await flush();
  t.mock.timers.tick(100);
  await assert.rejects(card.ready, error => error === failure);
});

test('pending resources without a known failure still wait until the normal timeout', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { card, readiness } = fixture(t, fontResource(['ygo-sc']), 100);
  card.setData({ family: 'ygo-sc' });
  trackImage(readiness, 'ready-error:only-loading.png', 'loading');
  await flush();
  assert.equal(readiness.pending, true);
  t.mock.timers.tick(100);
  await assert.rejects(card.ready, { code: 'READY_TIMEOUT' });
});
