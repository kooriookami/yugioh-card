import { Image, Rect } from 'leafer-unified';
import { Card } from '../card';

export class FieldCenterCard extends Card {
  cardLeaf = null;
  imageLeaf = null;
  maskLeaf = null;
  cardWidth = 1488;
  cardHeight = 2079;

  data = {
    image: '',
    radius: true,
    cardBack: false,
    scale: 1,
  };

  constructor(data = {}) {
    super(data);

    this.initLeafer();
    this.setData(data.data);
  }

  get tag() {
    return 'FieldCenterCard';
  }

  draw() {
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
      this.imageLeaf = new Rect();
      this.listenImageStatus(this.imageLeaf);
      this.leafer.add(this.imageLeaf);
    }

    this.imageLeaf.set({
      width: 1308,
      height: 1907,
      x: 90,
      y: 85,
      fill: {
        type: 'image',
        url: this.data.image,
        mode: 'cover',
        align: 'top',
      },
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
