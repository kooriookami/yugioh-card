import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { getBrowserCardFonts, getBrowserFontResource, getLoadedFontEntry, getNodeFontResource, subscribeFontChanges } from '../font-loader.ts';
import { getFontInfo } from '../font-info.ts';

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const flush = async () => { await new Promise(resolve => setImmediate(resolve)); };

const browser = (t, manifest, fontForUrl = () => 'ygo-sc') => {
  const originals = new Map(['document', 'FontFace', 'fetch'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const faces = [];
  const fontRequests = [];
  let requests = 0;
  const fonts = new Set();
  globalThis.document = { baseURI: 'http://localhost/app/', fonts };
  globalThis.FontFace = class {
    constructor(family, source) {
      this.family = family;
      this.source = source;
      this.loading = deferred();
      faces.push(this);
    }
    load() { return this.loading.promise; }
  };
  globalThis.fetch = async url => {
    if (String(url).endsWith('.woff2')) {
      fontRequests.push(String(url));
      const data = fs.readFileSync(path.resolve(`src/assets/yugioh-card/yugioh/font/${fontForUrl(String(url))}.woff2`));
      return { ok: true, arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) };
    }
    requests++;
    return manifest();
  };
  t.after(() => {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return { faces, fonts, fontRequests, get requests() { return requests; } };
};

test('cards share on-demand font requests and leave unused families idle until explicitly preloaded', async t => {
  const env = browser(t, async () => ({ ok: true, json: async () => ['ygo-jp', 'ygo-tip'] }));
  t.after(() => env.faces.forEach(face => face.loading.resolve()));
  const resource = getBrowserCardFonts('./fonts');
  const sibling = getBrowserCardFonts('http://localhost/app/fonts/');
  await resource.promise;
  assert.equal(resource, sibling);
  assert.equal(env.requests, 1);
  assert.deepEqual(env.fontRequests, []);

  const first = resource.requestFont('ygo-jp', false);
  assert.equal(sibling.requestFont('ygo-jp', true), first);
  await flush();
  assert.deepEqual(env.fontRequests, ['http://localhost/app/fonts/ygo-jp.woff2']);
  env.faces[0].loading.reject(new Error('Font request failed'));
  await assert.rejects(first.promise, { resourceType: 'font' });
  assert.equal(sibling.requestFont('ygo-jp', false), first);
  const retried = sibling.requestFont('ygo-jp', true);
  assert.notEqual(retried, first);
  assert.equal(resource.fonts.get('ygo-tip').status, 'idle');

  const preloaded = getBrowserFontResource('./fonts', true);
  assert.equal(preloaded, resource);
  assert.equal(preloaded.fonts.get('ygo-jp'), retried);
  await flush();
  assert.deepEqual(env.fontRequests.map(url => url.split('/').at(-1)), ['ygo-jp.woff2', 'ygo-jp.woff2', 'ygo-tip.woff2']);
  env.faces.slice(1).forEach(face => face.loading.resolve());
  await preloaded.promise;
  assert.equal(retried.status, 'loaded');
  assert.equal(preloaded.fonts.get('ygo-tip').status, 'loaded');
});

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

for (const order of [[0, 1], [1, 0]]) {
  test(`same-family metadata follows successful registration order ${order.join(' → ')}`, async t => {
    const env = browser(t, async () => ({ ok: true, json: async () => ['shared-font'] }), url => url.includes('/fonts-a/') ? 'ygo-jp' : 'ygo-sc');
    const resources = [getBrowserFontResource('/fonts-a'), getBrowserFontResource('/fonts-b')];
    const notified = [];
    const unsubscribe = subscribeFontChanges(event => {
      const face = event.fontfaces[0];
      assert.ok(getLoadedFontEntry(face.family)?.face === face, 'notification observes the font that was just registered');
      notified.push(face);
    });
    t.after(() => {
      unsubscribe();
      env.faces.forEach(face => face.loading.resolve());
    });
    await flush();
    assert.equal(getLoadedFontEntry('shared-font'), null);
    for (const index of order) {
      env.faces[index].loading.resolve();
      await resources[index].promise;
      const entry = resources[index].fonts.get('shared-font');
      assert.ok(getLoadedFontEntry('SHARED-FONT') === entry);
      assert.equal([...env.fonts].at(-1), entry.face);
      assert.equal(getFontInfo(entry).unitsPerEm, index === 0 ? 1024 : 1000);
    }
    assert.deepEqual(notified, order.map(index => env.faces[index]));
    getBrowserFontResource(order.at(-1) === 0 ? '/fonts-b' : '/fonts-a');
    assert.equal(getLoadedFontEntry('shared-font'), resources[order.at(-1)].fonts.get('shared-font'), 'a cache hit does not register a face again');
  });
}

test('pending and failed replacement fonts keep the previous successful metadata until retry succeeds', async t => {
  const env = browser(t, async () => ({ ok: true, json: async () => ['shared-font'] }));
  t.after(() => env.faces.forEach(face => face.loading.resolve()));
  const original = getBrowserFontResource('/original-font');
  await flush();
  env.faces[0].loading.resolve();
  await original.promise;
  const previous = original.fonts.get('shared-font');
  const replacement = getBrowserFontResource('/replacement-font');
  await flush();
  assert.equal(getLoadedFontEntry('shared-font'), previous, 'pending replacement preserves the font still used for drawing');
  env.faces[1].loading.reject(new Error('Replacement failed'));
  await replacement.promise;
  assert.equal(getLoadedFontEntry('shared-font'), previous);
  assert.deepEqual([...env.fonts], [previous.face]);
  const retry = getBrowserFontResource('/replacement-font', true);
  await flush();
  assert.equal(getLoadedFontEntry('shared-font'), previous);
  env.faces[2].loading.resolve();
  await retry.promise;
  assert.equal(getLoadedFontEntry('shared-font'), retry.fonts.get('shared-font'));
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

test('mixed-case manifest spelling is preserved in font registration and retry URLs', async t => {
  const env = browser(t, async () => ({ ok: true, json: async () => ['MiXeD-Font'] }));
  const first = getBrowserFontResource('/mixed-case');
  await flush();
  assert.equal(env.faces[0].family, 'MiXeD-Font');
  assert.equal(env.fontRequests[0], 'http://localhost/mixed-case/MiXeD-Font.woff2');
  assert.ok(env.faces[0].source instanceof ArrayBuffer);
  env.faces[0].loading.reject(new Error('Retry this font'));
  await first.promise;
  const next = getBrowserFontResource('/mixed-case', true);
  await flush();
  assert.equal(env.faces[1].family, env.faces[0].family);
  assert.equal(env.fontRequests[1], env.fontRequests[0]);
  assert.deepEqual(new Uint8Array(env.faces[1].source), new Uint8Array(env.faces[0].source));
  env.faces[1].loading.resolve();
  await next.promise;
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
