import type { ILeafer, ILeaferInputData, IRect } from '@leafer-ui/interface';
import { Text, Leafer, useCanvas } from 'leafer-unified';
import { isBrowser, isNode } from '../utils/index.ts';
import { getBrowserCardFonts, getNodeFontResource, type SkiaCanvas } from '../utils/font-loader.ts';
import { CardReadiness } from './readiness.ts';

const fontPathMap: Partial<Record<string, string>> = {
  YugiohCard: '/yugioh/font',
  YugiohSeries2Card: '/yugioh/font',
  RushDuelCard: '/rush-duel/font',
};

const resetAttr = () => {
  Text.changeAttr('lineHeight', {
    type: 'percent',
    value: 1.15,
  });
};

export interface CardOptions<TData extends object = object> {
  /** Leafer 画布或容器，Node 中可省略。 */
  view?: ILeaferInputData['view'];
  data?: Partial<TData>;
  resourcePath?: string;
  skia?: SkiaCanvas;
  /** 每轮 ready 的超时毫秒数，默认 30000。 */
  readyTimeout?: number;
}

export class Card<TData extends object = object> {
  leafer: ILeafer | null = null;
  declare artworkNode?: IRect | null;
  cardWidth = 100;
  cardHeight = 100;
  data = {} as TData;
  view: CardOptions<TData>['view'] | null = null;
  resourcePath: CardOptions<TData>['resourcePath'] | null = null;
  skia: SkiaCanvas | null | undefined = null;
  private _readiness: CardReadiness;

  constructor(data: CardOptions<TData> = {}) {
    this.view = data.view;
    this.resourcePath = data.resourcePath;
    this.skia = data.skia;
    resetAttr();

    if (isNode) {
      if (!this.skia) {
        throw new Error('skia-canvas is required in Node environment');
      }
      useCanvas('skia', this.skia);
    }

    const fontPath = fontPathMap[(this as { tag?: string }).tag ?? ''];
    this._readiness = new CardReadiness(this, retry => {
      if (!fontPath) return null;
      const path = `${this.resourcePath}${fontPath}`;
      return isNode ? getNodeFontResource(path, this.skia!) : getBrowserCardFonts(path, retry);
    }, data.readyTimeout);
  }

  /**
   * 当前更新周期的资源、最终排版和渲染全部成功后完成。
   * @returns {Promise<void>}
   */
  get ready() {
    return this._readiness.promise;
  }

  setData(data: Partial<TData> = {}) {
    const patch = Object(data) as Partial<TData>;
    for (const key of Reflect.ownKeys(patch) as (keyof TData)[]) {
      if (!Object.prototype.propertyIsEnumerable.call(patch, key)) continue;
      const value = patch[key];
      if (value !== undefined) this.data[key] = value;
    }
    this._readiness.update();
  }

  initLeafer() {
    try {
      this.leafer = new Leafer({
        view: this.view ?? undefined,
        width: this.cardWidth,
        height: this.cardHeight,
      });
    } catch (error) {
      this._readiness.finish(error);
      this._readiness.destroy();
      throw error;
    }
  }

  draw() {
    // need to be overridden
  }

  applyCardScale() {
    const pixelRatio = isBrowser ? devicePixelRatio : 1;
    const { renderScale } = this.data as TData & { renderScale: number };
    const leafer = this.leafer!;
    leafer.pixelRatio = pixelRatio;
    leafer.width = this.cardWidth * renderScale / pixelRatio;
    leafer.height = this.cardHeight * renderScale / pixelRatio;
    leafer.scaleX = renderScale / pixelRatio;
    leafer.scaleY = renderScale / pixelRatio;
  }
}
