import { Text, Image, ImageEvent, Leafer, useCanvas } from 'leafer-unified';
import { isBrowser, isNode } from '../utils/index.js';
import { getBrowserFontResource, getNodeFontResource } from '../utils/font-loader.js';
import loaderIconUrl from '../svg/loader.js';
import imageIconUrl from '../svg/image.js';
import { CardReadiness } from './readiness.js';

const fontPathMap = {
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

/**
 * @typedef {object} CardOptions
 * @property {*} [view] Leafer 画布或容器；Node 中可省略。
 * @property {object} [data] 卡片数据。
 * @property {string} [resourcePath] 静态资源根目录。
 * @property {*} [skia] Node 的 skia-canvas 模块。
 * @property {number} [readyTimeout=30000] 每轮 ready 的超时毫秒数。
 */

export class Card {
  leafer = null;
  imageStatusLeaf = null;
  cardWidth = 100;
  cardHeight = 100;
  data = {};
  view = null;
  resourcePath = null;
  skia = null;
  /** @private */
  _readiness;

  /** @param {CardOptions} [data={}] */
  constructor(data = {}) {
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

    const fontPath = fontPathMap[this.tag];
    this._readiness = new CardReadiness(this, retry => {
      if (!fontPath) return null;
      const path = `${this.resourcePath}${fontPath}`;
      return isNode ? getNodeFontResource(path, this.skia) : getBrowserFontResource(path, retry);
    }, data.readyTimeout);
  }

  /**
   * 当前更新周期的资源、最终排版和渲染全部成功后完成。
   * @returns {Promise<void>}
   */
  get ready() {
    return this._readiness.promise;
  }

  setData(data = {}) {
    Object.assign(this.data, data);
    this._readiness.update();
  }

  initLeafer() {
    try {
      this.leafer = new Leafer({
        view: this.view,
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

  listenImageStatus(imageLeaf) {
    if (isNode) {
      return;
    }
    imageLeaf.on(ImageEvent.LOAD, () => {
      this.drawImageStatus(imageLeaf, ImageEvent.LOAD);
    });
    imageLeaf.on(ImageEvent.LOADED, () => {
      this.drawImageStatus(imageLeaf, ImageEvent.LOADED);
    });
    imageLeaf.on(ImageEvent.ERROR, () => {
      this.drawImageStatus(imageLeaf, ImageEvent.ERROR);
    });
  }

  drawImageStatus(imageLeaf, status) {
    const { width, height, x, y, zIndex } = imageLeaf;
    const url = imageLeaf.url || imageLeaf.fill?.url;
    if (!this.imageStatusLeaf) {
      this.imageStatusLeaf = new Image();
      this.leafer.add(this.imageStatusLeaf);
    }

    let statusUrl = '';
    if (status === ImageEvent.LOAD) {
      statusUrl = loaderIconUrl;
    } else if (status === ImageEvent.ERROR) {
      statusUrl = imageIconUrl;
    }

    this.imageStatusLeaf.set({
      url: statusUrl,
      width: 120,
      height: 120,
      around: 'center',
      x: x + width / 2,
      y: y + height / 2,
      visible: [ImageEvent.LOAD, ImageEvent.ERROR].includes(status) && url,
      zIndex: zIndex + 1,
    });
  }

  updateScale() {
    const pixelRatio = isBrowser ? devicePixelRatio : 1;
    this.leafer.pixelRatio = pixelRatio;
    this.leafer.width = this.cardWidth * this.data.scale / pixelRatio;
    this.leafer.height = this.cardHeight * this.data.scale / pixelRatio;
    this.leafer.scaleX = this.data.scale / pixelRatio;
    this.leafer.scaleY = this.data.scale / pixelRatio;
  }
}
