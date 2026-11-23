import type { IGroup, IImage, ILeafer, IRect } from '@leafer-ui/interface';
import { Group, Image, Rect } from 'leafer-unified';
import { Card, type CardOptions } from '../card/index.ts';
import { leaferVisibility } from '../utils/index.ts';
import type { Series2Style } from '../card/style-types.ts';
import { CompressText } from '../compress-text/index.ts';
import jpStyle from './style/jp-style.ts';
import custom1Style from './style/custom1-style.ts';
import custom2Style from './style/custom2-style.ts';

export interface YugiohSeries2CardData {
  language: 'jp';
  fontPreset: '' | 'custom1' | 'custom2';
  name: string;
  nameColor: string;
  nameTextAlign: 'left' | 'center' | 'right';
  applyNameGradient: boolean;
  nameGradientColor1: string;
  nameGradientColor2: string;
  cardLayout: 'monster' | 'spell' | 'trap';
  attribute: 'dark' | 'light' | 'earth' | 'water' | 'fire' | 'wind' | 'divine' | '';
  spellTrapIcon: '' | 'equip' | 'field' | 'quick-play' | 'ritual' | 'continuous' | 'counter';
  artwork: string;
  monsterFrame: 'normal' | 'effect' | 'ritual' | 'fusion' | 'tormentor' | 'sky-dragon' | 'winged-dragon';
  level: number;
  monsterTypeLine: string;
  atk: number;
  def: number;
  cardText: string;
  compressCardTextSegments: number[];
  cardTextAlign: 'left' | 'center' | 'right' | 'justify';
  cardTextFontSizeScale: number;
  bodyTextStrokeWidth: number;
  cardNumber: string;
  password: string;
  copyrightLanguage: '' | 'jp';
  cornerMark: '' | 'laser1' | 'laser2' | 'laser3' | 'laser4';
  roundCorners: boolean;
  renderScale: number;
}

export class YugiohSeries2Card extends Card<YugiohSeries2CardData> {
  declare leafer: ILeafer;
  cardFrameNode: IImage | null = null;
  nameNode: CompressText | null = null;
  attributeNode: IImage | null = null;
  levelNode: IGroup | null = null;
  spellTrapLabelNode: IGroup | null = null;
  artworkNode: IRect | null = null;
  artworkMaskNode: IImage | null = null;
  cardNumberNode: CompressText | null = null;
  monsterTypeLineNode: CompressText | null = null;
  cardTextNode: CompressText | null = null;
  battleStatsNode: IGroup | null = null;
  passwordNode: CompressText | null = null;
  copyrightMarkNode: IImage | null = null;
  cornerMarkNode: IImage | null = null;
  cardWidth = 1394;
  cardHeight = 2031;

  data: YugiohSeries2CardData = {
    language: 'jp',
    fontPreset: '',
    name: '',
    nameColor: '',
    nameTextAlign: 'left',
    applyNameGradient: false,
    nameGradientColor1: '#999999',
    nameGradientColor2: '#ffffff',
    cardLayout: 'monster',
    attribute: 'dark',
    spellTrapIcon: '',
    artwork: '',
    monsterFrame: 'normal',
    level: 0,
    monsterTypeLine: '',
    atk: 0,
    def: 0,
    cardText: '',
    compressCardTextSegments: [],
    cardTextAlign: 'justify',
    cardTextFontSizeScale: 1,
    bodyTextStrokeWidth: 0,
    cardNumber: '',
    password: '',
    copyrightLanguage: '',
    cornerMark: '',
    roundCorners: true,
    renderScale: 1,
  };

  constructor(data: CardOptions<YugiohSeries2CardData> = {}) {
    super(data);

    this.initLeafer();
    this.setData(data.data);
  }

  get tag() {
    return 'YugiohSeries2Card';
  }

  draw() {
    this.drawCardFrame();
    this.drawName();
    this.drawAttribute();
    this.drawLevel();
    this.drawSpellTrapLabel();
    this.drawArtwork();
    this.drawArtworkMask();
    this.drawCardNumber();
    this.drawMonsterTypeLine();
    this.drawCardText();
    this.drawBattleStats();
    this.drawPassword();
    this.drawCopyrightMark();
    this.drawCornerMark();
    this.applyCardScale();
  }

  drawCardFrame() {
    if (!this.cardFrameNode) {
      this.cardFrameNode = new Image();
      this.leafer.add(this.cardFrameNode);
    }
    this.cardFrameNode.set({
      url: this.cardFrameUrl,
      cornerRadius: this.data.roundCorners ? 24 : 0,
      zIndex: 0,
    });
  }

  drawName() {
    const { name } = this.style;

    if (!this.nameNode) {
      this.nameNode = new CompressText();
      this.leafer.add(this.nameNode);
    }
    this.nameNode.set({
      text: this.data.name,
      fontFamily: name.fontFamily,
      sideBearingMode: name.sideBearingMode,
      fontSize: name.fontSize,
      letterSpacing: name.letterSpacing || 0,
      textAlign: this.data.nameTextAlign || 'left',
      color: this.data.nameColor || this.autoNameColor,
      gradient: this.data.applyNameGradient,
      gradientColor1: this.data.nameGradientColor1,
      gradientColor2: this.data.nameGradientColor2,
      rtFontSize: name.rtFontSize,
      rtOffsetY: name.rtOffsetY,
      rtColor: this.autoNameColor,
      width: this.showAttribute ? 953 : 1104,
      height: 200,
      x: 147,
      y: name.top,
      zIndex: 10,
    });
  }

  drawAttribute() {
    if (!this.attributeNode) {
      this.attributeNode = new Image();
      this.leafer.add(this.attributeNode);
    }
    this.attributeNode.set({
      url: this.attributeUrl,
      x: 1119,
      y: 128,
      visible: this.showAttribute,
      zIndex: 10,
    });
  }

  drawLevel() {
    if (!this.levelNode) {
      this.levelNode = new Group();
      for (let i = 0; i < 12; i++) {
        const level = new Image();
        this.levelNode.add(level);
      }
      this.leafer.add(this.levelNode);
    }

    const levelUrl = `${this.baseImage}/level.png`;
    const levelWidth = 92;
    const right = this.data.level < 12 ? 172 : 129;
    this.levelNode.children.forEach((level, index) => {
      level.set({
        url: levelUrl,
        x: this.cardWidth - right - index * (levelWidth + 3),
        y: 314,
        around: { type: 'percent', x: 1, y: 0 },
        visible: index < this.data.level,
      });
    });

    this.levelNode.set({
      visible: this.data.cardLayout === 'monster',
      zIndex: 10,
    });
  }

  drawSpellTrapLabel() {
    if (!this.spellTrapLabelNode) {
      this.spellTrapLabelNode = new Group();

      const rightText = new CompressText();
      const spellTrapIcon = new Image();
      const leftText = new CompressText();

      this.spellTrapLabelNode.add(rightText);
      this.spellTrapLabelNode.add(spellTrapIcon);
      this.spellTrapLabelNode.add(leftText);

      this.leafer.add(this.spellTrapLabelNode);
    }

    const { spellTrapLabel } = this.style;
    const trimPunctuation = jpStyle.spellTrapLabel.punctuationTrim;
    const { icon } = spellTrapLabel;

    const iconUrl = this.data.spellTrapIcon ? `${this.baseImage}/icon-${this.data.spellTrapIcon}.png` : '';
    const iconWidth = this.data.spellTrapIcon ? 72 : 0;
    const leftBracket = '【';
    const rightBracket = '】';
    const letterSpacing = spellTrapLabel.letterSpacing || 0;

    const [rightText, spellTrapIcon, leftText] = this.spellTrapLabelNode.children as [CompressText, IImage, CompressText];

    rightText.set({
      text: rightBracket,
      punctuationTrim: trimPunctuation ? 'end' : undefined,
      fontFamily: spellTrapLabel.fontFamily,
      sideBearingMode: spellTrapLabel.sideBearingMode,
      fontSize: spellTrapLabel.fontSize,
      letterSpacing,
      y: spellTrapLabel.top,
    });
    const rightBounds = rightText.bounds;
    rightText.x = this.cardWidth - spellTrapLabel.right - rightBounds.width;

    spellTrapIcon.set({
      url: iconUrl,
      x: rightText.x - (this.data.spellTrapIcon ? (icon.marginRight || 0) : 0) - iconWidth,
      y: spellTrapLabel.top + (icon.marginTop || 0),
    });

    leftText.set({
      text: leftBracket + this.spellTrapName,
      punctuationTrim: trimPunctuation ? 'start' : undefined,
      fontFamily: spellTrapLabel.fontFamily,
      sideBearingMode: spellTrapLabel.sideBearingMode,
      fontSize: spellTrapLabel.fontSize,
      letterSpacing,
      scaleY: spellTrapLabel.scaleY || 1,
      rtFontSize: spellTrapLabel.rtFontSize,
      rtOffsetY: spellTrapLabel.rtOffsetY,
      rtScaleXOverride: spellTrapLabel.rtScaleXOverride ?? null,
      y: spellTrapLabel.top,
    });
    const leftBounds = leftText.bounds;
    leftText.x = spellTrapIcon.x! - (this.data.spellTrapIcon ? (icon.marginLeft || 0) : 0) - leftBounds.width;

    this.spellTrapLabelNode.set({
      visible: ['spell', 'trap'].includes(this.data.cardLayout),
      zIndex: 10,
    });
  }

  drawArtwork() {
    if (!this.artworkNode) {
      this.artworkNode = new Rect();
      this.leafer.add(this.artworkNode);
    }

    this.artworkNode.set({
      width: 990,
      height: 1100,
      x: 202,
      y: 468,
      fill: {
        type: 'image',
        url: this.data.artwork,
        mode: 'cover',
        align: 'top',
      },
      visible: leaferVisibility(this.data.artwork),
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
      x: 143,
      y: 414,
      zIndex: 20,
    });
  }

  drawCardNumber() {
    if (!this.cardNumberNode) {
      this.cardNumberNode = new CompressText();
      this.leafer.add(this.cardNumberNode);
    }

    this.cardNumberNode.set({
      text: this.data.cardNumber,
      fontFamily: 'ygo-tip',
      fontSize: 33,
      y: 1601,
      zIndex: 30,
    });
    const bounds = this.cardNumberNode.bounds;
    this.cardNumberNode.x = this.cardWidth - 170 - bounds.width;
  }

  drawMonsterTypeLine() {
    if (!this.monsterTypeLineNode) {
      this.monsterTypeLineNode = new CompressText();
      this.leafer.add(this.monsterTypeLineNode);
    }

    const { monsterTypeLine } = this.style;

    const leftBracket = '【';
    const rightBracket = '】';

    this.monsterTypeLineNode.set({
      text: leftBracket + this.data.monsterTypeLine + rightBracket,
      punctuationTrim: jpStyle.monsterTypeLine.punctuationTrim ? 'both' : undefined,
      fontFamily: monsterTypeLine.fontFamily,
      sideBearingMode: monsterTypeLine.sideBearingMode,
      fontSize: monsterTypeLine.fontSize,
      strokeWidth: this.data.bodyTextStrokeWidth,
      lineHeight: monsterTypeLine.lineHeight,
      letterSpacing: monsterTypeLine.letterSpacing || 0,
      rtFontSize: monsterTypeLine.rtFontSize,
      rtStrokeWidth: this.data.bodyTextStrokeWidth,
      rtOffsetY: monsterTypeLine.rtOffsetY,
      width: this.data.cardLayout === 'monster' ? 710 : 1095,
      height: 70,
      x: 149,
      y: monsterTypeLine.top,
      visible: leaferVisibility(this.showMonsterTypeLine),
      zIndex: 30,
    });
  }

  drawCardText() {
    if (!this.cardTextNode) {
      this.cardTextNode = new CompressText();
      this.leafer.add(this.cardTextNode);
    }

    const { monsterTypeLine, cardText } = this.style;

    let monsterTypeHeight = monsterTypeLine.minHeight || 0;
    if (this.showMonsterTypeLine) {
      monsterTypeHeight = monsterTypeLine.fontSize * monsterTypeLine.lineHeight;
    }

    this.cardTextNode.set({
      text: this.data.cardText,
      punctuationTrim: jpStyle.cardText.punctuationTrim ? 'both' : undefined,
      fontFamily: cardText.fontFamily,
      sideBearingMode: cardText.sideBearingMode,
      fontSize: cardText.fontSize,
      fontSizeScale: this.data.cardTextFontSizeScale,
      textAlign: this.data.cardTextAlign,
      compressSegments: this.data.compressCardTextSegments,
      strokeWidth: this.data.bodyTextStrokeWidth,
      lineHeight: cardText.lineHeight,
      letterSpacing: cardText.letterSpacing || 0,
      rtFontSize: cardText.rtFontSize,
      rtStrokeWidth: this.data.bodyTextStrokeWidth,
      rtOffsetY: cardText.rtOffsetY,
      width: this.data.cardLayout === 'monster' ? 710 : 1095,
      height: ['spell', 'trap'].includes(this.data.cardLayout) ? 240 : 170,
      x: 149,
      y: monsterTypeLine.top + monsterTypeHeight,
      zIndex: 30,
    });
  }

  drawBattleStats() {
    if (!this.battleStatsNode) {
      this.battleStatsNode = new Group();
      const atk = new CompressText();
      const def = new CompressText();

      this.battleStatsNode.add(atk);
      this.battleStatsNode.add(def);

      this.leafer.add(this.battleStatsNode);
    }

    const atk = this.battleStatsNode.children[0];
    const def = this.battleStatsNode.children[1];

    let atkText: string | number = '';
    if (this.data.atk >= 0) {
      atkText = this.data.atk;
    } else if (this.data.atk === -1) {
      atkText = '????';
    } else if (this.data.atk === -2) {
      atkText = 'X000';
    }
    atk.set({
      text: this.atkName + atkText,
      fontFamily: 'ygo-jp',
      sideBearingMode: jpStyle.sideBearingMode,
      fontSize: 84,
      textAlign: 'justify',
      textJustifyLast: true,
      rtFontSize: 22,
      rtOffsetY: -10,
      width: 288,
      x: 950,
      y: 1688,
    });

    let defText: string | number = '';
    if (this.data.def >= 0) {
      defText = this.data.def;
    } else if (this.data.def === -1) {
      defText = '????';
    } else if (this.data.def === -2) {
      defText = 'X000';
    }
    def.set({
      text: this.defName + defText,
      fontFamily: 'ygo-jp',
      sideBearingMode: jpStyle.sideBearingMode,
      fontSize: 84,
      textAlign: 'justify',
      textJustifyLast: true,
      rtFontSize: 22,
      rtOffsetY: -10,
      width: 288,
      x: 950,
      y: 1795,
    });

    this.battleStatsNode.set({
      visible: this.data.cardLayout === 'monster',
      zIndex: 30,
    });
  }

  drawPassword() {
    if (!this.passwordNode) {
      this.passwordNode = new CompressText();
      this.leafer.add(this.passwordNode);
    }

    this.passwordNode.set({
      text: this.data.password,
      fontFamily: 'ygo-tip',
      fontSize: 33,
      x: 66,
      y: 1940,
      zIndex: 30,
    });
  }

  drawCopyrightMark() {
    if (!this.copyrightMarkNode) {
      this.copyrightMarkNode = new Image();
      this.leafer.add(this.copyrightMarkNode);
    }

    const copyrightMarkUrl = this.data.copyrightLanguage ? `${this.baseImage}/copyright-${this.data.copyrightLanguage}-black.svg` : '';
    this.copyrightMarkNode.set({
      url: copyrightMarkUrl,
      x: this.cardWidth - 161,
      y: 1940,
      around: { type: 'percent', x: 1, y: 0 },
      visible: leaferVisibility(this.data.copyrightLanguage),
      zIndex: 30,
    });
  }

  drawCornerMark() {
    if (!this.cornerMarkNode) {
      this.cornerMarkNode = new Image();
      this.leafer.add(this.cornerMarkNode);
    }

    const cornerMarkUrl = this.data.cornerMark ? `${this.baseImage}/${this.data.cornerMark}.png` : '';
    this.cornerMarkNode.set({
      url: cornerMarkUrl,
      x: 1276,
      y: 1913,
      visible: leaferVisibility(this.data.cornerMark),
      zIndex: 120,
    });
  }

  get baseImage() {
    return `${this.resourcePath}/yugioh-series-2/image`;
  }

  get style() {
    let style = {} as Series2Style;
    if (this.data.fontPreset) {
      if (this.data.fontPreset === 'custom1') {
        style = custom1Style;
      } else if (this.data.fontPreset === 'custom2') {
        style = custom2Style;
      }
    } else {
      if (this.data.language === 'jp') {
        style = jpStyle;
      }
    }
    return style;
  }

  get cardFrameUrl() {
    if (this.data.cardLayout === 'monster') {
      return `${this.baseImage}/card-${this.data.monsterFrame}.png`;
    } else {
      return `${this.baseImage}/card-${this.data.cardLayout}.png`;
    }
  }

  get autoNameColor() {
    let color = 'black';
    // 自动颜色
    if (['spell', 'trap'].includes(this.data.cardLayout)) {
      color = 'white';
    }
    return color;
  }

  get showAttribute() {
    if (this.data.cardLayout === 'monster') {
      return !!this.data.attribute;
    }
    return true;
  }

  get attributeUrl() {
    let suffix = '';
    if (this.data.language === 'jp') {
      suffix = '-jp';
    }
    if (this.data.cardLayout === 'monster') {
      if (!this.data.attribute) {
        return '';
      }
      return `${this.baseImage}/attribute-${this.data.attribute}${suffix}.png`;
    } else {
      return `${this.baseImage}/attribute-${this.data.cardLayout}${suffix}.png`;
    }
  }

  get spellTrapName() {
    let name = '';
    if (this.data.language === 'jp') {
      if (this.data.cardLayout === 'spell') {
        name = '[魔(ま)][法(ほう)]カード';
      } else if (this.data.cardLayout === 'trap') {
        name = '[罠(トラップ)]カード';
      }
    }
    return name;
  }

  get showMonsterTypeLine() {
    return this.data.cardLayout === 'monster' && this.data.monsterTypeLine;
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
