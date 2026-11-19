import type { IImage, ILeafer } from '@leafer-ui/interface';
import { Image } from 'leafer-unified';
import { Card, type CardOptions } from '../card/index.ts';
import { leaferVisibility } from '../utils/index.ts';

export interface YugiohBackCardData {
  backDesign: 'normal' | 'tormentor' | 'sky-dragon' | 'winged-dragon';
  gameLogo: '' | 'ocg' | 'tcg' | 'rd';
  showKonamiLogo: boolean;
  showRegisteredMark: boolean;
  roundCorners: boolean;
  renderScale: number;
}

export class YugiohBackCard extends Card<YugiohBackCardData> {
  declare leafer: ILeafer;
  cardBackNode: IImage | null = null;
  konamiLogoNode: IImage | null = null;
  registeredMarkNode: IImage | null = null;
  gameLogoNode: IImage | null = null;
  cardWidth = 1394;
  cardHeight = 2031;

  data: YugiohBackCardData = {
    backDesign: 'normal',
    gameLogo: 'ocg',
    showKonamiLogo: true,
    showRegisteredMark: true,
    roundCorners: true,
    renderScale: 1,
  };

  constructor(data: CardOptions<YugiohBackCardData> = {}) {
    super(data);

    this.initLeafer();
    this.setData(data.data);
  }

  get tag() {
    return 'YugiohBackCard';
  }

  draw() {
    this.drawCardBack();
    this.drawKonamiLogo();
    this.drawRegisteredMark();
    this.drawGameLogo();
    this.applyCardScale();
  }

  drawCardBack() {
    if (!this.cardBackNode) {
      this.cardBackNode = new Image();
      this.leafer.add(this.cardBackNode);
    }
    const cardBackUrl = `${this.baseImage}/card-${this.data.backDesign}.png`;
    this.cardBackNode.set({
      url: cardBackUrl,
      cornerRadius: this.data.roundCorners ? 24 : 0,
      zIndex: 0,
    });
  }

  drawKonamiLogo() {
    if (!this.konamiLogoNode) {
      this.konamiLogoNode = new Image();
      this.leafer.add(this.konamiLogoNode);
    }
    const konamiLogoUrl = `${this.baseImage}/konami.png`;
    this.konamiLogoNode.set({
      url: konamiLogoUrl,
      x: 94,
      y: 95,
      visible: this.data.showKonamiLogo,
      zIndex: 10,
    });
  }

  drawRegisteredMark() {
    if (!this.registeredMarkNode) {
      this.registeredMarkNode = new Image();
      this.leafer.add(this.registeredMarkNode);
    }
    const registeredMarkUrl = `${this.baseImage}/register.png`;
    this.registeredMarkNode.set({
      url: registeredMarkUrl,
      x: 370,
      y: 114,
      visible: this.data.showRegisteredMark,
      zIndex: 10,
    });
  }

  drawGameLogo() {
    if (!this.gameLogoNode) {
      this.gameLogoNode = new Image();
      this.leafer.add(this.gameLogoNode);
    }
    const gameLogoUrl = this.data.gameLogo ? `${this.baseImage}/logo-${this.data.gameLogo}.png` : '';
    let x, y;
    if (this.data.gameLogo === 'ocg') {
      x = 878;
      y = 1722;
    } else if (this.data.gameLogo === 'tcg') {
      x = 859;
      y = 1763;
    } else if (this.data.gameLogo === 'rd') {
      x = 864;
      y = 1763;
    }
    this.gameLogoNode.set({
      url: gameLogoUrl,
      x,
      y,
      visible: leaferVisibility(this.data.gameLogo),
      zIndex: 10,
    });
  }

  get baseImage() {
    return `${this.resourcePath}/yugioh-back/image`;
  }
}
