import { Card } from '../card';
import { Group, Image, Text } from 'leafer-ui';
import { CompressText } from 'leafer-compress-text';
import scStyle from './style/sc-style';
import jpStyle from './style/jp-style';

export class RushDuelCard extends Card {
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
  maximumAtkLeaf = null;
  atkDefLeaf = null;
  legendLeaf = null;
  laserLeaf = null;
  rareLeaf = null;
  cardWidth = 1394;
  cardHeight = 2031;

  data = {
    language: 'sc',
    name: '',
    color: '',
    type: 'monster',
    attribute: 'dark',
    icon: '',
    image: '',
    cardType: 'normal',
    level: 0,
    monsterType: '',
    maximumAtk: 0,
    atk: 0,
    def: 0,
    description: '',
    firstLineCompress: false,
    descriptionAlign: false,
    descriptionZoom: 1,
    descriptionWeight: 0,
    package: '',
    password: '',
    legend: false,
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
    this.drawMaximumAtk();
    this.drawAtkDef();
    this.drawLegend();
    this.drawLaser();
    this.drawRare();
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
      color: this.data.color || 'black',
      rtFontSize: name.rtFontSize,
      rtTop: name.rtTop,
      width: this.showAttribute ? 1025 : 1248,
      height: 200,
      x: 71,
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
      x: 1138,
      y: 68,
      visible: this.showAttribute,
      zIndex: 30,
    });
  }

  drawLevel() {
    if (!this.levelLeaf) {
      this.levelLeaf = new Group();
      const levelImage = new Image();
      const levelText = new Text();
      this.levelLeaf.add(levelImage);
      this.levelLeaf.add(levelText);
      this.leafer.add(this.levelLeaf);
    }

    const levelImage = this.levelLeaf.children[0];
    const levelText = this.levelLeaf.children[1];

    const levelUrl = `${this.baseImage}/level.png`;
    levelImage.set({
      url: levelUrl,
      x: 80,
      y: 1216,
    });

    levelText.set({
      text: this.data.level,
      fontFamily: 'rd-atk-def, sans-serif',
      fontSize: 116,
      fill: 'white',
      stroke: '#D3100D',
      strokeWidth: 10,
      x: 191,
      y: 1291,
      around: { type: 'percent', x: 0.5, y: 0 },
    });

    this.levelLeaf.set({
      visible: this.data.type === 'monster',
      zIndex: 40,
    });
  }

  drawSpellTrap() {
    if (!this.spellTrapLeaf) {
      this.spellTrapLeaf = new Group();

      const leftText = new CompressText();
      const spellTrapIcon = new Image();
      const rightText = new CompressText();

      this.spellTrapLeaf.add(leftText);
      this.spellTrapLeaf.add(spellTrapIcon);
      this.spellTrapLeaf.add(rightText);

      this.leafer.add(this.spellTrapLeaf);
    }

    const { spellTrap } = this.style;
    const { icon } = spellTrap;

    const iconUrl = this.data.icon ? `${this.baseImage}/icon-${this.data.icon}.png` : '';
    const iconWidth = this.data.icon ? 60 : 0;
    const leftBracket = '【';
    const rightBracket = '】';
    const letterSpacing = spellTrap.letterSpacing || 0;

    const leftText = this.spellTrapLeaf.children[0];
    const spellTrapIcon = this.spellTrapLeaf.children[1];
    const rightText = this.spellTrapLeaf.children[2];

    leftText.set({
      text: leftBracket + this.spellTrapName,
      fontFamily: spellTrap.fontFamily,
      fontSize: spellTrap.fontSize,
      fontWeight: spellTrap.fontWeight,
      letterSpacing,
      rtFontSize: spellTrap.rtFontSize,
      rtTop: spellTrap.rtTop,
      x: 99,
      y: spellTrap.top,
    });
    const leftBounds = leftText.bounds;

    spellTrapIcon.set({
      url: iconUrl,
      x: leftText.x + (this.data.icon ? (icon.marginLeft || 0) : 0) + leftBounds.width,
      y: spellTrap.top + (icon.marginTop || 0),
    });

    rightText.set({
      text: rightBracket,
      fontFamily: spellTrap.fontFamily,
      fontSize: spellTrap.fontSize,
      fontWeight: spellTrap.fontWeight,
      letterSpacing,
      x: spellTrapIcon.x + (this.data.icon ? (icon.marginRight || 0) : 0) + iconWidth,
      y: spellTrap.top,
    });

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
      width: 1254,
      height: 1258,
      x: 70,
      y: 200,
      visible: this.data.image,
      zIndex: 10,
    });
  }

  drawMask() {
    if (!this.maskLeaf) {
      this.maskLeaf = new Image();
      this.leafer.add(this.maskLeaf);
    }
    this.maskLeaf.set({
      url: this.maskUrl,
      x: 70,
      y: 197,
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
      fontFamily: 'rd-tip, sans-serif',
      fontSize: 33,
      color: 'white',
      textAlign: 'right',
      scaleX: 0.9,
      y: 1914,
      zIndex: 30,
    });
    const bounds = this.packageLeaf.bounds;
    this.packageLeaf.x = this.cardWidth - 130 - bounds.width;
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
      fontWeight: effect.fontWeight,
      strokeWidth: this.data.descriptionWeight,
      letterSpacing: effect.letterSpacing || 0,
      rtFontSize: effect.rtFontSize,
      rtTop: effect.rtTop,
      width: 1000,
      height: 80,
      x: 99 + (effect.textIndent || 0),
      y: effect.top,
      visible: this.data.type === 'monster' && this.data.monsterType,
      zIndex: 30,
    });
  }

  drawDescription() {
    if (!this.descriptionLeaf) {
      this.descriptionLeaf = new CompressText();
      this.leafer.add(this.descriptionLeaf);
    }

    const { description } = this.style;

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
      width: 1196,
      height: 350,
      x: 99,
      y: description.top,
      zIndex: 30,
    });
  }

  drawMaximumAtk() {
    if (!this.maximumAtkLeaf) {
      this.maximumAtkLeaf = new Group();
      const maximumAtkImage = new Image();
      const maximumAtkText = new Text();
      this.maximumAtkLeaf.add(maximumAtkImage);
      this.maximumAtkLeaf.add(maximumAtkText);
      this.leafer.add(this.maximumAtkLeaf);
    }

    const maximumAtkImage = this.maximumAtkLeaf.children[0];
    const maximumAtkText = this.maximumAtkLeaf.children[1];

    const maximumAtkUrl = `${this.baseImage}/maximum-atk.png`;
    maximumAtkImage.set({
      url: maximumAtkUrl,
      x: 191,
      y: 1253,
    });

    maximumAtkText.set({
      text: this.data.maximumAtk,
      fontFamily: 'rd-atk-def, sans-serif',
      fontSize: 97,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 3,
      letterSpacing: -6,
      x: this.cardWidth - 229,
      y: 1247,
      around: { type: 'percent', x: 1, y: 0 },
    });

    this.maximumAtkLeaf.set({
      visible: this.data.type === 'monster' && this.data.maximumAtk,
      zIndex: 30,
    });
  }

  drawAtkDef() {
    if (!this.atkDefLeaf) {
      this.atkDefLeaf = new Group();
      const atkDefImage = new Image();
      const atkText = new Text();
      const defText = new Text();

      this.atkDefLeaf.add(atkDefImage);
      this.atkDefLeaf.add(atkText);
      this.atkDefLeaf.add(defText);

      this.leafer.add(this.atkDefLeaf);
    }

    const atkDefImage = this.atkDefLeaf.children[0];
    const atkText = this.atkDefLeaf.children[1];
    const defText = this.atkDefLeaf.children[2];

    const atkDefUrl = `${this.baseImage}/atk-def.png`;
    atkDefImage.set({
      url: atkDefUrl,
      x: 186,
      y: 1355,
    });

    atkText.set({
      text: this.data.atk >= 0 ? this.data.atk : '?',
      fontFamily: 'rd-atk-def, sans-serif',
      fontSize: 97,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 3,
      letterSpacing: -6,
      x: this.cardWidth - 656,
      y: 1349,
      around: { type: 'percent', x: 1, y: 0 },
    });

    defText.set({
      text: this.data.def >= 0 ? this.data.def : '?',
      fontFamily: 'rd-atk-def, sans-serif',
      fontSize: 97,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 3,
      letterSpacing: -6,
      x: this.cardWidth - 229,
      y: 1349,
      around: { type: 'percent', x: 1, y: 0 },
    });

    this.atkDefLeaf.set({
      visible: this.data.type === 'monster',
      zIndex: 30,
    });
  }

  drawLegend() {
    if (!this.legendLeaf) {
      this.legendLeaf = new Image();
      this.leafer.add(this.legendLeaf);
    }

    const legendUrl = this.data.legend ? `${this.baseImage}/legend.png` : '';
    this.legendLeaf.set({
      url: legendUrl,
      x: 84,
      y: 210,
      visible: this.data.legend,
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

    const rareUrl = this.data.rare ? `${this.baseImage}/rare-${this.data.rare}.png` : '';

    this.rareLeaf.set({
      url: rareUrl,
      cornerRadius: this.data.radius ? 24 : 0,
      visible: this.data.rare,
      zIndex: 100,
    });
  }

  get baseImage() {
    return `${this.resourcePath}/rush-duel/image`;
  }

  get style() {
    let style = {};
    if (this.data.language === 'sc') {
      style = scStyle;
    } else if (this.data.language === 'jp') {
      style = jpStyle;
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
    if (this.data.language === 'sc') {
      if (this.data.type === 'spell') {
        name = '魔法卡';
      } else if (this.data.type === 'trap') {
        name = '陷阱卡';
      }
      if (this.data.icon === 'equip') {
        name += '/装备';
      } else if (this.data.icon === 'field') {
        name += '/场地';
      } else if (this.data.icon === 'quick-play') {
        name += '/速攻';
      } else if (this.data.icon === 'ritual') {
        name += '/仪式';
      } else if (this.data.icon === 'continuous') {
        name += '/永续';
      } else if (this.data.icon === 'counter') {
        name += '/反击';
      }
    } else if (this.data.language === 'jp') {
      if (this.data.type === 'spell') {
        name = '[魔(ま)][法(ほう)]カード';
      } else if (this.data.type === 'trap') {
        name = '[罠(トラップ)]カード';
      }
      if (this.data.icon === 'equip') {
        name += '／[装(そう)][備(び)]';
      } else if (this.data.icon === 'field') {
        name += '／フィールド';
      } else if (this.data.icon === 'quick-play') {
        name += '／[速(そっ)][攻(こう)]';
      } else if (this.data.icon === 'ritual') {
        name += '／[儀(ぎ)][式(しき)]';
      } else if (this.data.icon === 'continuous') {
        name += '／[永(えい)][続(ぞく)]';
      } else if (this.data.icon === 'counter') {
        name += '／カウンター';
      }
    }
    return name;
  }

  get maskUrl() {
    if (this.data.type === 'monster') {
      return `${this.baseImage}/card-mask-${this.data.cardType}.png`;
    } else {
      return `${this.baseImage}/card-mask-${this.data.type}.png`;
    }
  }
}
