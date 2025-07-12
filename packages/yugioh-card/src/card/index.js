import { Text, Image, ImageEvent, Leafer } from 'leafer';
import { loadFont } from '../utils';
import loaderIcon from '../svg/loader.svg';
import imageIcon from '../svg/image.svg';

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
    Promise.allSettled([
      loadFont(`${this.resourcePath}/yugioh/font`),
      loadFont(`${this.resourcePath}/rush-duel/font`),
    ]).then(() => {
      document.fonts.ready.then(() => {
        setTimeout(() => {
          this.draw();
        }, 50);
      });
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
    this.leafer.pixelRatio = devicePixelRatio;
    this.leafer.width = this.cardWidth * this.data.scale / devicePixelRatio;
    this.leafer.height = this.cardHeight * this.data.scale / devicePixelRatio;
    this.leafer.scaleX = this.data.scale / devicePixelRatio;
    this.leafer.scaleY = this.data.scale / devicePixelRatio;
  }
}
