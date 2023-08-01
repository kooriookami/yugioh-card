import { Card } from '../card';
import { Image } from 'leafer-ui';

export class FieldCenterCard extends Card {
  constructor(data = {}) {
    super(data);
    this.cardLeaf = null;
    this.imageLeaf = null;
    this.maskLeaf = null;
    this.cardWidth = 1488;
    this.cardHeight = 2079;

    this.defaultData = {
      image: '',
      radius: true,
      cardBack: false,
      scale: 1,
    };

    this.initData(data);
    this.initLeafer();
    this.initDraw();
  }

  initDraw() {
    this.drawCard();
    this.drawImage();
    this.drawMask();
    this.updateScale();
  }

  drawCard() {
    if (!this.cardLeaf) {
      this.cardLeaf = new Image();
      this.leafer.add(this.cardLeaf);
    }
    this.cardLeaf.set({
      url: this.cardUrl,
      cornerRadius: this.data.radius ? 24 : 0,
      zIndex: 0,
    });
  }

  drawImage() {
    if (!this.imageLeaf) {
      this.imageLeaf = new Image();
      this.leafer.add(this.imageLeaf);
    }

    this.imageLeaf.set({
      url: this.data.image,
      width: 1308,
      height: 1907,
      x: 90,
      y: 85,
      visible: this.data.image && !this.data.cardBack,
      zIndex: 10,
    });
  }

  drawMask() {
    if (!this.maskLeaf) {
      this.maskLeaf = new Image();
      this.leafer.add(this.maskLeaf);
    }

    const maskUrl = `${this.baseImage}/card-mask.png`;
    this.maskLeaf.set({
      url: maskUrl,
      cornerRadius: this.data.radius ? 24 : 0,
      visible: !this.data.cardBack,
      zIndex: 20,
    });
  }

  get baseImage() {
    return `${this.resourcePath}/field-center/image`;
  }

  get cardUrl() {
    if (this.data.cardBack) {
      return `${this.baseImage}/card-back.png`;
    } else {
      return `${this.baseImage}/card-background.png`;
    }
  }
}
