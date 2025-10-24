import { Text, Image, ImageEvent, Leafer, useCanvas } from 'leafer-unified';
import skia from 'skia-canvas';
import { isBrowser, isNode, loadFont } from '../utils';
import loaderIcon from '../svg/loader.svg';
import imageIcon from '../svg/image.svg';

if (isNode) {
  useCanvas('skia', skia);
}

const fontPathMap = {
  YugiohCard: '/yugioh/font',
  YugiohSeries2Card: '/yugioh/font',
  RushDuelCard: '/rush-duel/font',
};

export function resetAttr() {
  Text.changeAttr('lineHeight', {
    type: 'percent',
    value: 1.15,
  });
}

export class Card {
  leafer = null;
  imageStatusLeaf = null;
  cardWidth = 100;
  cardHeight = 100;
  data = {};
  view = null;
  resourcePath = null;

  constructor(data = {}) {
    this.view = data.view;
    this.resourcePath = data.resourcePath;
    resetAttr();

    const loadFontList = [];
    const fontPath = fontPathMap[this.tag];
    if (fontPath) {
      loadFontList.push(loadFont(`${this.resourcePath}${fontPath}`));
    }
    Promise.allSettled(loadFontList).then(() => {
      this.draw();
    });
  }

  setData(data = {}) {
    Object.assign(this.data, data);
    this.draw();
  }

  initLeafer() {
    this.leafer = new Leafer({
      view: this.view,
      width: this.cardWidth,
      height: this.cardHeight,
    });
  }

  draw() {
    // need to be overridden
  }

  listenImageStatus(imageLeaf) {
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
    const { url, width, height, x, y, zIndex } = imageLeaf;
    if (!this.imageStatusLeaf) {
      this.imageStatusLeaf = new Image();
      this.leafer.add(this.imageStatusLeaf);
    }

    let statusUrl = '';
    if (status === ImageEvent.LOAD) {
      statusUrl = loaderIcon;
    } else if (status === ImageEvent.ERROR) {
      statusUrl = imageIcon;
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
