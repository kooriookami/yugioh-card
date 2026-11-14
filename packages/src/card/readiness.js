import { LeaferEvent } from 'leafer-unified';
import { withTextLayoutContext } from '../compress-text/layout-context.js';
import { defaultResourceTimeout, readyError, resourceError } from '../utils/resource-error.js';
import { CardImages, collectFonts } from './resources.js';

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
    this.fonts = resource;
    this.unsubscribeFonts = resource?.subscribe(() => this.schedule());
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
    try {
      const initial = !this.hasDrawn;
      this.draw();
      this.images.sync(retry || initial);
    } catch (error) {
      this.finish(error);
      throw error;
    }
    this.schedule();
  }

  draw() {
    const loaded = new Map([...(this.fonts?.fonts ?? [])].filter(([, entry]) => entry.status === 'loaded'));
    const changed = [...loaded].some(([family, entry]) => this.loadedFonts.get(family) !== entry);
    if (this.hasDrawn && changed) {
      this.fontVersion++;
      // 普通 Text 也会缓存测量；CompressText 的子节点会在 set 中按字体版本重建。
      const invalidate = node => {
        if (node.tag === 'Text') node.forceUpdate('fontFamily');
        node.children?.forEach(invalidate);
      };
      this.card.leafer.children.forEach(invalidate);
    }
    withTextLayoutContext({ fontVersion: this.fontVersion }, () => this.card.draw());
    this.loadedFonts = loaded;
    this.hasDrawn = true;
    this.families = collectFonts(this.card);
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
    for (const family of this.families) {
      const entry = this.fonts.fonts.get(family);
      if (entry) {
        if (entry.status === 'failed') throw entry.error;
        required.push([family, entry]);
      } else if (projectFont.test(family)) {
        throw resourceError('font', `${this.fonts.path}/${family}.woff2`, new Error('Font is missing from font-list.json'));
      }
    }
    return required;
  }

  check() {
    const required = this.requiredFonts();
    if (!required || required.some(([, entry]) => entry.status !== 'loaded')) return;
    if (required.some(([family, entry]) => this.loadedFonts.get(family) !== entry)) {
      this.cancelView?.();
      this.draw();
      this.images.sync();
      // 重排可能产生新的依赖，下一轮重新检查。
      this.schedule();
      return;
    }
    for (const record of this.images.records.values()) {
      if (record.status === 'failed') throw record.error;
      if (record.status !== 'loaded') return;
    }
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
    this.images.destroy();
  }
}
