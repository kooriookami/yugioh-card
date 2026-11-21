import { Resource } from 'leafer-unified';
import { loadWithTimeout, resourceError, type ResourceError } from './resource-error.ts';

interface SkiaFontLibrary {
  use(family: string, files: string[]): unknown;
}

export interface SkiaCanvas {
  Canvas: new (width: number, height: number) => unknown;
  FontLibrary: SkiaFontLibrary;
}

type FontOwner = FontFaceSet | SkiaFontLibrary;
type FontStatus = 'loading' | 'loaded' | 'failed';
type FontListener = (event: { families: string[]; fontfaces: FontFace[] }) => void;

export interface FontEntry {
  status: FontStatus | 'idle';
  error: ResourceError | null;
  promise: Promise<void> | null;
  face?: FontFace | null;
  fontData?: Uint8Array;
}

export interface FontResource {
  path: string;
  fontOwner: FontOwner;
  status: FontStatus;
  error: ResourceError | null;
  fonts: Map<string, FontEntry>;
  promise: Promise<void> | null;
  requestFont?(family: string, retry: boolean): FontEntry | undefined;
  subscribe(callback: () => void): () => boolean;
  notify(): void;
}

interface BrowserFontResource extends FontResource {
  requestFont(family: string, retry: boolean): FontEntry | undefined;
  preload(retry: boolean): void;
}

const browserCaches = new WeakMap<FontFaceSet, Map<string, BrowserFontResource>>();
const nodeCaches = new WeakMap<SkiaFontLibrary, Map<string, FontResource>>();
const registeredFonts = new WeakMap<FontOwner, Map<string, FontEntry>>();
const fontListeners = new WeakMap<FontOwner, Set<FontListener>>();
let nodeFontOwner: SkiaFontLibrary | undefined;

const registerFont = (owner: FontOwner, family: string, entry: FontEntry) => {
  const fonts = cacheFor(registeredFonts, owner);
  if (fonts.get(fontFamilyKey(family)) === entry) return;
  fonts.set(fontFamilyKey(family), entry);
  for (const listener of fontListeners.get(owner) ?? []) {
    listener({ families: [family], fontfaces: entry.face ? [entry.face] : [] });
  }
};

/** 内部排版使用加载器登记的字体身份，不以 fonts.check 推断 fallback。 */
export const getLoadedFontEntry = (family: string | undefined, owner: FontOwner | undefined = typeof document !== 'undefined' ? document.fonts : nodeFontOwner) => {
  if (!owner) return null;
  const entry = registeredFonts.get(owner)?.get(fontFamilyKey(family));
  if (entry?.status !== 'loaded') return null;
  if (entry.face && !(owner as FontFaceSet).has(entry.face)) return null;
  return entry;
};

/** 卡片与独立 CompressText 共享实际字体注册变化，按绘制环境隔离。 */
export const subscribeFontChanges = (callback: FontListener, owner: FontOwner = document.fonts) => {
  let listeners = fontListeners.get(owner);
  if (!listeners) {
    listeners = new Set<FontListener>();
    fontListeners.set(owner, listeners);
  }
  listeners.add(callback);
  return () => listeners.delete(callback);
};

export const fontFamilies = (value: unknown) => String(value || '').split(',').map(name => name.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
// 仅用于字体名比较；资源清单、文件名和 FontFace 注册名称保留原值。
export const fontFamilyKey = (value: unknown) => String(value || '').trim().replace(/^['"]|['"]$/g, '').toLowerCase();

const cacheFor = <Owner extends object, Value>(caches: WeakMap<Owner, Map<string, Value>>, owner: Owner) => {
  let cache = caches.get(owner);
  if (!cache) {
    cache = new Map<string, Value>();
    caches.set(owner, cache);
  }
  return cache;
};

const validateManifest = (families: unknown) => {
  if (!Array.isArray(families) || families.some(family => typeof family !== 'string' || !family || /[/\\]/.test(family))) {
    throw new Error('Invalid font manifest');
  }
  return [...new Set(families as string[])];
};

const createResource = (path: string, fontOwner: FontOwner): FontResource => {
  const listeners = new Set<() => void>();
  return {
    path,
    fontOwner,
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

const loadBrowserFace = (resource: FontResource, family: string, fontSet: FontFaceSet) => {
  const url = `${resource.path}/${family}.woff2`;
  const entry: FontEntry = { status: 'loading', error: null, promise: null, face: null };
  resource.fonts.set(family, entry);
  const abort = new AbortController();
  entry.promise = loadWithTimeout(async () => {
    // 同一份字节既交给浏览器绘制，也供按需读取 cmap/units；不重复下载。
    const response = await fetch(url, { signal: abort.signal, cache: 'no-cache' });
    if (!response.ok) throw new Error(`Font returned HTTP ${response.status}`);
    const data = await response.arrayBuffer();
    entry.fontData = new Uint8Array(data);
    const face = entry.face = new FontFace(family, data, { display: 'swap' });
    await face.load();
    if (entry.status === 'loading') fontSet.add(face);
  }, url, () => abort.abort()).then(() => {
    entry.status = 'loaded';
    // 跟随实际加入 FontFaceSet 的顺序，pending/失败的替换不覆盖正在使用的字体。
    registerFont(fontSet, family, entry);
  }, cause => {
    entry.status = 'failed';
    entry.error = resourceError('font', url, cause);
    if (entry.face) fontSet.delete(entry.face);
    throw entry.error;
  }).finally(() => resource.notify());
  entry.promise.catch(() => {});
  return entry;
};

const createBrowserResource = (path: string, fontSet: FontFaceSet): BrowserFontResource => {
  let preloadPromise: Promise<void> | undefined;
  const resource: BrowserFontResource = {
    ...createResource(path, fontSet),
    requestFont(family, retry) {
      const entry = this.fonts.get(family);
      if (entry?.status === 'idle' || (retry && entry?.status === 'failed')) {
        return loadBrowserFace(this, family, fontSet);
      }
      return entry;
    },
    preload(retry) {
      if (preloadPromise && !(retry && [...this.fonts.values()].some(entry => entry.status === 'failed'))) return;
      const requestAll = () => Promise.allSettled([...this.fonts.keys()].map(family => this.requestFont(family, retry)?.promise));
      const requested = this.status === 'loaded' ? requestAll() : manifest.then(requestAll);
      const promise = requested.then(() => {});
      preloadPromise = this.promise = promise;
      promise.catch(() => {});
      // 显式预加载供独立布局使用，卡片按各自的字体依赖等待。
      Resource.tasker.add(async () => { await promise.catch(() => {}); });
    },
  };
  const abort = new AbortController();
  const manifest = loadWithTimeout(async () => {
    const response = await fetch(`${path}/font-list.json`, { signal: abort.signal });
    if (!response.ok) throw new Error(`Font manifest returned HTTP ${response.status}`);
    return validateManifest(await response.json());
  }, `${path}/font-list.json`, () => abort.abort()).then(families => {
    for (const family of families) resource.fonts.set(family, { status: 'idle', error: null, promise: null });
    resource.status = 'loaded';
    resource.notify();
  }, cause => {
    resource.status = 'failed';
    resource.error = resourceError('font manifest', `${path}/font-list.json`, cause);
    resource.notify();
    throw resource.error;
  });
  resource.promise = manifest;
  manifest.catch(() => {});
  return resource;
};

/** 卡片只启动清单请求，完成首次绘制后再加载可见节点使用的字体。 */
export const getBrowserCardFonts = (fontPath: string, retry = false) => {
  const fontSet = document.fonts;
  const path = new URL(`${fontPath.replace(/\/$/, '')}/`, document.baseURI).href.replace(/\/$/, '');
  const cache = cacheFor(browserCaches, fontSet);
  let resource = cache.get(path);
  if (!resource || (retry && resource.status === 'failed')) {
    resource = createBrowserResource(path, fontSet);
    cache.set(path, resource);
  }
  return resource;
};

/** 独立布局可以显式预加载全部字体，复用卡片已请求的字体。 */
export const getBrowserFontResource = (fontPath: string, retry = false) => {
  const resource = getBrowserCardFonts(fontPath, retry);
  resource.preload(retry);
  return resource;
};

/** Node 字体保持同步注册，缓存按 FontLibrary 作用域区分。 */
export const getNodeFontResource = (fontPath: string, skia: SkiaCanvas) => {
  const fs = process.getBuiltinModule('node:fs');
  const path = process.getBuiltinModule('node:path').resolve(fontPath);
  const cache = cacheFor(nodeCaches, skia.FontLibrary);
  nodeFontOwner = skia.FontLibrary;
  // 命中资源缓存不会再次调用 FontLibrary.use，也不能覆盖实际注册的字体身份。
  const cached = cache.get(path);
  if (cached) return cached;
  const resource = createResource(path, skia.FontLibrary);
  for (const family of validateManifest(JSON.parse(fs.readFileSync(`${path}/font-list.json`, 'utf8')))) {
    skia.FontLibrary.use(family, [`${path}/${family}.woff2`]);
    const entry: FontEntry = { status: 'loaded', error: null, promise: Promise.resolve(), fontData: new Uint8Array(fs.readFileSync(`${path}/${family}.woff2`)) };
    resource.fonts.set(family, entry);
    registerFont(nodeFontOwner, family, entry);
  }
  resource.status = 'loaded';
  resource.promise = Promise.resolve();
  cache.set(path, resource);
  return resource;
};

export const loadFontBrowser = (fontPath: string) => getBrowserFontResource(fontPath, true).promise!;

export const loadFontNode = (fontPath: string, skia: SkiaCanvas) => {
  getNodeFontResource(fontPath, skia);
};
