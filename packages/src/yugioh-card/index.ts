import type { IGroup, IImage, ILeafer, IRect } from '@leafer-ui/interface';
import { Group, Image, Rect, Text } from 'leafer-unified';
import { Card, type CardOptions } from '../card/index.ts';
import type { YugiohStyle } from '../card/style-types.ts';
import { CompressText } from '../compress-text/index.ts';
import { numberToFull, leaferVisibility } from '../utils/index.ts';
import scStyle from './style/sc-style.ts';
import tcStyle from './style/tc-style.ts';
import jpStyle from './style/jp-style.ts';
import krStyle from './style/kr-style.ts';
import enStyle from './style/en-style.ts';
import astralStyle from './style/astral-style.ts';
import custom1Style from './style/custom1-style.ts';
import custom2Style from './style/custom2-style.ts';

export interface YugiohCardData {
  language: 'sc' | 'tc' | 'jp' | 'kr' | 'en' | 'astral';
  fontPreset: '' | 'custom1' | 'custom2';
  name: string;
  nameColor: string;
  nameTextAlign: 'left' | 'center' | 'right';
  applyNameGradient: boolean;
  nameGradientColor1: string;
  nameGradientColor2: string;
  cardLayout: 'monster' | 'spell' | 'trap' | 'pendulum';
  attribute: 'dark' | 'light' | 'earth' | 'water' | 'fire' | 'wind' | 'divine' | '';
  spellTrapIcon: '' | 'equip' | 'field' | 'quick-play' | 'ritual' | 'continuous' | 'counter';
  artwork: string;
  monsterFrame: 'normal' | 'effect' | 'ritual' | 'fusion' | 'synchro' | 'xyz' | 'link' | 'token';
  pendulumFrame: 'normal-pendulum' | 'effect-pendulum' | 'ritual-pendulum' | 'fusion-pendulum' | 'synchro-pendulum' | 'xyz-pendulum';
  level: number;
  rank: number;
  pendulumScale: number;
  pendulumEffect: string;
  monsterTypeLine: string;
  showStatsLine: boolean;
  atk: number;
  def: number;
  linkArrows: number[];
  cardText: string;
  compressCardTextSegments: number[];
  cardTextAlign: 'left' | 'center' | 'right' | 'justify';
  cardTextFontSizeScale: number;
  bodyTextStrokeWidth: number;
  cardNumber: string;
  password: string;
  copyrightLanguage: '' | 'sc' | 'jp' | 'en';
  cornerMark: '' | 'laser1' | 'laser2' | 'laser3' | 'laser4';
  rarity: '' | 'dt' | 'ur' | 'gr' | 'hr' | 'ser' | 'gser' | 'pser';
  show20thAnniversaryMark: boolean;
  roundCorners: boolean;
  renderScale: number;
}

const usesHalfwidthBrackets = (language: YugiohCardData['language']) => language === 'en' || language === 'kr';
const languageStyles = new Map<YugiohCardData['language'], YugiohStyle>([
  ['sc', scStyle],
  ['tc', tcStyle],
  ['jp', jpStyle],
  ['kr', krStyle],
  ['en', enStyle],
  ['astral', astralStyle],
]);

export class YugiohCard extends Card<YugiohCardData> {
  declare leafer: ILeafer;
  cardFrameNode: IImage | null = null;
  nameNode: CompressText | null = null;
  attributeNode: IImage | null = null;
  levelNode: IGroup | null = null;
  rankNode: IGroup | null = null;
  spellTrapLabelNode: IGroup | null = null;
  artworkNode: IRect | null = null;
  artworkMaskNode: IImage | null = null;
  pendulumScaleNode: IGroup | null = null;
  pendulumEffectNode: CompressText | null = null;
  cardNumberNode: CompressText | null = null;
  linkArrowsNode: IGroup | null = null;
  monsterTypeLineNode: CompressText | null = null;
  cardTextNode: CompressText | null = null;
  battleStatsNode: IGroup | null = null;
  passwordNode: CompressText | null = null;
  copyrightMarkNode: IImage | null = null;
  cornerMarkNode: IImage | null = null;
  rarityOverlayNode: IImage | null = null;
  attributeRarityOverlayNode: IImage | null = null;
  anniversaryMarkNode: IImage | null = null;
  cardWidth = 1394;
  cardHeight = 2031;

  data: YugiohCardData = {
    language: 'sc',
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
    pendulumFrame: 'normal-pendulum',
    level: 0,
    rank: 0,
    pendulumScale: 0,
    pendulumEffect: '',
    monsterTypeLine: '',
    showStatsLine: true,
    atk: 0,
    def: 0,
    linkArrows: [],
    cardText: '',
    compressCardTextSegments: [],
    cardTextAlign: 'justify',
    cardTextFontSizeScale: 1,
    bodyTextStrokeWidth: 0,
    cardNumber: '',
    password: '',
    copyrightLanguage: '',
    cornerMark: '',
    rarity: '',
    show20thAnniversaryMark: false,
    roundCorners: true,
    renderScale: 1,
  };

  constructor(data: CardOptions<YugiohCardData> = {}) {
    super(data);

    this.initLeafer();
    this.setData(data.data);
  }

  get tag() {
    return 'YugiohCard';
  }

  draw() {
    const directions = Array.isArray(this.data.linkArrows) ? this.data.linkArrows : [];
    const linkArrows = new Set(directions.filter(direction => Number.isInteger(direction) && direction >= 1 && direction <= 8));

    this.drawCardFrame();
    this.drawName();
    this.drawAttribute();
    this.drawLevel();
    this.drawRank();
    this.drawSpellTrapLabel();
    this.drawArtwork();
    this.drawArtworkMask();
    this.drawPendulumScale();
    this.drawPendulumEffect();
    this.drawCardNumber();
    this.drawLinkArrows(linkArrows);
    this.drawMonsterTypeLine();
    this.drawCardText();
    this.drawBattleStats(linkArrows.size);
    this.drawPassword();
    this.drawCopyrightMark();
    this.drawCornerMark();
    this.drawRarityOverlay();
    this.drawAttributeRarityOverlay();
    this.drawAnniversaryMark();
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
      wordSpacing: name.wordSpacing || 0,
      textAlign: this.data.nameTextAlign || 'left',
      color: this.data.nameColor || this.autoNameColor,
      gradient: this.data.applyNameGradient,
      gradientColor1: this.data.nameGradientColor1,
      gradientColor2: this.data.nameGradientColor2,
      rtFontSize: name.rtFontSize,
      rtOffsetY: name.rtOffsetY,
      rtColor: this.autoNameColor,
      width: this.showAttribute ? 1033 : 1161,
      height: 200,
      x: 116,
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
      x: 1163,
      y: 96,
      visible: this.showAttribute,
      zIndex: 10,
    });
  }

  drawLevel() {
    if (!this.levelNode) {
      this.levelNode = new Group();
      for (let i = 0; i < 13; i++) {
        const level = new Image();
        this.levelNode.add(level);
      }
      this.leafer.add(this.levelNode);
    }

    const levelUrl = `${this.baseImage}/level.png`;
    const levelWidth = 88;
    const right = this.data.level < 13 ? 147 : 101;
    this.levelNode.children.forEach((level, index) => {
      level.set({
        url: levelUrl,
        x: this.cardWidth - right - index * (levelWidth + 4),
        y: 247,
        around: { type: 'percent', x: 1, y: 0 },
        visible: index < this.data.level,
      });
    });

    this.levelNode.set({
      visible: this.showLevel,
      zIndex: 10,
    });
  }

  drawRank() {
    if (!this.rankNode) {
      this.rankNode = new Group();
      for (let i = 0; i < 13; i++) {
        const rank = new Image();
        this.rankNode.add(rank);
      }
      this.leafer.add(this.rankNode);
    }

    const rankUrl = `${this.baseImage}/rank.png`;
    const rankWidth = 88;
    const left = this.data.rank < 13 ? 147 : 101;
    this.rankNode.children.forEach((rank, index) => {
      rank.set({
        url: rankUrl,
        x: left + index * (rankWidth + 4),
        y: 247,
        visible: index < this.data.rank,
      });
    });

    this.rankNode.set({
      visible: this.showRank,
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
    const { icon } = spellTrapLabel;

    const iconUrl = this.data.spellTrapIcon ? `${this.baseImage}/icon-${this.data.spellTrapIcon}.png` : '';
    const iconWidth = this.data.spellTrapIcon ? 72 : 0;
    const trimPunctuation = this.#languageStyle?.spellTrapLabel.punctuationTrim;
    const useHalfwidth = usesHalfwidthBrackets(this.data.language);
    const leftBracket = useHalfwidth ? '[' : '【';
    const rightBracket = useHalfwidth ? ']' : '】';
    const letterSpacing = spellTrapLabel.letterSpacing || 0;
    const wordSpacing = spellTrapLabel.wordSpacing || 0;

    const [rightText, spellTrapIcon, leftText] = this.spellTrapLabelNode.children as [CompressText, IImage, CompressText];

    rightText.set({
      text: rightBracket,
      punctuationTrim: trimPunctuation ? 'end' : undefined,
      fontFamily: spellTrapLabel.fontFamily,
      sideBearingMode: spellTrapLabel.sideBearingMode,
      fontSize: spellTrapLabel.fontSize,
      letterSpacing,
      wordSpacing,
      scaleY: spellTrapLabel.scaleY || 1,
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
      wordSpacing,
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
      width: this.data.cardLayout === 'pendulum' ? 1205 : 1054,
      height: this.data.cardLayout === 'pendulum' ? 1205 : 1054,
      x: this.data.cardLayout === 'pendulum' ? 94 : 170,
      y: this.data.cardLayout === 'pendulum' ? 364 : 375,
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

    const artworkMaskUrl = this.data.cardLayout === 'pendulum' ? `${this.baseImage}/card-mask-pendulum.png` : `${this.baseImage}/card-mask.png`;
    this.artworkMaskNode.set({
      url: artworkMaskUrl,
      x: this.data.cardLayout === 'pendulum' ? 68 : 117,
      y: this.data.cardLayout === 'pendulum' ? 342 : 322,
      zIndex: 20,
    });
  }

  drawPendulumScale() {
    if (!this.pendulumScaleNode) {
      this.pendulumScaleNode = new Group();
      const leftPendulumScale = new Text();
      const rightPendulumScale = new Text();
      this.pendulumScaleNode.add(leftPendulumScale);
      this.pendulumScaleNode.add(rightPendulumScale);
      this.leafer.add(this.pendulumScaleNode);
    }

    const leftPendulumScale = this.pendulumScaleNode.children[0];
    const rightPendulumScale = this.pendulumScaleNode.children[1];

    let left = this.data.language === 'astral' ? 144 : 145;
    leftPendulumScale.set({
      text: this.data.pendulumScale,
      fontFamily: this.data.language === 'astral' ? 'ygo-astral' : 'ygo-atk-def',
      fontSize: this.data.language === 'astral' ? 84 : 98,
      fill: 'black',
      letterSpacing: this.data.language === 'astral' ? 0 : -10,
      x: left,
      y: this.data.language === 'astral' ? 1389 : 1370,
      around: { type: 'percent', x: 0.5, y: 0 },
    });

    left = this.data.language === 'astral' ? 1250 : 1249;
    rightPendulumScale.set({
      text: this.data.pendulumScale,
      fontFamily: this.data.language === 'astral' ? 'ygo-astral' : 'ygo-atk-def',
      fontSize: this.data.language === 'astral' ? 84 : 98,
      fill: 'black',
      letterSpacing: this.data.language === 'astral' ? 0 : -10,
      x: left,
      y: this.data.language === 'astral' ? 1389 : 1370,
      around: { type: 'percent', x: 0.5, y: 0 },
    });

    this.pendulumScaleNode.set({
      visible: this.data.cardLayout === 'pendulum',
      zIndex: 30,
    });
  }

  drawPendulumEffect() {
    if (!this.pendulumEffectNode) {
      this.pendulumEffectNode = new CompressText();
      this.leafer.add(this.pendulumEffectNode);
    }

    const { pendulumEffect } = this.style;

    this.pendulumEffectNode.set({
      text: this.data.pendulumEffect,
      punctuationTrim: this.#languageStyle?.pendulumEffect.punctuationTrim ? 'both' : undefined,
      fontFamily: pendulumEffect.fontFamily,
      sideBearingMode: pendulumEffect.sideBearingMode,
      fontSize: pendulumEffect.fontSize,
      fontSizeScale: this.data.cardTextFontSizeScale,
      strokeWidth: this.data.bodyTextStrokeWidth,
      lineHeight: pendulumEffect.lineHeight,
      letterSpacing: pendulumEffect.letterSpacing || 0,
      wordSpacing: pendulumEffect.wordSpacing || 0,
      rtFontSize: pendulumEffect.rtFontSize,
      rtStrokeWidth: this.data.bodyTextStrokeWidth,
      rtOffsetY: pendulumEffect.rtOffsetY,
      width: 950,
      height: 230,
      x: 221,
      y: pendulumEffect.top,
      visible: this.data.cardLayout === 'pendulum',
      zIndex: 30,
    });
  }

  drawCardNumber() {
    if (!this.cardNumberNode) {
      this.cardNumberNode = new CompressText();
      this.leafer.add(this.cardNumberNode);
    }

    this.cardNumberNode.set({
      text: this.data.cardNumber,
      fontFamily: 'ygo-password',
      fontSize: 40,
      color: this.data.cardLayout === 'monster' && this.data.monsterFrame === 'xyz' ? 'white' : 'black',
      textAlign: this.data.cardLayout === 'pendulum' ? 'left' : 'right',
      y: this.data.cardLayout === 'pendulum' ? 1859 : 1455,
      zIndex: 30,
    });
    if (this.data.cardLayout === 'pendulum') {
      this.cardNumberNode.x = 116;
    } else {
      const bounds = this.cardNumberNode.bounds;
      const right = this.data.cardLayout === 'monster' && this.data.monsterFrame === 'link' ? 252 : 148;
      this.cardNumberNode.x = this.cardWidth - right - bounds.width;
    }
  }

  drawLinkArrows(linkArrows: ReadonlySet<number>) {
    if (!this.linkArrowsNode) {
      this.linkArrowsNode = new Group();
      for (let i = 0; i < 8; i++) {
        const arrow = new Image();
        this.linkArrowsNode.add(arrow);
      }
      this.leafer.add(this.linkArrowsNode);
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

    this.linkArrowsNode.children.forEach((arrow, index) => {
      const showArrow = linkArrows.has(index + 1);
      arrow.set({
        url: showArrow ? arrowOnList[index].url : arrowOffList[index].url,
        x: showArrow ? arrowOnList[index].x : arrowOffList[index].x,
        y: showArrow ? arrowOnList[index].y : arrowOffList[index].y,
      });
    });

    this.linkArrowsNode.set({
      visible: this.data.cardLayout === 'monster' && this.data.monsterFrame === 'link',
      zIndex: 120,
    });
  }

  drawMonsterTypeLine() {
    if (!this.monsterTypeLineNode) {
      this.monsterTypeLineNode = new CompressText();
      this.leafer.add(this.monsterTypeLineNode);
    }

    const { monsterTypeLine } = this.style;
    const useHalfwidth = usesHalfwidthBrackets(this.data.language);
    const leftBracket = useHalfwidth ? '[' : '【';
    const rightBracket = useHalfwidth ? ']' : '】';

    this.monsterTypeLineNode.set({
      text: leftBracket + this.data.monsterTypeLine + rightBracket,
      punctuationTrim: this.#languageStyle?.monsterTypeLine.punctuationTrim ? 'both' : undefined,
      fontFamily: monsterTypeLine.fontFamily,
      sideBearingMode: monsterTypeLine.sideBearingMode,
      fontSize: monsterTypeLine.fontSize,
      strokeWidth: this.data.bodyTextStrokeWidth,
      lineHeight: monsterTypeLine.lineHeight,
      letterSpacing: monsterTypeLine.letterSpacing || 0,
      wordSpacing: monsterTypeLine.wordSpacing || 0,
      rtFontSize: monsterTypeLine.rtFontSize,
      rtStrokeWidth: this.data.bodyTextStrokeWidth,
      rtOffsetY: monsterTypeLine.rtOffsetY,
      width: 1172,
      height: 100,
      x: 111,
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

    let fontFamily = cardText.fontFamily;
    if (this.data.language === 'en' && !this.data.fontPreset &&
      ((this.data.cardLayout === 'monster' && this.data.monsterFrame === 'normal') || (this.data.cardLayout === 'pendulum' && this.data.pendulumFrame === 'normal-pendulum'))) {
      fontFamily = 'ygo-en-italic';
    }

    let height = 385;
    if (!['spell', 'trap'].includes(this.data.cardLayout)) {
      if (this.showMonsterTypeLine) {
        height -= monsterTypeHeight;
      }
      if (this.data.showStatsLine) {
        height -= 60;
      }
    }

    this.cardTextNode.set({
      text: this.data.cardText,
      punctuationTrim: this.#languageStyle?.cardText.punctuationTrim ? 'both' : undefined,
      fontFamily,
      sideBearingMode: cardText.sideBearingMode,
      fontSize: cardText.fontSize,
      fontSizeScale: this.data.cardTextFontSizeScale,
      textAlign: this.data.cardTextAlign,
      compressSegments: this.data.compressCardTextSegments,
      strokeWidth: this.data.bodyTextStrokeWidth,
      lineHeight: cardText.lineHeight,
      letterSpacing: cardText.letterSpacing || 0,
      wordSpacing: cardText.wordSpacing || 0,
      rtFontSize: cardText.rtFontSize,
      rtStrokeWidth: this.data.bodyTextStrokeWidth,
      rtOffsetY: cardText.rtOffsetY,
      autoSmallSize: !!cardText.smallFontSize,
      smallFontSize: cardText.smallFontSize,
      width: 1172,
      height,
      x: 111,
      y: monsterTypeLine.top + monsterTypeHeight,
      zIndex: 30,
    });
  }

  /** @param {number} linkRating */
  drawBattleStats(linkRating: number) {
    if (!this.battleStatsNode) {
      this.battleStatsNode = new Group();
      const statsLineImage = new Image();
      const atk = new Text();
      const def = new Text();
      const link = new Text();

      this.battleStatsNode.add(statsLineImage);
      this.battleStatsNode.add(atk);
      this.battleStatsNode.add(def);
      this.battleStatsNode.add(link);

      this.leafer.add(this.battleStatsNode);
    }

    const statsLineImage = this.battleStatsNode.children[0];
    const atk = this.battleStatsNode.children[1];
    const def = this.battleStatsNode.children[2];
    const link = this.battleStatsNode.children[3];
    statsLineImage.set({
      url: this.statsLineUrl,
      x: 109,
      y: 1844,
    });

    let atkText: string | number = '';
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
      fontFamily: this.data.language === 'astral' ? 'ygo-astral' : 'ygo-atk-def',
      fontSize: this.data.language === 'astral' ? 49 : 62,
      fill: 'black',
      letterSpacing: this.data.language === 'astral' ? 0 : 2,
      x: atkLeft,
      y: this.data.language === 'astral' ? 1850 : 1839,
      around: { type: 'percent', x: 1, y: 0 },
      visible: ['monster', 'pendulum'].includes(this.data.cardLayout),
    });

    let defText: string | number = '';
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
      fontFamily: this.data.language === 'astral' ? 'ygo-astral' : 'ygo-atk-def',
      fontSize: this.data.language === 'astral' ? 49 : 62,
      fill: 'black',
      letterSpacing: this.data.language === 'astral' ? 0 : 2,
      x: defLeft,
      y: this.data.language === 'astral' ? 1850 : 1839,
      around: { type: 'percent', x: 1, y: 0 },
      visible: (this.data.cardLayout === 'monster' && this.data.monsterFrame !== 'link') || this.data.cardLayout === 'pendulum',
    });

    const linkText = this.data.language === 'astral' ? numberToFull(linkRating) : linkRating;
    const linkLeft = this.data.language === 'astral' ? 1279 : 1280;
    link.set({
      text: linkText,
      fontFamily: this.data.language === 'astral' ? 'ygo-astral' : 'ygo-link',
      fontSize: this.data.language === 'astral' ? 49 : 44,
      fill: 'black',
      letterSpacing: this.data.language === 'astral' ? 0 : 2,
      x: linkLeft,
      y: this.data.language === 'astral' ? 1850 : 1855,
      around: { type: 'percent', x: 1, y: 0 },
      scaleX: this.data.language === 'astral' ? 1 : 1.3,
      visible: this.data.cardLayout === 'monster' && this.data.monsterFrame === 'link',
    });

    this.battleStatsNode.set({
      visible: this.showStatsLine,
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
      fontFamily: 'ygo-password',
      fontSize: 40,
      color: this.data.cardLayout === 'monster' && this.data.monsterFrame === 'xyz' ? 'white' : 'black',
      x: 66,
      y: 1932,
      zIndex: 30,
    });
  }

  drawCopyrightMark() {
    if (!this.copyrightMarkNode) {
      this.copyrightMarkNode = new Image();
      this.leafer.add(this.copyrightMarkNode);
    }

    const color = this.data.cardLayout === 'monster' && this.data.monsterFrame === 'xyz' ? 'white' : 'black';
    const copyrightMarkUrl = this.data.copyrightLanguage ? `${this.baseImage}/copyright-${this.data.copyrightLanguage}-${color}.svg` : '';
    this.copyrightMarkNode.set({
      url: copyrightMarkUrl,
      x: this.cardWidth - 141,
      y: 1936,
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

  drawRarityOverlay() {
    if (!this.rarityOverlayNode) {
      this.rarityOverlayNode = new Image();
      this.leafer.add(this.rarityOverlayNode);
    }

    const suffix = this.data.cardLayout === 'pendulum' ? '-pendulum' : '';
    const rarityOverlayUrl = this.data.rarity ? `${this.baseImage}/rare-${this.data.rarity}${suffix}.png` : '';

    this.rarityOverlayNode.set({
      url: rarityOverlayUrl,
      cornerRadius: this.data.roundCorners ? 24 : 0,
      visible: leaferVisibility(this.data.rarity),
      zIndex: 100,
    });
  }

  drawAttributeRarityOverlay() {
    if (!this.attributeRarityOverlayNode) {
      this.attributeRarityOverlayNode = new Image();
      this.leafer.add(this.attributeRarityOverlayNode);
    }

    const attributeRarityOverlayUrl = `${this.baseImage}/attribute-rare.png`;
    this.attributeRarityOverlayNode.set({
      url: attributeRarityOverlayUrl,
      x: 1163,
      y: 96,
      visible: this.showAttributeRarityOverlay,
      zIndex: 30,
    });
  }

  drawAnniversaryMark() {
    if (!this.anniversaryMarkNode) {
      this.anniversaryMarkNode = new Image();
      this.leafer.add(this.anniversaryMarkNode);
    }

    const anniversaryMarkUrl = `${this.baseImage}/twentieth.png`;
    this.anniversaryMarkNode.set({
      url: anniversaryMarkUrl,
      x: 472,
      y: 1532,
      visible: this.data.show20thAnniversaryMark,
      zIndex: 10,
    });
  }

  get baseImage() {
    return `${this.resourcePath}/yugioh/image`;
  }

  get #languageStyle() {
    return languageStyles.get(this.data.language);
  }

  get style() {
    const { fontPreset } = this.data;
    if (fontPreset === 'custom1') return custom1Style;
    if (fontPreset === 'custom2') return custom2Style;
    if (!fontPreset) return this.#languageStyle ?? ({} as YugiohStyle);
    return {} as YugiohStyle;
  }

  get cardFrameUrl() {
    if (this.data.cardLayout === 'monster') {
      return `${this.baseImage}/card-${this.data.monsterFrame}.png`;
    } else if (this.data.cardLayout === 'pendulum') {
      return `${this.baseImage}/card-${this.data.pendulumFrame}.png`;
    } else {
      return `${this.baseImage}/card-${this.data.cardLayout}.png`;
    }
  }

  get autoNameColor() {
    let color = 'black';
    // 自动颜色
    if ((this.data.cardLayout === 'monster' && ['xyz', 'link'].includes(this.data.monsterFrame)) || ['spell', 'trap'].includes(this.data.cardLayout) ||
      (this.data.cardLayout === 'pendulum' && ['xyz-pendulum', 'link-pendulum'].includes(this.data.pendulumFrame))) {
      color = 'white';
    }
    return color;
  }

  get showAttribute() {
    if (['monster', 'pendulum'].includes(this.data.cardLayout)) {
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
    if (['monster', 'pendulum'].includes(this.data.cardLayout)) {
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
    } else if (this.data.language === 'tc') {
      if (this.data.cardLayout === 'spell') {
        name = '魔法卡';
      } else if (this.data.cardLayout === 'trap') {
        name = '陷阱卡';
      }
    } else if (this.data.language === 'jp') {
      if (this.data.cardLayout === 'spell') {
        name = '[魔(ま)][法(ほう)]カード';
      } else if (this.data.cardLayout === 'trap') {
        name = '[罠(トラップ)]カード';
      }
    } else if (this.data.language === 'kr') {
      if (this.data.cardLayout === 'spell') {
        name = '마법 카드';
      } else if (this.data.cardLayout === 'trap') {
        name = '함정 카드';
      }
    } else if (this.data.language === 'en') {
      if (this.data.cardLayout === 'spell') {
        name = 'Spell Card';
      } else if (this.data.cardLayout === 'trap') {
        name = 'Trap Card';
      }
    } else if (this.data.language === 'astral') {
      if (this.data.cardLayout === 'spell') {
        name = 'マホウカアド';
      } else if (this.data.cardLayout === 'trap') {
        name = 'トラププカアド';
      }
    }
    return name;
  }

  get showAttributeRarityOverlay() {
    return this.showAttribute && ['hr', 'ser', 'gser', 'pser'].includes(this.data.rarity);
  }

  get showLevel() {
    let show = false;
    if (this.data.cardLayout === 'monster') {
      show = ['normal', 'effect', 'ritual', 'fusion', 'synchro', 'token'].includes(this.data.monsterFrame);
    } else if (this.data.cardLayout === 'pendulum') {
      show = ['normal-pendulum', 'effect-pendulum', 'ritual-pendulum', 'fusion-pendulum', 'synchro-pendulum'].includes(this.data.pendulumFrame);
    }
    return show;
  }

  get showRank() {
    let show = false;
    if (this.data.cardLayout === 'monster') {
      show = this.data.monsterFrame === 'xyz';
    } else if (this.data.cardLayout === 'pendulum') {
      show = this.data.pendulumFrame === 'xyz-pendulum';
    }
    return show;
  }

  get showMonsterTypeLine() {
    return ['monster', 'pendulum'].includes(this.data.cardLayout) && this.data.monsterTypeLine;
  }

  get showStatsLine() {
    if (!this.data.showStatsLine) {
      return false;
    } else if (this.data.language === 'astral') {
      if ((this.data.cardLayout === 'monster' && this.data.monsterFrame !== 'link') || this.data.cardLayout === 'pendulum') {
        return true;
      }
      if (this.data.cardLayout === 'monster' && this.data.monsterFrame === 'link') {
        return true;
      }
    } else {
      if ((this.data.cardLayout === 'monster' && this.data.monsterFrame !== 'link') || this.data.cardLayout === 'pendulum') {
        return true;
      }
      if (this.data.cardLayout === 'monster' && this.data.monsterFrame === 'link') {
        return true;
      }
    }
    return false;
  }

  get statsLineUrl() {
    let url = '';
    if (this.data.language === 'astral') {
      if ((this.data.cardLayout === 'monster' && this.data.monsterFrame !== 'link') || this.data.cardLayout === 'pendulum') {
        url = `${this.baseImage}/atk-def-astral.svg`;
      }
      if (this.data.cardLayout === 'monster' && this.data.monsterFrame === 'link') {
        url = `${this.baseImage}/atk-link-astral.svg`;
      }
    } else {
      if ((this.data.cardLayout === 'monster' && this.data.monsterFrame !== 'link') || this.data.cardLayout === 'pendulum') {
        url = `${this.baseImage}/atk-def.svg`;
      }
      if (this.data.cardLayout === 'monster' && this.data.monsterFrame === 'link') {
        url = `${this.baseImage}/atk-link.svg`;
      }
    }
    return url;
  }
}
