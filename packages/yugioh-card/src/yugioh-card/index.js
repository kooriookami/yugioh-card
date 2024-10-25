import { Card } from '../card';
import { Group, Image, Text } from 'leafer-ui';
import { CompressText } from 'leafer-compress-text';
import { numberToFull } from '../utils';
import scStyle from './style/sc-style';
import tcStyle from './style/tc-style';
import jpStyle from './style/jp-style';
import krStyle from './style/kr-style';
import enStyle from './style/en-style';
import astralStyle from './style/astral-style';
import custom1Style from './style/custom1-style';
import custom2Style from './style/custom2-style';

export class YugiohCard extends Card {
  cardLeaf = null;
  nameLeaf = null;
  attributeLeaf = null;
  levelLeaf = null;
  rankLeaf = null;
  spellTrapLeaf = null;
  imageLeaf = null;
  maskLeaf = null;
  pendulumLeaf = null;
  pendulumDescriptionLeaf = null;
  packageLeaf = null;
  linkArrowLeaf = null;
  effectLeaf = null;
  descriptionLeaf = null;
  atkDefLinkLeaf = null;
  passwordLeaf = null;
  copyrightLeaf = null;
  laserLeaf = null;
  rareLeaf = null;
  attributeRareLeaf = null;
  twentiethLeaf = null;
  cardWidth = 1394;
  cardHeight = 2031;

  data = {
    language: 'sc',
    font: '',
    name: '',
    color: '',
    align: 'left',
    gradient: false,
    gradientColor1: '#999999',
    gradientColor2: '#ffffff',
    type: 'monster',
    attribute: 'dark',
    icon: '',
    image: '',
    cardType: 'normal',
    pendulumType: 'normal-pendulum',
    level: 0,
    rank: 0,
    pendulumScale: 0,
    pendulumDescription: '',
    monsterType: '',
    atkBar: true,
    atk: 0,
    def: 0,
    arrowList: [],
    description: '',
    firstLineCompress: false,
    descriptionAlign: false,
    descriptionZoom: 1,
    descriptionWeight: 0,
    package: '',
    password: '',
    copyright: '',
    laser: '',
    rare: '',
    twentieth: false,
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
    this.drawName();
    this.drawAttribute();
    this.drawLevel();
    this.drawRank();
    this.drawSpellTrap();
    this.drawImage();
    this.drawMask();
    this.drawPendulum();
    this.drawPendulumDescription();
    this.drawPackage();
    this.drawLinkArrow();
    this.drawEffect();
    this.drawDescription();
    this.drawAtkDefLink();
    this.drawPassword();
    this.drawCopyright();
    this.drawLaser();
    this.drawRare();
    this.drawAttributeRare();
    this.drawTwentieth();
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

  drawName() {
    const { name } = this.style;

    if (!this.nameLeaf) {
      this.nameLeaf = new CompressText();
      this.leafer.add(this.nameLeaf);
    }
    this.nameLeaf.set({
      text: this.data.name,
      fontFamily: name.fontFamily,
      fontSize: name.fontSize,
      letterSpacing: name.letterSpacing || 0,
      wordSpacing: name.wordSpacing || 0,
      textAlign: this.data.align || 'left',
      color: this.data.color || this.autoNameColor,
      gradient: this.data.gradient,
      gradientColor1: this.data.gradientColor1,
      gradientColor2: this.data.gradientColor2,
      rtFontSize: name.rtFontSize,
      rtTop: name.rtTop,
      rtColor: this.autoNameColor,
      width: this.showAttribute ? 1033 : 1161,
      height: 200,
      x: 116,
      y: name.top,
      zIndex: 10,
    });
  }

  drawAttribute() {
    if (!this.attributeLeaf) {
      this.attributeLeaf = new Image();
      this.leafer.add(this.attributeLeaf);
    }
    this.attributeLeaf.set({
      url: this.attributeUrl,
      x: 1163,
      y: 96,
      visible: this.showAttribute,
      zIndex: 10,
    });
  }

  drawLevel() {
    if (!this.levelLeaf) {
      this.levelLeaf = new Group();
      for (let i = 0; i < 13; i++) {
        const level = new Image();
        this.levelLeaf.add(level);
      }
      this.leafer.add(this.levelLeaf);
    }

    const levelUrl = `${this.baseImage}/level.png`;
    const levelWidth = 88;
    const right = this.data.level < 13 ? 147 : 101;
    this.levelLeaf.children.forEach((level, index) => {
      level.set({
        url: levelUrl,
        x: this.cardWidth - right - index * (levelWidth + 4),
        y: 247,
        around: { type: 'percent', x: 1, y: 0 },
        visible: index < this.data.level,
      });
    });

    this.levelLeaf.set({
      visible: this.showLevel,
      zIndex: 10,
    });
  }

  drawRank() {
    if (!this.rankLeaf) {
      this.rankLeaf = new Group();
      for (let i = 0; i < 13; i++) {
        const rank = new Image();
        this.rankLeaf.add(rank);
      }
      this.leafer.add(this.rankLeaf);
    }

    const rankUrl = `${this.baseImage}/rank.png`;
    const rankWidth = 88;
    const left = this.data.rank < 13 ? 147 : 101;
    this.rankLeaf.children.forEach((rank, index) => {
      rank.set({
        url: rankUrl,
        x: left + index * (rankWidth + 4),
        y: 247,
        visible: index < this.data.rank,
      });
    });

    this.rankLeaf.set({
      visible: this.showRank,
      zIndex: 10,
    });
  }

  drawSpellTrap() {
    if (!this.spellTrapLeaf) {
      this.spellTrapLeaf = new Group();

      const rightText = new CompressText();
      const spellTrapIcon = new Image();
      const leftText = new CompressText();

      this.spellTrapLeaf.add(rightText);
      this.spellTrapLeaf.add(spellTrapIcon);
      this.spellTrapLeaf.add(leftText);

      this.leafer.add(this.spellTrapLeaf);
    }

    const { spellTrap } = this.style;
    const { icon } = spellTrap;

    const iconUrl = this.data.icon ? `${this.baseImage}/icon-${this.data.icon}.png` : '';
    const iconWidth = this.data.icon ? 72 : 0;
    const leftBracket = ['en', 'kr'].includes(this.data.language) ? '[' : '【';
    const rightBracket = ['en', 'kr'].includes(this.data.language) ? ']' : '】';
    const letterSpacing = spellTrap.letterSpacing || 0;
    const wordSpacing = spellTrap.wordSpacing || 0;

    const rightText = this.spellTrapLeaf.children[0];
    const spellTrapIcon = this.spellTrapLeaf.children[1];
    const leftText = this.spellTrapLeaf.children[2];

    rightText.set({
      text: rightBracket,
      fontFamily: spellTrap.fontFamily,
      fontSize: spellTrap.fontSize,
      letterSpacing,
      wordSpacing,
      scaleY: spellTrap.scaleY || 1,
      y: spellTrap.top,
    });
    const rightBounds = rightText.bounds;
    rightText.x = this.cardWidth - spellTrap.right - rightBounds.width;

    spellTrapIcon.set({
      url: iconUrl,
      x: rightText.x - (this.data.icon ? (icon.marginRight || 0) : 0) - iconWidth,
      y: spellTrap.top + (icon.marginTop || 0),
    });

    leftText.set({
      text: leftBracket + this.spellTrapName,
      fontFamily: spellTrap.fontFamily,
      fontSize: spellTrap.fontSize,
      letterSpacing,
      wordSpacing,
      scaleY: spellTrap.scaleY || 1,
      rtFontSize: spellTrap.rtFontSize,
      rtTop: spellTrap.rtTop,
      rtFontScaleX: spellTrap.rtFontScaleX || 1,
      y: spellTrap.top,
    });
    const leftBounds = leftText.bounds;
    leftText.x = spellTrapIcon.x - (this.data.icon ? (icon.marginLeft || 0) : 0) - leftBounds.width;

    this.spellTrapLeaf.set({
      visible: ['spell', 'trap'].includes(this.data.type),
      zIndex: 10,
    });
  }

  drawImage() {
    if (!this.imageLeaf) {
      this.imageLeaf = new Image();
      this.listenImageStatus(this.imageLeaf);
      this.leafer.add(this.imageLeaf);
    }

    this.imageLeaf.set({
      url: this.data.image,
      width: this.data.type === 'pendulum' ? 1205 : 1054,
      height: this.data.type === 'pendulum' ? 1205 : 1054,
      x: this.data.type === 'pendulum' ? 94 : 170,
      y: this.data.type === 'pendulum' ? 364 : 375,
      visible: this.data.image,
      zIndex: 10,
    });
  }

  drawMask() {
    if (!this.maskLeaf) {
      this.maskLeaf = new Image();
      this.leafer.add(this.maskLeaf);
    }

    const maskUrl = this.data.type === 'pendulum' ? `${this.baseImage}/card-mask-pendulum.png` : `${this.baseImage}/card-mask.png`;
    this.maskLeaf.set({
      url: maskUrl,
      x: this.data.type === 'pendulum' ? 68 : 117,
      y: this.data.type === 'pendulum' ? 342 : 322,
      zIndex: 20,
    });
  }

  drawPendulum() {
    if (!this.pendulumLeaf) {
      this.pendulumLeaf = new Group();
      const leftPendulum = new Text();
      const rightPendulum = new Text();
      this.pendulumLeaf.add(leftPendulum);
      this.pendulumLeaf.add(rightPendulum);
      this.leafer.add(this.pendulumLeaf);
    }

    const leftPendulum = this.pendulumLeaf.children[0];
    const rightPendulum = this.pendulumLeaf.children[1];

    let left = this.data.language === 'astral' ? 144 : 145;
    leftPendulum.set({
      text: this.data.pendulumScale,
      fontFamily: this.data.language === 'astral' ? 'ygo-astral, serif' : 'ygo-atk-def, serif',
      fontSize: this.data.language === 'astral' ? 84 : 98,
      fill: 'black',
      letterSpacing: this.data.language === 'astral' ? 0 : -10,
      x: left,
      y: this.data.language === 'astral' ? 1389 : 1370,
      around: { type: 'percent', x: 0.5, y: 0 },
    });

    left = this.data.language === 'astral' ? 1250 : 1249;
    rightPendulum.set({
      text: this.data.pendulumScale,
      fontFamily: this.data.language === 'astral' ? 'ygo-astral, serif' : 'ygo-atk-def, serif',
      fontSize: this.data.language === 'astral' ? 84 : 98,
      fill: 'black',
      letterSpacing: this.data.language === 'astral' ? 0 : -10,
      x: left,
      y: this.data.language === 'astral' ? 1389 : 1370,
      around: { type: 'percent', x: 0.5, y: 0 },
    });

    this.pendulumLeaf.set({
      visible: this.data.type === 'pendulum',
      zIndex: 30,
    });
  }

  drawPendulumDescription() {
    if (!this.pendulumDescriptionLeaf) {
      this.pendulumDescriptionLeaf = new CompressText();
      this.leafer.add(this.pendulumDescriptionLeaf);
    }

    const { pendulumDescription } = this.style;

    this.pendulumDescriptionLeaf.set({
      text: this.data.pendulumDescription,
      fontFamily: pendulumDescription.fontFamily,
      fontSize: pendulumDescription.fontSize,
      fontScale: this.data.descriptionZoom,
      strokeWidth: this.data.descriptionWeight,
      lineHeight: pendulumDescription.lineHeight,
      letterSpacing: pendulumDescription.letterSpacing || 0,
      wordSpacing: pendulumDescription.wordSpacing || 0,
      rtFontSize: pendulumDescription.rtFontSize,
      rtTop: pendulumDescription.rtTop,
      width: 950,
      height: 230,
      x: 221,
      y: pendulumDescription.top,
      visible: this.data.type === 'pendulum',
      zIndex: 30,
    });
  }

  drawPackage() {
    if (!this.packageLeaf) {
      this.packageLeaf = new CompressText();
      this.leafer.add(this.packageLeaf);
    }

    this.packageLeaf.set({
      text: this.data.package,
      fontFamily: 'ygo-password, serif',
      fontSize: 40,
      color: this.data.type === 'monster' && this.data.cardType === 'xyz' ? 'white' : 'black',
      textAlign: this.data.type === 'pendulum' ? 'left' : 'right',
      y: this.data.type === 'pendulum' ? 1859 : 1455,
      zIndex: 30,
    });
    if (this.data.type === 'pendulum') {
      this.packageLeaf.x = 116;
    } else {
      const bounds = this.packageLeaf.bounds;
      const right = this.data.type === 'monster' && this.data.cardType === 'link' ? 252 : 148;
      this.packageLeaf.x = this.cardWidth - right - bounds.width;
    }
  }

  drawLinkArrow() {
    if (!this.linkArrowLeaf) {
      this.linkArrowLeaf = new Group();
      for (let i = 0; i < 8; i++) {
        const arrow = new Image();
        this.linkArrowLeaf.add(arrow);
      }
      this.leafer.add(this.linkArrowLeaf);
    }

    const arrowOnList = [
      { x: 555, y: 278, url: this.baseImage + '/arrow-up-on.png' },
      { x: 1130, y: 299, url: this.baseImage + '/arrow-right-up-on.png' },
      { x: 1223, y: 761, url: this.baseImage + '/arrow-right-on.png' },
      { x: 1130, y: 1336, url: this.baseImage + '/arrow-right-down-on.png' },
      { x: 555, y: 1428, url: this.baseImage + '/arrow-down-on.png' },
      { x: 95, y: 1336, url: this.baseImage + '/arrow-left-down-on.png' },
      { x: 71, y: 758, url: this.baseImage + '/arrow-left-on.png' },
      { x: 95, y: 299, url: this.baseImage + '/arrow-left-up-on.png' },
    ];

    const arrowOffList = [
      { x: 555, y: 278, url: this.baseImage + '/arrow-up-off.png' },
      { x: 1130, y: 299, url: this.baseImage + '/arrow-right-up-off.png' },
      { x: 1223, y: 761, url: this.baseImage + '/arrow-right-off.png' },
      { x: 1130, y: 1336, url: this.baseImage + '/arrow-right-down-off.png' },
      { x: 555, y: 1428, url: this.baseImage + '/arrow-down-off.png' },
      { x: 95, y: 1336, url: this.baseImage + '/arrow-left-down-off.png' },
      { x: 71, y: 758, url: this.baseImage + '/arrow-left-off.png' },
      { x: 95, y: 299, url: this.baseImage + '/arrow-left-up-off.png' },
    ];

    this.linkArrowLeaf.children.forEach((arrow, index) => {
      const showArrow = this.data.arrowList.includes(index + 1);
      arrow.set({
        url: showArrow ? arrowOnList[index].url : arrowOffList[index].url,
        x: showArrow ? arrowOnList[index].x : arrowOffList[index].x,
        y: showArrow ? arrowOnList[index].y : arrowOffList[index].y,
      });
    });

    this.linkArrowLeaf.set({
      visible: this.data.type === 'monster' && this.data.cardType === 'link',
      zIndex: 120,
    });
  }

  drawEffect() {
    if (!this.effectLeaf) {
      this.effectLeaf = new CompressText();
      this.leafer.add(this.effectLeaf);
    }

    const { effect } = this.style;

    const leftBracket = ['en', 'kr'].includes(this.data.language) ? '[' : '【';
    const rightBracket = ['en', 'kr'].includes(this.data.language) ? ']' : '】';

    this.effectLeaf.set({
      text: leftBracket + this.data.monsterType + rightBracket,
      fontFamily: effect.fontFamily,
      fontSize: effect.fontSize,
      strokeWidth: this.data.descriptionWeight,
      lineHeight: effect.lineHeight,
      letterSpacing: effect.letterSpacing || 0,
      wordSpacing: effect.wordSpacing || 0,
      rtFontSize: effect.rtFontSize,
      rtTop: effect.rtTop,
      width: 1175,
      height: 100,
      x: 109 + (effect.textIndent || 0),
      y: effect.top,
      visible: this.showEffect,
      zIndex: 30,
    });
  }

  drawDescription() {
    if (!this.descriptionLeaf) {
      this.descriptionLeaf = new CompressText();
      this.leafer.add(this.descriptionLeaf);
    }

    const { effect, description } = this.style;

    let effectHeight = effect.minHeight || 0;
    if (this.showEffect) {
      effectHeight = effect.fontSize * effect.lineHeight;
    }

    let fontFamily = description.fontFamily;
    if (this.data.language === 'en' && !this.data.font &&
      ((this.data.type === 'monster' && this.data.cardType === 'normal') || (this.data.type === 'pendulum' && this.data.pendulumType === 'normal-pendulum'))) {
      fontFamily = 'ygo-en-italic';
    }

    let height = 380;
    if (!['spell', 'trap'].includes(this.data.type)) {
      if (this.showEffect) {
        height -= 50;
      }
      if (this.data.atkBar) {
        height -= 55;
      }
    }

    this.descriptionLeaf.set({
      text: this.data.description,
      fontFamily,
      fontSize: description.fontSize,
      fontScale: this.data.descriptionZoom,
      textAlign: this.data.descriptionAlign ? 'center' : 'justify',
      firstLineCompress: this.data.firstLineCompress,
      strokeWidth: this.data.descriptionWeight,
      lineHeight: description.lineHeight,
      letterSpacing: description.letterSpacing || 0,
      wordSpacing: description.wordSpacing || 0,
      rtFontSize: description.rtFontSize,
      rtTop: description.rtTop,
      autoSmallSize: !!description.smallFontSize,
      smallFontSize: description.smallFontSize,
      width: 1175,
      height,
      x: 109,
      y: effect.top + effectHeight,
      zIndex: 30,
    });
  }

  drawAtkDefLink() {
    if (!this.atkDefLinkLeaf) {
      this.atkDefLinkLeaf = new Group();
      const atkDefLinkImage = new Image();
      const atk = new Text();
      const def = new Text();
      const link = new Text();

      this.atkDefLinkLeaf.add(atkDefLinkImage);
      this.atkDefLinkLeaf.add(atk);
      this.atkDefLinkLeaf.add(def);
      this.atkDefLinkLeaf.add(link);

      this.leafer.add(this.atkDefLinkLeaf);
    }

    const atkDefLinkImage = this.atkDefLinkLeaf.children[0];
    const atk = this.atkDefLinkLeaf.children[1];
    const def = this.atkDefLinkLeaf.children[2];
    const link = this.atkDefLinkLeaf.children[3];
    atkDefLinkImage.set({
      url: this.atkDefLinkUrl,
      x: 109,
      y: 1844,
    });

    let atkText = '';
    if (this.data.atk >= 0) {
      atkText = this.data.language === 'astral' ? numberToFull(this.data.atk) : this.data.atk;
    } else if (this.data.atk === -1) {
      atkText = '?';
    } else if (this.data.atk === -2) {
      atkText = '∞';
    }
    const atkLeft = this.data.language === 'astral' ? 898 : 999;
    atk.set({
      text: atkText,
      fontFamily: this.data.language === 'astral' ? 'ygo-astral, serif' : 'ygo-atk-def, serif',
      fontSize: this.data.language === 'astral' ? 49 : 62,
      fill: 'black',
      letterSpacing: this.data.language === 'astral' ? 0 : 2,
      x: atkLeft,
      y: this.data.language === 'astral' ? 1850 : 1839,
      around: { type: 'percent', x: 1, y: 0 },
      visible: ['monster', 'pendulum'].includes(this.data.type),
    });

    let defText = '';
    if (this.data.def >= 0) {
      defText = this.data.language === 'astral' ? numberToFull(this.data.def) : this.data.def;
    } else if (this.data.def === -1) {
      defText = '?';
    } else if (this.data.def === -2) {
      defText = '∞';
    }
    const defLeft = this.data.language === 'astral' ? 1279 : 1282;
    def.set({
      text: defText,
      fontFamily: this.data.language === 'astral' ? 'ygo-astral, serif' : 'ygo-atk-def, serif',
      fontSize: this.data.language === 'astral' ? 49 : 62,
      fill: 'black',
      letterSpacing: this.data.language === 'astral' ? 0 : 2,
      x: defLeft,
      y: this.data.language === 'astral' ? 1850 : 1839,
      around: { type: 'percent', x: 1, y: 0 },
      visible: (this.data.type === 'monster' && this.data.cardType !== 'link') || this.data.type === 'pendulum',
    });

    const linkText = this.data.language === 'astral' ? numberToFull(this.data.arrowList.length) : this.data.arrowList.length;
    const linkLeft = this.data.language === 'astral' ? 1279 : 1280;
    link.set({
      text: linkText,
      fontFamily: this.data.language === 'astral' ? 'ygo-astral, serif' : 'ygo-link, serif',
      fontSize: this.data.language === 'astral' ? 49 : 44,
      fill: 'black',
      letterSpacing: this.data.language === 'astral' ? 0 : 2,
      x: linkLeft,
      y: this.data.language === 'astral' ? 1850 : 1845,
      around: { type: 'percent', x: 1, y: 0 },
      scaleX: this.data.language === 'astral' ? 1 : 1.3,
      visible: this.data.type === 'monster' && this.data.cardType === 'link',
    });

    this.atkDefLinkLeaf.set({
      visible: this.showAtkDefLink,
      zIndex: 30,
    });
  }

  drawPassword() {
    if (!this.passwordLeaf) {
      this.passwordLeaf = new CompressText();
      this.leafer.add(this.passwordLeaf);
    }

    this.passwordLeaf.set({
      text: this.data.password,
      fontFamily: 'ygo-password, serif',
      fontSize: 40,
      color: this.data.type === 'monster' && this.data.cardType === 'xyz' ? 'white' : 'black',
      x: 66,
      y: 1932,
      zIndex: 30,
    });
  }

  drawCopyright() {
    if (!this.copyrightLeaf) {
      this.copyrightLeaf = new Image();
      this.leafer.add(this.copyrightLeaf);
    }

    const color = this.data.type === 'monster' && this.data.cardType === 'xyz' ? 'white' : 'black';
    const copyrightUrl = this.data.copyright ? `${this.baseImage}/copyright-${this.data.copyright}-${color}.svg` : '';
    this.copyrightLeaf.set({
      url: copyrightUrl,
      x: this.cardWidth - 141,
      y: 1936,
      around: { type: 'percent', x: 1, y: 0 },
      visible: this.data.copyright,
      zIndex: 30,
    });
  }

  drawLaser() {
    if (!this.laserLeaf) {
      this.laserLeaf = new Image();
      this.leafer.add(this.laserLeaf);
    }

    const laserUrl = this.data.laser ? `${this.baseImage}/${this.data.laser}.png` : '';
    this.laserLeaf.set({
      url: laserUrl,
      x: 1276,
      y: 1913,
      visible: this.data.laser,
      zIndex: 120,
    });
  }

  drawRare() {
    if (!this.rareLeaf) {
      this.rareLeaf = new Image();
      this.leafer.add(this.rareLeaf);
    }

    const suffix = this.data.type === 'pendulum' ? '-pendulum' : '';
    const rareUrl = this.data.rare ? `${this.baseImage}/rare-${this.data.rare}${suffix}.png` : '';

    this.rareLeaf.set({
      url: rareUrl,
      cornerRadius: this.data.radius ? 24 : 0,
      visible: this.data.rare,
      zIndex: 100,
    });
  }

  drawAttributeRare() {
    if (!this.attributeRareLeaf) {
      this.attributeRareLeaf = new Image();
      this.leafer.add(this.attributeRareLeaf);
    }

    const attributeRareUrl = `${this.baseImage}/attribute-rare.png`;
    this.attributeRareLeaf.set({
      url: attributeRareUrl,
      x: 1163,
      y: 96,
      visible: this.showAttributeRare,
      zIndex: 30,
    });
  }

  drawTwentieth() {
    if (!this.twentiethLeaf) {
      this.twentiethLeaf = new Image();
      this.leafer.add(this.twentiethLeaf);
    }

    const twentiethUrl = `${this.baseImage}/twentieth.png`;
    this.twentiethLeaf.set({
      url: twentiethUrl,
      x: 472,
      y: 1532,
      visible: this.data.twentieth,
      zIndex: 10,
    });
  }

  get baseImage() {
    return `${this.resourcePath}/yugioh/image`;
  }

  get style() {
    let style = {};
    if (this.data.font) {
      if (this.data.font === 'custom1') {
        style = custom1Style;
      } else if (this.data.font === 'custom2') {
        style = custom2Style;
      }
    } else {
      if (this.data.language === 'sc') {
        style = scStyle;
      } else if (this.data.language === 'tc') {
        style = tcStyle;
      } else if (this.data.language === 'jp') {
        style = jpStyle;
      } else if (this.data.language === 'kr') {
        style = krStyle;
      } else if (this.data.language === 'en') {
        style = enStyle;
      } else if (this.data.language === 'astral') {
        style = astralStyle;
      } else if (this.data.language === 'astral') {
        style = astralStyle;
      }
    }
    return style;
  }

  get cardUrl() {
    if (this.data.type === 'monster') {
      return `${this.baseImage}/card-${this.data.cardType}.png`;
    } else if (this.data.type === 'pendulum') {
      return `${this.baseImage}/card-${this.data.pendulumType}.png`;
    } else {
      return `${this.baseImage}/card-${this.data.type}.png`;
    }
  }

  get autoNameColor() {
    let color = 'black';
    // 自动颜色
    if ((this.data.type === 'monster' && ['xyz', 'link'].includes(this.data.cardType)) || ['spell', 'trap'].includes(this.data.type) ||
      (this.data.type === 'pendulum' && ['xyz-pendulum', 'link-pendulum'].includes(this.data.pendulumType))) {
      color = 'white';
    }
    return color;
  }

  get showAttribute() {
    if (['monster', 'pendulum'].includes(this.data.type)) {
      return !!this.data.attribute;
    }
    return true;
  }

  get attributeUrl() {
    let suffix = '';
    if (this.data.language === 'jp') {
      suffix = '-jp';
    } else if (this.data.language === 'kr') {
      suffix = '-kr';
    } else if (this.data.language === 'en') {
      suffix = '-en';
    } else if (this.data.language === 'astral') {
      suffix = '-astral';
    }
    if (['monster', 'pendulum'].includes(this.data.type)) {
      if (!this.data.attribute) {
        return '';
      }
      return `${this.baseImage}/attribute-${this.data.attribute}${suffix}.png`;
    } else {
      return `${this.baseImage}/attribute-${this.data.type}${suffix}.png`;
    }
  }

  get spellTrapName() {
    let name = '';
    if (this.data.language === 'sc') {
      if (this.data.type === 'spell') {
        name = '魔法卡';
      } else if (this.data.type === 'trap') {
        name = '陷阱卡';
      }
    } else if (this.data.language === 'tc') {
      if (this.data.type === 'spell') {
        name = '魔法卡';
      } else if (this.data.type === 'trap') {
        name = '陷阱卡';
      }
    } else if (this.data.language === 'jp') {
      if (this.data.type === 'spell') {
        name = '[魔(ま)][法(ほう)]カード';
      } else if (this.data.type === 'trap') {
        name = '[罠(トラップ)]カード';
      }
    } else if (this.data.language === 'kr') {
      if (this.data.type === 'spell') {
        name = '마법 카드';
      } else if (this.data.type === 'trap') {
        name = '함정 카드';
      }
    } else if (this.data.language === 'en') {
      if (this.data.type === 'spell') {
        name = 'Spell Card';
      } else if (this.data.type === 'trap') {
        name = 'Trap Card';
      }
    } else if (this.data.language === 'astral') {
      if (this.data.type === 'spell') {
        name = 'マホウカアド';
      } else if (this.data.type === 'trap') {
        name = 'トラププカアド';
      }
    }
    return name;
  }

  get showAttributeRare() {
    return this.showAttribute && ['hr', 'ser', 'gser', 'pser'].includes(this.data.rare);
  }

  get showLevel() {
    let show = false;
    if (this.data.type === 'monster') {
      show = ['normal', 'effect', 'ritual', 'fusion', 'synchro', 'token'].includes(this.data.cardType);
    } else if (this.data.type === 'pendulum') {
      show = ['normal-pendulum', 'effect-pendulum', 'ritual-pendulum', 'fusion-pendulum', 'synchro-pendulum'].includes(this.data.pendulumType);
    }
    return show;
  }

  get showRank() {
    let show = false;
    if (this.data.type === 'monster') {
      show = this.data.cardType === 'xyz';
    } else if (this.data.type === 'pendulum') {
      show = this.data.pendulumType === 'xyz-pendulum';
    }
    return show;
  }

  get showEffect() {
    return ['monster', 'pendulum'].includes(this.data.type) && this.data.monsterType;
  }

  get showAtkDefLink() {
    if (!this.data.atkBar) {
      return false;
    } else if (this.data.language === 'astral') {
      if ((this.data.type === 'monster' && this.data.cardType !== 'link') || this.data.type === 'pendulum') {
        return true;
      }
      if (this.data.type === 'monster' && this.data.cardType === 'link') {
        return true;
      }
    } else {
      if ((this.data.type === 'monster' && this.data.cardType !== 'link') || this.data.type === 'pendulum') {
        return true;
      }
      if (this.data.type === 'monster' && this.data.cardType === 'link') {
        return true;
      }
    }
    return false;
  }

  get atkDefLinkUrl() {
    let url = '';
    if (this.data.language === 'astral') {
      if ((this.data.type === 'monster' && this.data.cardType !== 'link') || this.data.type === 'pendulum') {
        url = `${this.baseImage}/atk-def-astral.svg`;
      }
      if (this.data.type === 'monster' && this.data.cardType === 'link') {
        url = `${this.baseImage}/atk-link-astral.svg`;
      }
    } else {
      if ((this.data.type === 'monster' && this.data.cardType !== 'link') || this.data.type === 'pendulum') {
        url = `${this.baseImage}/atk-def.svg`;
      }
      if (this.data.type === 'monster' && this.data.cardType === 'link') {
        url = `${this.baseImage}/atk-link.svg`;
      }
    }
    return url;
  }
}
