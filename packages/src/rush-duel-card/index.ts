import type { IGroup, IImage, ILeafer, IRect } from '@leafer-ui/interface';
import { Group, Image, Rect, Text } from 'leafer-unified';
import { Card, type CardOptions } from '../card/index.ts';
import { leaferVisibility } from '../utils/index.ts';
import type { RushDuelStyle } from '../card/style-types.ts';
import { CompressText } from '../compress-text/index.ts';
import scStyle from './style/sc-style.ts';
import jpStyle from './style/jp-style.ts';

export interface RushDuelCardData {
  language: 'sc' | 'jp';
  name: string;
  nameColor: string;
  cardLayout: 'monster' | 'spell' | 'trap';
  attribute: 'dark' | 'light' | 'earth' | 'water' | 'fire' | 'wind' | 'divine' | '';
  spellTrapIcon: '' | 'equip' | 'field' | 'quick-play' | 'ritual' | 'continuous' | 'counter';
  artwork: string;
  monsterFrame: 'normal' | 'effect' | 'ritual' | 'fusion';
  level: number;
  monsterTypeLine: string;
  maximumAtk: number;
  atk: number;
  def: number;
  cardText: string;
  compressCardTextSegments: number[];
  cardTextAlign: 'left' | 'center' | 'right' | 'justify';
  bodyTextFontSizeScale: number;
  bodyTextStrokeWidth: number;
  cardNumber: string;
  password: string;
  showLegendMark: boolean;
  cornerMark: '' | 'laser1' | 'laser2' | 'laser3' | 'laser4';
  rarity: '' | 'sr' | 'rr' | 'pser';
  roundCorners: boolean;
  renderScale: number;
}

export class RushDuelCard extends Card<RushDuelCardData> {
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
  maximumAtkNode: IGroup | null = null;
  battleStatsNode: IGroup | null = null;
  legendMarkNode: IImage | null = null;
  cornerMarkNode: IImage | null = null;
  rarityOverlayNode: IImage | null = null;
  cardWidth = 1394;
  cardHeight = 2031;

  data: RushDuelCardData = {
    language: 'sc',
    name: '',
    nameColor: '',
    cardLayout: 'monster',
    attribute: 'dark',
    spellTrapIcon: '',
    artwork: '',
    monsterFrame: 'normal',
    level: 0,
    monsterTypeLine: '',
    maximumAtk: 0,
    atk: 0,
    def: 0,
    cardText: '',
    compressCardTextSegments: [],
    cardTextAlign: 'justify',
    bodyTextFontSizeScale: 1,
    bodyTextStrokeWidth: 0,
    cardNumber: '',
    password: '',
    showLegendMark: false,
    cornerMark: '',
    rarity: '',
    roundCorners: true,
    renderScale: 1,
  };

  constructor(data: CardOptions<RushDuelCardData> = {}) {
    super(data);

    this.initLeafer();
    this.setData(data.data);
  }

  get tag() {
    return 'RushDuelCard';
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
    this.drawMaximumAtk();
    this.drawBattleStats();
    this.drawLegendMark();
    this.drawCornerMark();
    this.drawRarityOverlay();
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
      this.nameNode = new CompressText({ rtFontFamily: 'rd-tip' });
      this.leafer.add(this.nameNode);
    }
    this.nameNode.set({
      text: this.data.name,
      fontFamily: name.fontFamily,
      fontSize: name.fontSize,
      letterSpacing: name.letterSpacing || 0,
      color: this.data.nameColor || 'black',
      rtFontSize: name.rtFontSize,
      rtOffsetY: name.rtOffsetY,
      width: this.showAttribute ? 1025 : 1248,
      height: 200,
      x: 71,
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
      x: 1138,
      y: 68,
      visible: this.showAttribute,
      zIndex: 30,
    });
  }

  drawLevel() {
    if (!this.levelNode) {
      this.levelNode = new Group();
      const levelImage = new Image();
      const levelText = new Text();
      this.levelNode.add(levelImage);
      this.levelNode.add(levelText);
      this.leafer.add(this.levelNode);
    }

    const levelImage = this.levelNode.children[0];
    const levelText = this.levelNode.children[1];

    const levelUrl = `${this.baseImage}/level.png`;
    levelImage.set({
      url: levelUrl,
      x: 80,
      y: 1216,
    });

    levelText.set({
      text: this.data.level,
      fontFamily: 'rd-atk-def',
      fontSize: 116,
      fill: 'white',
      stroke: '#D3100D',
      strokeWidth: 10,
      x: 191,
      y: 1291,
      around: { type: 'percent', x: 0.5, y: 0 },
    });

    this.levelNode.set({
      visible: this.data.cardLayout === 'monster',
      zIndex: 40,
    });
  }

  drawSpellTrapLabel() {
    if (!this.spellTrapLabelNode) {
      this.spellTrapLabelNode = new Group();

      const leftText = new CompressText({ rtFontFamily: 'rd-tip' });
      const spellTrapIcon = new Image();
      const rightText = new CompressText({ rtFontFamily: 'rd-tip' });

      this.spellTrapLabelNode.add(leftText);
      this.spellTrapLabelNode.add(spellTrapIcon);
      this.spellTrapLabelNode.add(rightText);

      this.leafer.add(this.spellTrapLabelNode);
    }

    const { spellTrapLabel } = this.style;
    const { icon } = spellTrapLabel;

    const iconUrl = this.data.spellTrapIcon ? `${this.baseImage}/icon-${this.data.spellTrapIcon}.png` : '';
    const iconWidth = this.data.spellTrapIcon ? 60 : 0;
    const leftBracket = '【';
    const rightBracket = '】';
    const letterSpacing = spellTrapLabel.letterSpacing || 0;

    const [leftText, spellTrapIcon, rightText] = this.spellTrapLabelNode.children as [CompressText, IImage, CompressText];

    leftText.set({
      text: leftBracket + this.spellTrapName,
      punctuationTrim: spellTrapLabel.punctuationTrim ? 'start' : undefined,
      fontFamily: spellTrapLabel.fontFamily,
      fontSize: spellTrapLabel.fontSize,
      fontWeight: spellTrapLabel.fontWeight,
      letterSpacing,
      rtFontSize: spellTrapLabel.rtFontSize,
      rtOffsetY: spellTrapLabel.rtOffsetY,
      x: 99,
      y: spellTrapLabel.top,
    });
    const leftBounds = leftText.bounds;

    spellTrapIcon.set({
      url: iconUrl,
      x: leftText.x + (this.data.spellTrapIcon ? (icon.marginLeft || 0) : 0) + leftBounds.width,
      y: spellTrapLabel.top + (icon.marginTop || 0),
    });

    rightText.set({
      text: rightBracket,
      punctuationTrim: spellTrapLabel.punctuationTrim ? 'end' : undefined,
      fontFamily: spellTrapLabel.fontFamily,
      fontSize: spellTrapLabel.fontSize,
      fontWeight: spellTrapLabel.fontWeight,
      letterSpacing,
      x: spellTrapIcon.x! + (this.data.spellTrapIcon ? (icon.marginRight || 0) : 0) + iconWidth,
      y: spellTrapLabel.top,
    });

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
      width: 1254,
      height: 1258,
      x: 70,
      y: 200,
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
    this.artworkMaskNode.set({
      url: this.artworkMaskUrl,
      x: 70,
      y: 197,
      zIndex: 20,
    });
  }

  drawCardNumber() {
    if (!this.cardNumberNode) {
      this.cardNumberNode = new CompressText({ rtFontFamily: 'rd-tip' });
      this.leafer.add(this.cardNumberNode);
    }

    this.cardNumberNode.set({
      text: this.data.cardNumber,
      fontFamily: 'rd-tip',
      fontSize: 33,
      color: 'white',
      textAlign: 'right',
      scaleX: 0.9,
      y: 1914,
      zIndex: 30,
    });
    const bounds = this.cardNumberNode.bounds;
    this.cardNumberNode.x = this.cardWidth - 130 - bounds.width;
  }

  drawMonsterTypeLine() {
    if (!this.monsterTypeLineNode) {
      this.monsterTypeLineNode = new CompressText({ rtFontFamily: 'rd-tip' });
      this.leafer.add(this.monsterTypeLineNode);
    }

    const { monsterTypeLine } = this.style;

    const leftBracket = '【';
    const rightBracket = '】';

    this.monsterTypeLineNode.set({
      text: leftBracket + this.data.monsterTypeLine + rightBracket,
      punctuationTrim: monsterTypeLine.punctuationTrim ? 'both' : undefined,
      fontFamily: monsterTypeLine.fontFamily,
      fontSize: monsterTypeLine.fontSize,
      fontWeight: monsterTypeLine.fontWeight,
      strokeWidth: this.data.bodyTextStrokeWidth,
      letterSpacing: monsterTypeLine.letterSpacing || 0,
      rtFontSize: monsterTypeLine.rtFontSize,
      rtStrokeWidth: this.data.bodyTextStrokeWidth,
      rtOffsetY: monsterTypeLine.rtOffsetY,
      width: 1000,
      height: 80,
      x: 99,
      y: monsterTypeLine.top,
      visible: leaferVisibility(this.data.cardLayout === 'monster' && this.data.monsterTypeLine),
      zIndex: 30,
    });
  }

  drawCardText() {
    if (!this.cardTextNode) {
      this.cardTextNode = new CompressText({ rtFontFamily: 'rd-tip' });
      this.leafer.add(this.cardTextNode);
    }

    const { cardText } = this.style;

    this.cardTextNode.set({
      text: this.data.cardText,
      punctuationTrim: cardText.punctuationTrim ? 'both' : undefined,
      fontFamily: cardText.fontFamily,
      fontSize: cardText.fontSize,
      fontSizeScale: this.data.bodyTextFontSizeScale,
      textAlign: this.data.cardTextAlign,
      compressSegments: this.data.compressCardTextSegments,
      strokeWidth: this.data.bodyTextStrokeWidth,
      lineHeight: cardText.lineHeight,
      letterSpacing: cardText.letterSpacing || 0,
      rtFontSize: cardText.rtFontSize,
      rtStrokeWidth: this.data.bodyTextStrokeWidth,
      rtOffsetY: cardText.rtOffsetY,
      width: 1196,
      height: 350,
      x: 99,
      y: cardText.top,
      zIndex: 30,
    });
  }

  drawMaximumAtk() {
    if (!this.maximumAtkNode) {
      this.maximumAtkNode = new Group();
      const maximumAtkImage = new Image();
      const maximumAtkText = new Text();
      this.maximumAtkNode.add(maximumAtkImage);
      this.maximumAtkNode.add(maximumAtkText);
      this.leafer.add(this.maximumAtkNode);
    }

    const maximumAtkImage = this.maximumAtkNode.children[0];
    const maximumAtkText = this.maximumAtkNode.children[1];

    const maximumAtkUrl = `${this.baseImage}/maximum-atk.png`;
    maximumAtkImage.set({
      url: maximumAtkUrl,
      x: 191,
      y: 1253,
    });

    maximumAtkText.set({
      text: this.data.maximumAtk,
      fontFamily: 'rd-atk-def',
      fontSize: 97,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 3,
      letterSpacing: -6,
      x: this.cardWidth - 229,
      y: 1247,
      around: { type: 'percent', x: 1, y: 0 },
    });

    this.maximumAtkNode.set({
      visible: leaferVisibility(this.data.cardLayout === 'monster' && this.data.maximumAtk),
      zIndex: 30,
    });
  }

  drawBattleStats() {
    if (!this.battleStatsNode) {
      this.battleStatsNode = new Group();
      const statsLineImage = new Image();
      const atkText = new Text();
      const defText = new Text();

      this.battleStatsNode.add(statsLineImage);
      this.battleStatsNode.add(atkText);
      this.battleStatsNode.add(defText);

      this.leafer.add(this.battleStatsNode);
    }

    const statsLineImage = this.battleStatsNode.children[0];
    const atkText = this.battleStatsNode.children[1];
    const defText = this.battleStatsNode.children[2];

    const atkDefUrl = `${this.baseImage}/atk-def.png`;
    statsLineImage.set({
      url: atkDefUrl,
      x: 186,
      y: 1355,
    });

    atkText.set({
      text: this.data.atk >= 0 ? this.data.atk : '?',
      fontFamily: 'rd-atk-def',
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
      fontFamily: 'rd-atk-def',
      fontSize: 97,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 3,
      letterSpacing: -6,
      x: this.cardWidth - 229,
      y: 1349,
      around: { type: 'percent', x: 1, y: 0 },
    });

    this.battleStatsNode.set({
      visible: this.data.cardLayout === 'monster',
      zIndex: 30,
    });
  }

  drawLegendMark() {
    if (!this.legendMarkNode) {
      this.legendMarkNode = new Image();
      this.leafer.add(this.legendMarkNode);
    }

    const legendMarkUrl = this.data.showLegendMark ? `${this.baseImage}/legend.png` : '';
    this.legendMarkNode.set({
      url: legendMarkUrl,
      x: 84,
      y: 210,
      visible: this.data.showLegendMark,
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

  drawRarityOverlay() {
    if (!this.rarityOverlayNode) {
      this.rarityOverlayNode = new Image();
      this.leafer.add(this.rarityOverlayNode);
    }

    const rarityOverlayUrl = this.data.rarity ? `${this.baseImage}/rare-${this.data.rarity}.png` : '';

    this.rarityOverlayNode.set({
      url: rarityOverlayUrl,
      cornerRadius: this.data.roundCorners ? 24 : 0,
      visible: leaferVisibility(this.data.rarity),
      zIndex: 100,
    });
  }

  get baseImage() {
    return `${this.resourcePath}/rush-duel/image`;
  }

  get style() {
    let style = {} as RushDuelStyle;
    if (this.data.language === 'sc') {
      style = scStyle;
    } else if (this.data.language === 'jp') {
      style = jpStyle;
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
    if (this.data.language === 'sc') {
      if (this.data.cardLayout === 'spell') {
        name = '魔法卡';
      } else if (this.data.cardLayout === 'trap') {
        name = '陷阱卡';
      }
      if (this.data.spellTrapIcon === 'equip') {
        name += '/装备';
      } else if (this.data.spellTrapIcon === 'field') {
        name += '/场地';
      } else if (this.data.spellTrapIcon === 'quick-play') {
        name += '/速攻';
      } else if (this.data.spellTrapIcon === 'ritual') {
        name += '/仪式';
      } else if (this.data.spellTrapIcon === 'continuous') {
        name += '/永续';
      } else if (this.data.spellTrapIcon === 'counter') {
        name += '/反击';
      }
    } else if (this.data.language === 'jp') {
      if (this.data.cardLayout === 'spell') {
        name = '[魔(ま)][法(ほう)]カード';
      } else if (this.data.cardLayout === 'trap') {
        name = '[罠(トラップ)]カード';
      }
      if (this.data.spellTrapIcon === 'equip') {
        name += '／[装(そう)][備(び)]';
      } else if (this.data.spellTrapIcon === 'field') {
        name += '／フィールド';
      } else if (this.data.spellTrapIcon === 'quick-play') {
        name += '／[速(そっ)][攻(こう)]';
      } else if (this.data.spellTrapIcon === 'ritual') {
        name += '／[儀(ぎ)][式(しき)]';
      } else if (this.data.spellTrapIcon === 'continuous') {
        name += '／[永(えい)][続(ぞく)]';
      } else if (this.data.spellTrapIcon === 'counter') {
        name += '／カウンター';
      }
    }
    return name;
  }

  get artworkMaskUrl() {
    if (this.data.cardLayout === 'monster') {
      return `${this.baseImage}/card-mask-${this.data.monsterFrame}.png`;
    } else {
      return `${this.baseImage}/card-mask-${this.data.cardLayout}.png`;
    }
  }
}
