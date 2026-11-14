import { Resource } from 'leafer-unified';
import { loadWithTimeout, resourceError } from './resource-error.js';

const browserCaches = new WeakMap();
const nodeCaches = new WeakMap();

export const fontFamilies = value => String(value || '').split(',').map(name => name.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);

const cacheFor = (caches, owner) => {
  if (!caches.has(owner)) caches.set(owner, new Map());
  return caches.get(owner);
};

const validateManifest = families => {
  if (!Array.isArray(families) || families.some(family => typeof family !== 'string' || !family || /[/\\]/.test(family))) {
    throw new Error('Invalid font manifest');
  }
  return [...new Set(families)];
};

const createResource = path => {
  const listeners = new Set();
  return {
    path,
    status: 'loading',
    error: null,
    fonts: new Map(),
    promise: null,
    subscribe(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    notify() {
      for (const callback of listeners) callback();
    },
  };
};

const loadBrowserFace = (resource, family, fontSet) => {
  const url = `${resource.path}/${family}.woff2`;
  const entry = { status: 'loading', error: null, promise: null, face: null };
  resource.fonts.set(family, entry);
  entry.promise = loadWithTimeout(async () => {
    const face = entry.face = new FontFace(family, `url(${url}) format('woff2')`, { display: 'swap' });
    fontSet.add(face);
    await face.load();
  }, url).then(() => {
    entry.status = 'loaded';
  }, cause => {
    entry.status = 'failed';
    entry.error = resourceError('font', url, cause);
    if (entry.face) fontSet.delete(entry.face);
    throw entry.error;
  }).finally(() => resource.notify());
  entry.promise.catch(() => {});
};

const createBrowserResource = (path, fontSet, previous) => {
  const resource = createResource(path);
  const abort = new AbortController();
  resource.promise = (async () => {
    if (previous?.status === 'loaded') {
      for (const [family, entry] of previous.fonts) {
        if (entry.status === 'failed') loadBrowserFace(resource, family, fontSet);
        else {
          resource.fonts.set(family, entry);
          if (entry.status === 'loading') entry.promise.then(() => resource.notify(), () => resource.notify());
        }
      }
    } else {
      const families = await loadWithTimeout(async () => {
        const response = await fetch(`${path}/font-list.json`, { signal: abort.signal });
        if (!response.ok) throw new Error(`Font manifest returned HTTP ${response.status}`);
        return validateManifest(await response.json());
      }, `${path}/font-list.json`, () => abort.abort());
      for (const family of families) loadBrowserFace(resource, family, fontSet);
    }
    resource.status = 'loaded';
    resource.notify();
    await Promise.allSettled([...resource.fonts.values()].map(entry => entry.promise));
  })().catch(cause => {
    resource.status = 'failed';
    resource.error = resourceError('font manifest', `${path}/font-list.json`, cause);
    resource.notify();
    throw resource.error;
  });
  resource.promise.catch(() => {});
  // 这里只登记资源获取，不在全局资源任务里等待排版或视图，避免循环等待。
  Resource.tasker.add(async () => { await resource.promise.catch(() => {}); });
  return resource;
};

/** 获取共享的浏览器字体资源记录；retry 只在调用方发起新一轮失败重试时使用。 */
export const getBrowserFontResource = (fontPath, retry = false) => {
  const fontSet = document.fonts;
  const path = new URL(`${fontPath.replace(/\/$/, '')}/`, document.baseURI).href.replace(/\/$/, '');
  const cache = cacheFor(browserCaches, fontSet);
  let resource = cache.get(path);
  if (!resource || (retry && (resource.status === 'failed' || [...resource.fonts.values()].some(entry => entry.status === 'failed')))) {
    resource = createBrowserResource(path, fontSet, resource);
    cache.set(path, resource);
  }
  return resource;
};

/** Node 字体保持同步注册，缓存按 FontLibrary 作用域区分。 */
export const getNodeFontResource = (fontPath, skia) => {
  const fs = process.getBuiltinModule('node:fs');
  const path = process.getBuiltinModule('node:path').resolve(fontPath);
  const cache = cacheFor(nodeCaches, skia.FontLibrary);
  if (cache.has(path)) return cache.get(path);
  const resource = createResource(path);
  for (const family of validateManifest(JSON.parse(fs.readFileSync(`${path}/font-list.json`, 'utf8')))) {
    skia.FontLibrary.use(family, [`${path}/${family}.woff2`]);
    resource.fonts.set(family, { status: 'loaded', error: null, promise: Promise.resolve() });
  }
  resource.status = 'loaded';
  resource.promise = Promise.resolve();
  cache.set(path, resource);
  return resource;
};

export const loadFontBrowser = fontPath => getBrowserFontResource(fontPath, true).promise;

export const loadFontNode = (fontPath, skia) => {
  getNodeFontResource(fontPath, skia);
};
