import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { getBrowserFontResource, getNodeFontResource } from '../font-loader.js';

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const flush = async () => { await new Promise(resolve => setImmediate(resolve)); };

const browser = (t, manifest) => {
  const originals = new Map(['document', 'FontFace', 'fetch'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const faces = [];
  let requests = 0;
  const fonts = new Set();
  globalThis.document = { baseURI: 'http://localhost/app/', fonts };
  globalThis.FontFace = class {
    constructor(family) {
      this.family = family;
      this.loading = deferred();
      faces.push(this);
    }
    load() { return this.loading.promise; }
  };
  globalThis.fetch = async () => {
    requests++;
    return manifest();
  };
  t.after(() => {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return { faces, fonts, get requests() { return requests; } };
};

test('concurrent browser font requests share the actual pending manifest and font promises', async t => {
  const manifest = deferred();
  const env = browser(t, () => manifest.promise);
  const a = getBrowserFontResource('./fonts');
  const b = getBrowserFontResource('http://localhost/app/fonts/', true);
  assert.equal(a, b);
  assert.equal(a.promise, b.promise);
  assert.equal(a.status, 'loading');
  await flush();
  assert.equal(env.requests, 1);
  manifest.resolve({ ok: true, json: async () => ['ygo-sc', 'ygo-tip'] });
  await flush();
  assert.equal(a.status, 'loaded', 'manifest registration is distinct from font completion');
  assert.equal(a.fonts.get('ygo-sc').status, 'loading');
  let completed = false;
  b.promise.then(() => { completed = true; });
  env.faces[0].loading.resolve();
  await flush();
  assert.equal(completed, false);
  env.faces[1].loading.resolve();
  await b.promise;
  assert.equal(env.faces.length, 2);
  assert.equal(a.fonts.get('ygo-tip').status, 'loaded');
});

test('manifest failures are observable and a new cycle retries rather than caching failure forever', async t => {
  let fail = true;
  const env = browser(t, async () => fail ? { ok: false, status: 503 } : { ok: true, json: async () => ['ygo-sc'] });
  const first = getBrowserFontResource('/font');
  await assert.rejects(first.promise, { code: 'RESOURCE_FAILED', resourceType: 'font manifest' });
  assert.equal(first.status, 'failed');
  fail = false;
  const next = getBrowserFontResource('/font', true);
  assert.notEqual(next, first);
  await flush();
  env.faces[0].loading.resolve();
  await next.promise;
  assert.equal(env.requests, 2);
});

test('individual font failures remain recorded and retries reuse successful faces', async t => {
  const env = browser(t, async () => ({ ok: true, json: async () => ['ygo-sc', 'ygo-en'] }));
  const first = getBrowserFontResource('/font');
  await flush();
  env.faces[0].loading.resolve();
  env.faces[1].loading.reject(new Error('broken font'));
  await first.promise;
  const good = first.fonts.get('ygo-sc');
  assert.equal(good.status, 'loaded');
  assert.equal(first.fonts.get('ygo-en').status, 'failed');
  assert.equal(env.fonts.size, 1, 'failed faces are removed from the FontFaceSet');
  const retry = getBrowserFontResource('/font', true);
  await flush();
  assert.equal(retry.fonts.get('ygo-sc'), good);
  assert.equal(env.faces.length, 3, 'only the failed face is requested again');
  assert.equal(env.requests, 1, 'successful manifest is reused');
  env.faces[2].loading.resolve();
  await retry.promise;
  assert.equal(retry.fonts.get('ygo-en').status, 'loaded');
});

test('Node font registration is synchronous, scoped to FontLibrary, and retryable after a throw', () => {
  const directory = path.resolve('src/assets/yugioh-card/yugioh/font');
  let calls = 0;
  const a = { FontLibrary: { use() { calls++; } } };
  const first = getNodeFontResource(directory, a);
  assert.equal(first.status, 'loaded');
  assert.equal(first.fonts.get('ygo-sc').status, 'loaded');
  assert.equal(getNodeFontResource(`${directory}/.`, a), first);
  assert.equal(calls, first.fonts.size);
  const b = { FontLibrary: { use() { calls++; } } };
  assert.notEqual(getNodeFontResource(directory, b), first);
  assert.equal(calls, first.fonts.size * 2);
  let fail = true;
  const c = { FontLibrary: { use() { if (fail) throw new Error('font registration failed'); } } };
  assert.throws(() => getNodeFontResource(directory, c), /font registration failed/);
  fail = false;
  assert.equal(getNodeFontResource(directory, c).status, 'loaded');
});

test('a stalled font manifest times out and remains retryable', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  browser(t, () => new Promise(() => {}));
  const resource = getBrowserFontResource('/stalled-manifest');
  await flush();
  t.mock.timers.tick(30000);
  await assert.rejects(resource.promise, error => error.resourceType === 'font manifest' && error.cause.code === 'RESOURCE_TIMEOUT');
  assert.equal(resource.status, 'failed');
});

test('a stalled face times out instead of keeping the shared resource task pending forever', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const env = browser(t, async () => ({ ok: true, json: async () => ['ygo-sc'] }));
  const resource = getBrowserFontResource('/stalled-face');
  await flush();
  t.mock.timers.tick(30000);
  await resource.promise;
  const entry = resource.fonts.get('ygo-sc');
  assert.equal(entry.status, 'failed');
  assert.equal(entry.error.cause.code, 'RESOURCE_TIMEOUT');
  assert.equal(env.fonts.size, 0);
});
