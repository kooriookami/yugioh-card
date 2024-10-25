import { Card } from '../card';
import { Group, Image } from 'leafer-ui';
import { CompressText } from 'leafer-compress-text';
import jpStyle from './style/jp-style';
import custom1Style from './style/custom1-style';
import custom2Style from './style/custom2-style';

export class YugiohSeries2Card extends Card {
  cardLeaf = null;
  nameLeaf = null;
  attributeLeaf = null;
  levelLeaf = null;
  spellTrapLeaf = null;
  imageLeaf = null;
  maskLeaf = null;
  packageLeaf = null;
  effectLeaf = null;
  descriptionLeaf = null;
  atkDefLeaf = null;
  passwordLeaf = null;
  copyrightLeaf = null;
  laserLeaf = null;
  cardWidth = 1394;
  cardHeight = 2031;

  data = {
    language: 'jp',
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
    level: 0,
    monsterType: '',
    atk: 0,
    def: 0,
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
    this.drawSpellTrap();
    this.drawImage();
    this.drawMask();
    this.drawPackage();
    this.drawEffect();
    this.drawDescription();
    this.drawAtkDef();
    this.drawPassword();
    this.drawCopyright();
    this.drawLaser();
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
      textAlign: this.data.align || 'left',
      color: this.data.color || this.autoNameColor,
      gradient: this.data.gradient,
      gradientColor1: this.data.gradientColor1,
      gradientColor2: this.data.gradientColor2,
      rtFontSize: name.rtFontSize,
      rtTop: name.rtTop,
      rtColor: this.autoNameColor,
      width: this.showAttribute ? 953 : 1104,
      height: 200,
      x: 147,
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
      x: 1119,
      y: 128,
      visible: this.showAttribute,
      zIndex: 10,
    });
  }

  drawLevel() {
    if (!this.levelLeaf) {
      this.levelLeaf = new Group();
      for (let i = 0; i < 12; i++) {
        const level = new Image();
        this.levelLeaf.add(level);
      }
      this.leafer.add(this.levelLeaf);
    }

    const levelUrl = `${this.baseImage}/level.png`;
    const levelWidth = 92;
    const right = this.data.level < 12 ? 172 : 129;
    this.levelLeaf.children.forEach((level, index) => {
      level.set({
        url: levelUrl,
        x: this.cardWidth - right - index * (levelWidth + 3),
        y: 314,
        around: { type: 'percent', x: 1, y: 0 },
        visible: index < this.data.level,
      });
    });

    this.levelLeaf.set({
      visible: this.data.type === 'monster',
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
    const leftBracket = '【';
    const rightBracket = '】';
    const letterSpacing = spellTrap.letterSpacing || 0;

    const rightText = this.spellTrapLeaf.children[0];
    const spellTrapIcon = this.spellTrapLeaf.children[1];
    const leftText = this.spellTrapLeaf.children[2];

    rightText.set({
      text: rightBracket,
      fontFamily: spellTrap.fontFamily,
      fontSize: spellTrap.fontSize,
      letterSpacing,
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
      width: 990,
      height: 1100,
      x: 202,
      y: 468,
      visible: this.data.image,
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
      x: 143,
      y: 414,
      zIndex: 20,
    });
  }

  drawPackage() {
    if (!this.packageLeaf) {
      this.packageLeaf = new CompressText();
      this.leafer.add(this.packageLeaf);
    }

    this.packageLeaf.set({
      text: this.data.package,
      fontFamily: 'ygo-tip, serif',
      fontSize: 33,
      y: 1601,
      zIndex: 30,
    });
    const bounds = this.packageLeaf.bounds;
    this.packageLeaf.x = this.cardWidth - 170 - bounds.width;
  }

  drawEffect() {
    if (!this.effectLeaf) {
      this.effectLeaf = new CompressText();
      this.leafer.add(this.effectLeaf);
    }

    const { effect } = this.style;

    const leftBracket = '【';
    const rightBracket = '】';

    this.effectLeaf.set({
      text: leftBracket + this.data.monsterType + rightBracket,
      fontFamily: effect.fontFamily,
      fontSize: effect.fontSize,
      strokeWidth: this.data.descriptionWeight,
      lineHeight: effect.lineHeight,
      letterSpacing: effect.letterSpacing || 0,
      rtFontSize: effect.rtFontSize,
      rtTop: effect.rtTop,
      width: this.data.type === 'monster' ? 710 : 1095,
      height: 70,
      x: 149 + (effect.textIndent || 0),
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

    this.descriptionLeaf.set({
      text: this.data.description,
      fontFamily: description.fontFamily,
      fontSize: description.fontSize,
      fontScale: this.data.descriptionZoom,
      textAlign: this.data.descriptionAlign ? 'center' : 'justify',
      firstLineCompress: this.data.firstLineCompress,
      strokeWidth: this.data.descriptionWeight,
      lineHeight: description.lineHeight,
      letterSpacing: description.letterSpacing || 0,
      rtFontSize: description.rtFontSize,
      rtTop: description.rtTop,
      width: this.data.type === 'monster' ? 710 : 1095,
      height: ['spell', 'trap'].includes(this.data.type) ? 240 : 170,
      x: 149,
      y: effect.top + effectHeight,
      zIndex: 30,
    });
  }

  drawAtkDef() {
    if (!this.atkDefLeaf) {
      this.atkDefLeaf = new Group();
      const atk = new CompressText();
      const def = new CompressText();

      this.atkDefLeaf.add(atk);
      this.atkDefLeaf.add(def);

      this.leafer.add(this.atkDefLeaf);
    }

    const atk = this.atkDefLeaf.children[0];
    const def = this.atkDefLeaf.children[1];

    let atkText = '';
    if (this.data.atk >= 0) {
      atkText = this.data.atk;
    } else if (this.data.atk === -1) {
      atkText = '????';
    } else if (this.data.atk === -2) {
      atkText = 'X000';
    }
    atk.set({
      text: this.atkName + atkText,
      fontFamily: 'ygo-jp, serif',
      fontSize: 84,
      textAlign: 'justify',
      textJustifyLast: true,
      rtFontSize: 22,
      rtTop: -10,
      width: 288,
      x: 950,
      y: 1688,
    });

    let defText = '';
    if (this.data.def >= 0) {
      defText = this.data.def;
    } else if (this.data.def === -1) {
      defText = '????';
    } else if (this.data.def === -2) {
      defText = 'X000';
    }
    def.set({
      text: this.defName + defText,
      fontFamily: 'ygo-jp, serif',
      fontSize: 84,
      textAlign: 'justify',
      textJustifyLast: true,
      rtFontSize: 22,
      rtTop: -10,
      width: 288,
      x: 950,
      y: 1795,
    });

    this.atkDefLeaf.set({
      visible: this.data.type === 'monster',
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
      fontFamily: 'ygo-tip, serif',
      fontSize: 33,
      x: 66,
      y: 1940,
      zIndex: 30,
    });
  }

  drawCopyright() {
    if (!this.copyrightLeaf) {
      this.copyrightLeaf = new Image();
      this.leafer.add(this.copyrightLeaf);
    }

    const copyrightUrl = this.data.copyright ? `${this.baseImage}/copyright-${this.data.copyright}-black.svg` : '';
    this.copyrightLeaf.set({
      url: copyrightUrl,
      x: this.cardWidth - 161,
      y: 1940,
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

  get baseImage() {
    return `${this.resourcePath}/yugioh-series-2/image`;
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
      if (this.data.language === 'jp') {
        style = jpStyle;
      }
    }
    return style;
  }

  get cardUrl() {
    if (this.data.type === 'monster') {
      return `${this.baseImage}/card-${this.data.cardType}.png`;
    } else {
      return `${this.baseImage}/card-${this.data.type}.png`;
    }
  }

  get autoNameColor() {
    let color = 'black';
    // 自动颜色
    if (['spell', 'trap'].includes(this.data.type)) {
      color = 'white';
    }
    return color;
  }

  get showAttribute() {
    if (this.data.type === 'monster') {
      return !!this.data.attribute;
    }
    return true;
  }

  get attributeUrl() {
    let suffix = '';
    if (this.data.language === 'jp') {
      suffix = '-jp';
    }
    if (this.data.type === 'monster') {
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
    if (this.data.language === 'jp') {
      if (this.data.type === 'spell') {
        name = '[魔(ま)][法(ほう)]カード';
      } else if (this.data.type === 'trap') {
        name = '[罠(トラップ)]カード';
      }
    }
    return name;
  }

  get showEffect() {
    return this.data.type === 'monster' && this.data.monsterType;
  }

  get atkName() {
    let name = '';
    if (this.data.language === 'jp') {
      name = '[攻(こう)]';
    }
    return name;
  }

  get defName() {
    let name = '';
    if (this.data.language === 'jp') {
      name = '[守(しゅ)]';
    }
    return name;
  }
}
