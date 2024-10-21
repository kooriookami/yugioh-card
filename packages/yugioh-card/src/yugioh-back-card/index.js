import { Card } from '../card';
import { Image } from 'leafer-ui';

export class YugiohBackCard extends Card {
  cardLeaf = null;
  konamiLeaf = null;
  registerLeaf = null;
  logoLeaf = null;
  cardWidth = 1394;
  cardHeight = 2031;

  data = {
    type: 'normal',
    logo: 'ocg',
    konami: true,
    register: true,
    radius: true,
    scale: 1,
  };

  constructor(data = {}) {
    super(data);

    this.initLeafer();
    this.setData(data.data);
  }

  draw() {
    this.drawCard();
    this.drawKonami();
    this.drawRegister();
    this.drawLogo();
    this.updateScale();
  }

  drawCard() {
    if (!this.cardLeaf) {
      this.cardLeaf = new Image();
      this.leafer.add(this.cardLeaf);
    }
    const cardUrl = `${this.baseImage}/card-${this.data.type}.png`;
    this.cardLeaf.set({
      url: cardUrl,
      cornerRadius: this.data.radius ? 24 : 0,
      zIndex: 0,
    });
  }

  drawKonami() {
    if (!this.konamiLeaf) {
      this.konamiLeaf = new Image();
      this.leafer.add(this.konamiLeaf);
    }
    const konamiUrl = `${this.baseImage}/konami.png`;
    this.konamiLeaf.set({
      url: konamiUrl,
      x: 94,
      y: 95,
      visible: this.data.konami,
      zIndex: 10,
    });
  }

  drawRegister() {
    if (!this.registerLeaf) {
      this.registerLeaf = new Image();
      this.leafer.add(this.registerLeaf);
    }
    const registerUrl = `${this.baseImage}/register.png`;
    this.registerLeaf.set({
      url: registerUrl,
      x: 370,
      y: 114,
      visible: this.data.register,
      zIndex: 10,
    });
  }

  drawLogo() {
    if (!this.logoLeaf) {
      this.logoLeaf = new Image();
      this.leafer.add(this.logoLeaf);
    }
    const logoUrl = this.data.logo ? `${this.baseImage}/logo-${this.data.logo}.png` : '';
    let x, y;
    if (this.data.logo === 'ocg') {
      x = 878;
      y = 1722;
    } else if (this.data.logo === 'tcg') {
      x = 859;
      y = 1763;
    } else if (this.data.logo === 'rd') {
      x = 864;
      y = 1763;
    }
    this.logoLeaf.set({
      url: logoUrl,
      x,
      y,
      visible: this.data.logo,
      zIndex: 10,
    });
  }

  get baseImage() {
    return `${this.resourcePath}/yugioh-back/image`;
  }
}
