import type { IImage, ILeafer, IRect } from '@leafer-ui/interface';
import { Image, Rect } from 'leafer-unified';
import { Card, type CardOptions } from '../card/index.ts';
import { leaferVisibility } from '../utils/index.ts';

export interface FieldCenterCardData {
  artwork: string;
  roundCorners: boolean;
  renderBackSide: boolean;
  renderScale: number;
}

export class FieldCenterCard extends Card<FieldCenterCardData> {
  declare leafer: ILeafer;
  backgroundNode: IImage | null = null;
  artworkNode: IRect | null = null;
  artworkMaskNode: IImage | null = null;
  cardWidth = 1488;
  cardHeight = 2079;

  data: FieldCenterCardData = {
    artwork: '',
    roundCorners: true,
    renderBackSide: false,
    renderScale: 1,
  };

  constructor(data: CardOptions<FieldCenterCardData> = {}) {
    super(data);

    this.initLeafer();
    this.setData(data.data);
  }

  get tag() {
    return 'FieldCenterCard';
  }

  draw() {
    this.drawBackground();
    this.drawArtwork();
    this.drawArtworkMask();
    this.applyCardScale();
  }

  drawBackground() {
    if (!this.backgroundNode) {
      this.backgroundNode = new Image();
      this.leafer.add(this.backgroundNode);
    }
    this.backgroundNode.set({
      url: this.backgroundUrl,
      cornerRadius: this.data.roundCorners ? 24 : 0,
      zIndex: 0,
    });
  }

  drawArtwork() {
    if (!this.artworkNode) {
      this.artworkNode = new Rect();
      this.listenArtworkStatus(this.artworkNode);
      this.leafer.add(this.artworkNode);
    }

    this.artworkNode.set({
      width: 1308,
      height: 1907,
      x: 90,
      y: 85,
      fill: {
        type: 'image',
        url: this.data.artwork,
        mode: 'cover',
        align: 'top',
      },
      visible: leaferVisibility(this.data.artwork && !this.data.renderBackSide),
      zIndex: 10,
    });
  }

  drawArtworkMask() {
    if (!this.artworkMaskNode) {
      this.artworkMaskNode = new Image();
      this.leafer.add(this.artworkMaskNode);
    }

    const artworkMaskUrl = `${this.baseImage}/card-mask.png`;
    this.artworkMaskNode.set({
      url: artworkMaskUrl,
      cornerRadius: this.data.roundCorners ? 24 : 0,
      visible: !this.data.renderBackSide,
      zIndex: 20,
    });
  }

  get baseImage() {
    return `${this.resourcePath}/field-center/image`;
  }

  get backgroundUrl() {
    if (this.data.renderBackSide) {
      return `${this.baseImage}/card-back.png`;
    } else {
      return `${this.baseImage}/card-background.png`;
    }
  }
}
