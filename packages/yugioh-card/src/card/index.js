import cloneDeep from 'lodash/cloneDeep';
import { AnimateEvent, Image, ImageEvent, Leafer } from 'leafer-ui';
import { loadCSS } from '../utils';
import loaderIcon from '../svg/loader.svg';
import imageIcon from '../svg/image.svg';

export class Card {
  constructor(data = {}) {
    this.leafer = null;
    this.imageStatusLeaf = null;
    this.imageStatusEvent = null;
    this.cardWidth = 100;
    this.cardHeight = 100;
    this.key = 0;
    this.data = {};
    this.defaultData = {};

    this.view = data.view;
    this.resourcePath = data.resourcePath;

    loadCSS(`${this.resourcePath}/custom-font/custom-font.css`);
    loadCSS(`${this.resourcePath}/yugioh/font/ygo-font.css`);
    loadCSS(`${this.resourcePath}/rush-duel/font/rd-font.css`);
  }

  setData(data = {}) {
    data = cloneDeep(data);
    let needDraw = false;
    let needLoadFont = false;
    Object.keys(data).forEach(key => {
      const value = data[key] ?? this.defaultData[key];
      if (JSON.stringify(this.data[key]) !== JSON.stringify(value)) {
        this.data[key] = value;
        if (['language', 'font'].includes(key)) {
          needLoadFont = true;
        }
        needDraw = true;
      }
    });
    if (needDraw) {
      this.initDraw();
    }
    // 先触发绘制，再触发字体加载
    if (needLoadFont) {
      this.loadFont();
    }
  }

  loadFont() {
    document.fonts.ready.finally(() => {
      this.key++;
      this.initDraw();
    });
  }

  initData(data = {}) {
    this.setData(Object.assign(this.defaultData, data));
  }

  initLeafer() {
    this.leafer = new Leafer({
      view: this.view,
      width: this.cardWidth,
      height: this.cardHeight,
      usePartRender: false,
      hittable: false,
    });
  }

  initDraw() {
    // 需要重写Override
  }

  listenImageStatus(imageLeaf) {
    // todo 监听loading
    imageLeaf.on(ImageEvent.LOADED, () => {
      this.drawImageStatus(imageLeaf, ImageEvent.LOADED);
    });
    imageLeaf.on(ImageEvent.ERROR, () => {
      this.drawImageStatus(imageLeaf, ImageEvent.ERROR);
    });
  }

  drawImageStatus(imageLeaf, status) {
    const { url, width, height, x, y, zIndex } = imageLeaf;
    if (!this.imageStatusLeaf) {
      this.imageStatusLeaf = new Image();
      this.leafer.add(this.imageStatusLeaf);
    }

    let statusUrl = '';
    if (status === 'loading') {
      statusUrl = loaderIcon;
    } else if (status === ImageEvent.ERROR) {
      statusUrl = imageIcon;
    }

    this.imageStatusLeaf.set({
      url: statusUrl,
      width: 120,
      height: 120,
      x: x + width / 2 - 60,
      y: y + height / 2 - 60,
      visible: ['loading', ImageEvent.ERROR].includes(status) && url,
      zIndex: zIndex + 1,
    });

    if (status === 'loading') {
      this.imageStatusEvent = this.leafer.on_(AnimateEvent.FRAME, () => {
        this.imageStatusLeaf.rotateOf({ x: 60, y: 60 }, 3);
      });
    } else {
      this.imageStatusLeaf.rotateOf({ x: 60, y: 60 }, 0 - this.imageStatusLeaf.rotation);
      this.leafer.off_(this.imageStatusEvent);
    }
    console.log(status);
  }

  updateScale() {
    this.leafer.width = this.cardWidth * this.data.scale / devicePixelRatio;
    this.leafer.height = this.cardHeight * this.data.scale / devicePixelRatio;
    this.leafer.scaleX = this.data.scale / devicePixelRatio;
    this.leafer.scaleY = this.data.scale / devicePixelRatio;
  }
}
