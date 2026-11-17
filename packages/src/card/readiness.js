import { LeaferEvent } from 'leafer-unified';
import { withTextLayoutContext } from '../compress-text/layout-context.js';
import { fontFamilyKey, getLoadedFontEntry, subscribeFontChanges } from '../utils/font-loader.js';
import { defaultResourceTimeout, readyError, resourceError } from '../utils/resource-error.js';
import { CardImages, collectResources } from './resources.js';

const projectFont = /^(?:ygo-|rd-|custom[12]$)/;

/** 资源可以共享；就绪周期、最终排版及视图等待只属于当前卡片。 */
export class CardReadiness {
  revision = 0;
  fontVersion = 0;
  loadedFonts = new Map();
  pending = false;
  disposed = false;
  queued = false;
  cancelView = null;
  unsubscribeFonts = null;
  unsubscribeFontChanges = null;

  constructor(card, getFonts, timeout = defaultResourceTimeout) {
    if (!Number.isFinite(timeout) || timeout <= 0) throw new RangeError('readyTimeout must be a positive finite number');
    this.card = card;
    this.getFonts = getFonts;
    this.timeout = timeout;
    this.images = new CardImages(card, () => this.schedule());
    this.setFonts(getFonts(true));
    this.begin();
  }

  setFonts(resource) {
    if (this.fonts === resource) return;
    this.unsubscribeFonts?.();
    this.unsubscribeFontChanges?.();
    this.fonts = resource;
    this.unsubscribeFonts = resource?.subscribe(() => this.schedule());
    this.unsubscribeFontChanges = resource?.fontOwner && subscribeFontChanges(({ families }) => {
      if (this.disposed || !this.hasDrawn) return;
      const changed = new Set(families.map(fontFamilyKey));
      if (![...this.families].some(family => changed.has(fontFamilyKey(family)))) return;
      // 其他资源目录也可能替换同名字体；已就绪的卡片需要新的排版与绘制周期。
      if (!this.pending) this.begin();
      this.revision++;
      this.cancelView?.();
      this.schedule();
    }, resource.fontOwner);
  }

  begin() {
    this.pending = true;
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    // 不读取 ready 的旧调用方也不会遇到未处理的拒绝；对外仍暴露原 Promise。
    this.promise.catch(() => {});
    this.timer = setTimeout(() => this.finish(readyError('READY_TIMEOUT', `Card readiness timed out after ${this.timeout}ms`)), this.timeout);
  }

  attach() {
    if (this.leafer === this.card.leafer) return;
    this.leafer = this.card.leafer;
    this.leafer.on(LeaferEvent.END, () => this.destroy());
  }

  update() {
    if (this.disposed) throw readyError('CARD_DESTROYED', 'Cannot update a destroyed card');
    this.attach();
    const retry = !this.pending;
    if (retry) {
      this.setFonts(this.getFonts(true));
      this.begin();
    }
    this.revision++;
    this.cancelView?.();
    const initial = !this.hasDrawn;
    try {
      this.draw();
      this.images.sync(retry || initial, this.imageRequirements);
    } catch (error) {
      this.finish(error);
      // 构造失败时调用方拿不到实例，必须在这里释放本卡资源。
      if (initial) {
        this.destroy();
        this.leafer.destroy(true);
      }
      throw error;
    }
    this.schedule();
  }

  currentFonts() {
    const loaded = new Map();
    for (const [family, entry] of this.fonts?.fonts ?? []) {
      // 资源记录只决定必需依赖；度量必须来自当前绘制环境中实际注册的字体。
      const current = this.fonts.fontOwner ? getLoadedFontEntry(family, this.fonts.fontOwner) : entry;
      if (current?.status === 'loaded') loaded.set(family, current);
    }
    return loaded;
  }

  draw() {
    const loaded = this.currentFonts();
    const changed = loaded.size !== this.loadedFonts.size || [...loaded].some(([family, entry]) => this.loadedFonts.get(family) !== entry);
    if (this.hasDrawn && changed) {
      this.fontVersion++;
      // 普通 Text 也会缓存测量；CompressText 的子节点会在 set 中按字体版本重建。
      const invalidate = node => {
        if (node.tag === 'Text') node.forceUpdate('fontFamily');
        node.children?.forEach(invalidate);
      };
      this.card.leafer.children.forEach(invalidate);
    }
    withTextLayoutContext({ fontVersion: this.fontVersion, loadedFonts: loaded }, () => this.card.draw());
    this.loadedFonts = loaded;
    this.hasDrawn = true;
    const resources = collectResources(this.card);
    this.families = resources.fonts;
    this.imageRequirements = resources.images;
  }

  schedule() {
    if (this.disposed || !this.pending || this.queued) return;
    this.queued = true;
    queueMicrotask(() => {
      this.queued = false;
      if (this.disposed || !this.pending) return;
      try {
        this.check();
      } catch (error) {
        this.finish(error);
      }
    });
  }

  requiredFonts() {
    if (!this.fonts) return [];
    if (this.fonts.status === 'failed') throw this.fonts.error;
    if (this.fonts.status !== 'loaded') return null;
    const required = [];
    const available = new Map([...this.fonts.fonts].map(([family, entry]) => [fontFamilyKey(family), [family, entry]]));
    for (const family of this.families) {
      const key = fontFamilyKey(family);
      const match = available.get(key);
      if (match) {
        const [, entry] = match;
        if (entry.status === 'failed') throw entry.error;
        required.push(match);
      } else if (projectFont.test(key)) {
        throw resourceError('font', `${this.fonts.path}/${family}.woff2`, new Error('Font is missing from font-list.json'));
      }
    }
    return required;
  }

  check() {
    const required = this.requiredFonts();
    let imagesPending = false;
    // 先检查所有已知失败，避免被仍在加载的字体或其他图片遮蔽。
    for (const record of this.images.records.values()) {
      if (record.status === 'failed') throw record.error;
      if (record.status !== 'loaded') imagesPending = true;
    }
    if (!required || required.some(([, entry]) => entry.status !== 'loaded')) return;
    const loaded = this.currentFonts();
    if (required.some(([family]) => this.loadedFonts.get(family) !== loaded.get(family))) {
      this.cancelView?.();
      this.draw();
      this.images.sync(false, this.imageRequirements);
      // 重排可能产生新的依赖，下一轮重新检查。
      this.schedule();
      return;
    }
    if (imagesPending) return;
    if (!this.cancelView) this.waitForView();
  }

  waitForView() {
    const revision = this.revision;
    let rendered = false;
    let framePending = true;
    let cancelled = false;
    const cleanup = () => {
      cancelled = true;
      this.leafer.off(LeaferEvent.VIEW_COMPLETED, completed);
      // Leafer 遍历 nextRender 队列时不能原地删项，延至本轮事件之后移除。
      if (framePending) queueMicrotask(() => {
        if (framePending && !this.disposed) this.leafer.nextRender(frame, undefined, 'off');
      });
      this.cancelView = null;
    };
    const completed = () => {
      if (cancelled || !rendered || this.disposed || !this.pending || revision !== this.revision || !this.leafer.imageReady) return;
      cleanup();
      this.finish();
    };
    const frame = () => {
      framePending = false;
      rendered = true;
      completed();
    };
    this.cancelView = cleanup;
    this.leafer.on(LeaferEvent.VIEW_COMPLETED, completed);
    // 即使 imageReady 原来为 true，也必须跨过当前 draw 之后的一次实际渲染。
    this.leafer.nextRender(frame);
  }

  finish(error) {
    if (!this.pending) return;
    this.pending = false;
    clearTimeout(this.timer);
    this.cancelView?.();
    if (error) this.reject(error);
    else this.resolve();
  }

  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    this.finish(readyError('CARD_DESTROYED', 'Card was destroyed before it became ready'));
    this.unsubscribeFonts?.();
    this.unsubscribeFontChanges?.();
    this.images.destroy();
    this.imageRequirements?.clear();
  }
}
