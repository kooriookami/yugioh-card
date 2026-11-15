import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { Platform, Resource, useCanvas } from 'leafer-unified';
import skia from 'skia-canvas';
import { YugiohCard, RushDuelCard, YugiohBackCard, FieldCenterCard, YugiohSeries2Card } from '../../../index.js';
import { getNodeFontResource } from '../../utils/font-loader.js';

const resourcePath = path.resolve('src/assets/yugioh-card');
const photo = path.resolve('src/assets/image/blue-eyes.jpg');
useCanvas('skia', skia);
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const flush = async () => { await new Promise(resolve => setImmediate(resolve)); };

const makeCard = (t, Card, data = {}, images) => {
  const card = new Card({ resourcePath, skia, data: { scale: 0.12, ...data } });
  images?.install();
  t.after(() => card.leafer.destroy(true));
  return card;
};

const controlImages = t => {
  const load = Platform.origin.loadImage;
  const requests = new Map();
  const controlled = async (url, ...args) => {
    if (!url.startsWith('ready-test:')) return load(url, ...args);
    let request = requests.get(url);
    if (!request) requests.set(url, request = { started: deferred(), gate: deferred(), calls: 0 });
    request.calls++;
    request.started.resolve();
    await request.gate.promise;
    return load(photo, ...args);
  };
  const requestFor = url => {
    let request = requests.get(url);
    if (!request) requests.set(url, request = { started: deferred(), gate: deferred(), calls: 0 });
    return request;
  };
  requestFor.install = () => t.mock.method(Platform.origin, 'loadImage', controlled);
  return requestFor;
};

test('all five card classes complete unchanged updates and export real assets', async t => {
  for (const Card of [YugiohCard, RushDuelCard, YugiohBackCard, FieldCenterCard, YugiohSeries2Card]) {
    await t.test(Card.name, async t => {
      const card = makeCard(t, Card, { name: '[青眼(ブルーアイズ)]', description: 'A real font measurement and image export.', image: photo });
      assert.equal(card.ready instanceof Promise, true);
      await card.ready;
      for (const data of [{}, { ...card.data }]) {
        const previous = card.ready;
        card.setData(data);
        assert.notEqual(card.ready, previous, 'unchanged updates create a new readiness promise');
        await card.ready;
      }
      assert.equal(card.leafer.imageReady, true);
      const result = await card.leafer.export('png', { screenshot: true });
      assert.match(result.data, /^data:image\/png;base64,/);
      const image = await skia.loadImage(result.data);
      assert.ok(image.width > 100 && image.height > 100);
      if (Card === YugiohBackCard || Card === FieldCenterCard) assert.equal(card._readiness.fonts, null);
    });
  }
});

test('initial draw failures release their font subscription and Leafer without affecting another card', async t => {
  const fonts = getNodeFontResource(`${resourcePath}/yugioh/font`, skia);
  const subscribe = fonts.subscribe;
  let subscriptions = 0;
  t.mock.method(fonts, 'subscribe', callback => {
    subscriptions++;
    const unsubscribe = subscribe(callback);
    return () => { subscriptions--; unsubscribe(); };
  });
  const sibling = makeCard(t, YugiohCard, { image: photo });
  await sibling.ready;
  assert.equal(subscriptions, 1);
  let partial;
  class InvalidCard extends YugiohCard {
    initLeafer() { super.initLeafer(); partial = this; }
  }
  t.after(() => partial?.leafer.destroy(true));
  let originalError;
  assert.throws(() => new InvalidCard({ resourcePath, skia, data: { language: 'unsupported-language' } }), error => {
    originalError = error;
    return error instanceof TypeError;
  });
  await assert.rejects(partial.ready, error => error === originalError);
  assert.equal(partial._readiness.disposed, true);
  assert.equal(partial.leafer.destroyed, true);
  assert.equal(partial.leafer.children?.length ?? 0, 0);
  assert.equal(partial._readiness.images.records.size, 0);
  assert.equal(subscriptions, 1, 'only the surviving card retains a font subscription');
  assert.equal(getNodeFontResource(`${resourcePath}/yugioh/font`, skia), fonts);
  sibling.setData({ name: 'Still usable' });
  await sibling.ready;
  assert.equal(sibling.nameLeaf.text, 'Still usable');
});

test('initial resource tracking failures release acquired image references even after draw succeeds', async t => {
  const background = `${resourcePath}/field-center/image/card-background.png`;
  const previousUse = Resource.get(background)?.use ?? 0;
  const originalError = new Error('Initial resource tracking failed');
  let partial;
  let acquired;
  class InvalidCard extends FieldCenterCard {
    initLeafer() {
      super.initLeafer();
      partial = this;
      const images = this._readiness.images;
      const sync = images.sync.bind(images);
      images.sync = (...args) => {
        sync(...args);
        acquired = images.records.get(background).image;
        throw originalError;
      };
    }
  }
  t.after(() => partial?.leafer.destroy(true));
  assert.throws(() => new InvalidCard({ resourcePath, skia, data: { image: photo } }), error => error === originalError);
  await assert.rejects(partial.ready, error => error === originalError);
  assert.equal(partial._readiness.hasDrawn, true);
  assert.equal(partial._readiness.disposed, true);
  assert.equal(partial.leafer.destroyed, true);
  assert.equal(partial._readiness.images.records.size, 0);
  assert.equal(acquired.use, previousUse);
});

test('later draw failures keep the existing card and resources available for retry', async t => {
  const card = makeCard(t, YugiohCard, { image: photo });
  await card.ready;
  const leafer = card.leafer;
  const image = card._readiness.images.records.get(photo);
  let originalError;
  assert.throws(() => card.setData({ language: 'unsupported-language' }), error => {
    originalError = error;
    return error instanceof TypeError;
  });
  await assert.rejects(card.ready, error => error === originalError);
  assert.equal(card._readiness.disposed, false);
  assert.notEqual(leafer.destroyed, true);
  assert.equal(card._readiness.images.records.get(photo), image);
  const failed = card.ready;
  card.setData({ language: 'sc', name: 'Recovered after draw failure' });
  assert.notEqual(card.ready, failed);
  await card.ready;
  assert.equal(card.leafer, leafer);
  assert.equal(card.nameLeaf.text, 'Recovered after draw failure');
});

test('delayed images keep readiness pending and obsolete A cannot replace image B', async t => {
  const request = controlImages(t);
  const a = request('ready-test:obsolete-a');
  const b = request('ready-test:current-b');
  const card = makeCard(t, FieldCenterCard, { image: 'ready-test:obsolete-a' }, request);
  const ready = card.ready;
  await a.started.promise;
  card.setData({ image: 'ready-test:current-b' });
  // 引擎可能先结束唯一运行中的 A 才启动 B；A 此时已失效，其失败不能影响新画面。
  a.gate.reject(new Error('obsolete A failed'));
  await b.started.promise;
  assert.equal(card.imageLeaf.fill.url, 'ready-test:current-b');
  assert.equal(card.ready, ready);
  let completed = false;
  ready.then(() => { completed = true; });
  await flush();
  assert.equal(completed, false);
  b.gate.resolve();
  await ready;
  assert.equal(card.imageLeaf.fill.url, 'ready-test:current-b');
  assert.equal(a.calls, 1);
  assert.equal(b.calls, 1);
  const result = await card.leafer.export('png', { screenshot: true });
  assert.ok(result.data.length > 1000);
});

test('required image errors reject readiness and the same URL can be retried by setData', async t => {
  const request = controlImages(t);
  const failed = request('ready-test:retry-image');
  const card = makeCard(t, FieldCenterCard, { image: 'ready-test:retry-image' }, request);
  const first = card.ready;
  await failed.started.promise;
  failed.gate.reject(new Error('first request failed'));
  await assert.rejects(first, { code: 'RESOURCE_FAILED', resourceType: 'image', resource: 'ready-test:retry-image' });
  failed.gate = deferred();
  card.setData({});
  assert.notEqual(card.ready, first);
  failed.gate.resolve();
  await card.ready;
  assert.equal(failed.calls, 2);
  const result = await card.leafer.export('png', { screenshot: true });
  assert.ok(result.data.length > 1000);
});

test('destroying one card leaves shared loading alive for another and does not leak rejection', async t => {
  const request = controlImages(t);
  const image = request('ready-test:shared-destroy');
  const a = makeCard(t, FieldCenterCard, { image: 'ready-test:shared-destroy' }, request);
  const b = makeCard(t, FieldCenterCard, { image: 'ready-test:shared-destroy' }, request);
  await image.started.promise;
  const destroyed = a.ready;
  a.leafer.destroy(true);
  await assert.rejects(destroyed, { code: 'CARD_DESTROYED' });
  image.gate.resolve();
  await b.ready;
  assert.equal(image.calls, 1);
  assert.throws(() => a.setData({}), { code: 'CARD_DESTROYED' });
  // 故意不读取这个实例的 ready：Node 测试运行器会把未处理拒绝视为失败。
  const ignored = makeCard(t, FieldCenterCard);
  ignored.leafer.destroy(true);
  await flush();
});

test('a different card failure in the global resource queue does not poison this card', async t => {
  const request = controlImages(t);
  const bad = request('ready-test:other-card-fails');
  const a = makeCard(t, FieldCenterCard, { image: photo });
  const b = makeCard(t, FieldCenterCard, { image: 'ready-test:other-card-fails' }, request);
  await bad.started.promise;
  bad.gate.reject(new Error('other card failed'));
  await assert.rejects(b.ready, { code: 'RESOURCE_FAILED' });
  await a.ready;
  assert.equal(a.leafer.imageReady, true);
});

test('cleaning up a previously failed card cannot remove another card retry callback', async t => {
  const request = controlImages(t);
  const image = request('ready-test:shared-retry-cleanup');
  const a = makeCard(t, FieldCenterCard, { image: 'ready-test:shared-retry-cleanup' }, request);
  await image.started.promise;
  image.gate.reject(new Error('shared image failed'));
  await assert.rejects(a.ready, { code: 'RESOURCE_FAILED' });
  image.gate = deferred();
  image.started = deferred();
  const b = makeCard(t, FieldCenterCard, { image: 'ready-test:shared-retry-cleanup' }, request);
  await image.started.promise;
  a.leafer.destroy(true);
  image.gate.resolve();
  await b.ready;
  assert.equal(image.calls, 2);
});
