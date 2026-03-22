import { Group, Text } from 'leafer-unified';
import { isBrowser } from '../utils/index.js';
import { splitBreakWordWithBracket } from './split-break-word.js';

const rubyTokenPattern = /(\[[^\[\]()]*\([^\[\]()]*\)])/g;
const rubyRtPattern = /^\[([^\[\]()]+)\(([^\[\]()]*)\)]$/;

export class CompressText extends Group {
  constructor(data = {}) {
    super();
    this.baseLineHeight = 1.15; // 基础行高
    this.noCompressText = '●①②③④⑤⑥⑦⑧⑨⑩'; // 不压缩的文本
    this.parseList = []; // 解析后的文本列表
    this.flatItemList = []; // 平铺后的文本项列表
    this.newlineList = []; // 根据换行符分割的文本列表
    this.rubyList = []; // 平铺后的ruby列表
    this.rubyLineMap = new Map(); // 按行分组的ruby列表
    this.currentX = 0; // 当前行的x坐标
    this.currentY = 0; // 当前行的y坐标
    this.currentLine = 0; // 当前行数
    this.textScale = 1; // 文本缩放比例
    this.firstLineTextScale = 1; // 首行文本缩放比例
    this.isSmallSize = false; // 是否是小文字
    this.group = null; // Leafer文本组
    this.needCompressTwice = false; // 是否需要二次压缩
    this.bounds = {}; // 宽高信息

    this.defaultData = {
      text: '',
      fontFamily: 'ygo-sc',
      fontSize: 24,
      fontWeight: 'normal',
      lineHeight: this.baseLineHeight,
      letterSpacing: 0,
      wordSpacing: 0,
      firstLineCompress: false,
      textAlign: 'justify',
      textJustifyLast: false,
      color: 'black',
      strokeWidth: 0,
      gradient: false,
      gradientColor1: '#999999',
      gradientColor2: '#ffffff',
      rtFontFamily: 'ygo-tip',
      rtFontSize: 13,
      rtFontWeight: 'bold',
      rtLineHeight: this.baseLineHeight,
      rtLetterSpacing: 0,
      rtTop: -9,
      rtColor: 'black',
      rtStrokeWidth: 0,
      rtFontScaleX: 1,
      fontScale: 1,
      autoSmallSize: false,
      smallFontSize: 18,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      zIndex: 0,
    };

    this.initData(data);

    if (isBrowser) {
      document.fonts.ready.then(() => {
        setTimeout(() => {
          this.compressText();
        }, 250);
      });
    }
  }

  set(data = {}) {
    let needCompressText = false;
    Object.keys(data).forEach(key => {
      const value = data[key] ?? this.defaultData[key];
      if (!Object.is(this[key], value)) {
        this[key] = value;
        needCompressText = true;
      }
    });
    if (needCompressText) {
      this.compressText();
    }
  }

  initData(data = {}) {
    this.set(Object.assign(this.defaultData, data));
  }

  // 解析与缓存

  // 获取解析后的文本列表
  getParseList() {
    const list = [];
    let bold = false;
    const text = String(this.text).trimEnd();
    // 正则的捕获圆括号不要随意修改
    text.split(new RegExp(`(<b>|</b>|\n|[${this.noCompressText}])`)).filter(value => value).forEach(value => {
      if (value === '<b>') {
        bold = true;
        return;
      }
      if (value === '</b>') {
        bold = false;
        return;
      }
      const splitList = splitBreakWordWithBracket(value);
      splitList.forEach(value => {
        const itemList = [];
        value.split(rubyTokenPattern).filter(value => value).forEach(value => {
          let rubyText = value;
          let rtText = '';
          const rubyRtMatch = value.match(rubyRtPattern);
          if (rubyRtMatch) {
            rubyText = rubyRtMatch[1];
            rtText = rubyRtMatch[2];
          }
          const item = {
            ruby: {
              text: rubyText,
              bold,
            },
            rt: {
              text: rtText,
            },
          };
          itemList.push(item);
        });
        list.push(itemList);
      });
    });
    return list;
  }

  // 获取换行列表
  getNewlineList() {
    const list = [[]];
    let currentIndex = 0;
    this.parseList.forEach(itemList => {
      const hasBreak = itemList.some(item => item.ruby.text === '\n');
      list[currentIndex].push(itemList);
      if (hasBreak) {
        currentIndex++;
        list[currentIndex] = [];
      }
    });
    return list;
  }

  getCurrentFontSize() {
    return this.isSmallSize ? this.smallFontSize : this.fontSize;
  }

  getPaddingWidth(ruby) {
    return (ruby.paddingLeft || 0) + (ruby.paddingRight || 0);
  }

  isSplittablePlainTextItem(item) {
    return !item.rt.text && item.ruby.text !== '\n' && Array.from(item.ruby.text).length > 1;
  }

  resetCompressionState() {
    this.textScale = 1;
    this.firstLineTextScale = 1;
    this.isSmallSize = false;
    this.needCompressTwice = false;
  }

  rebuildParseCache() {
    this.parseList = this.getParseList();
    this.newlineList = this.getNewlineList();
    this.updateLayoutCache();
  }

  resetGroup() {
    if (this.group) {
      this.group.destroy();
    }
    this.group = new Group();
  }

  // 文本叶子创建与测量

  createPlainTextItem(text, bold = false) {
    return {
      ruby: {
        text,
        bold,
      },
      rt: {
        text: '',
      },
    };
  }

  getTextCharList(text) {
    return Array.from(text);
  }

  getTextCharLength(text) {
    return this.getTextCharList(text).length;
  }

  createMeasuredPlainTextItem(text, bold = false) {
    const item = this.createPlainTextItem(text, bold);
    this.createRubyLeaf(item.ruby);
    return item;
  }

  destroyRubyLeaf(ruby) {
    if (ruby?.rubyLeaf) {
      ruby.rubyLeaf.destroy();
    }
  }

  getRubyTextStyle(ruby) {
    return {
      text: ruby.text,
      fontFamily: this.fontFamily,
      fontSize: this.fontSize * this.fontScale,
      fontWeight: ruby.bold ? 'bold' : this.fontWeight,
      lineHeight: this.fontSize * this.lineHeight * this.fontScale,
      fill: this.color,
      stroke: this.strokeWidth ? this.color : null,
      strokeWidth: this.strokeWidth,
      strokeAlign: 'center',
      letterSpacing: this.letterSpacing,
    };
  }

  getRtTextStyle(rt) {
    return {
      text: rt.text,
      fontFamily: this.rtFontFamily,
      fontSize: this.rtFontSize * this.fontScale,
      fontWeight: this.rtFontWeight,
      lineHeight: this.rtFontSize * this.rtLineHeight * this.fontScale,
      fill: this.rtColor,
      stroke: this.rtStrokeWidth ? this.color : null,
      strokeWidth: this.rtStrokeWidth,
      strokeAlign: 'center',
      letterSpacing: this.rtLetterSpacing,
    };
  }

  createRubyLeaf(ruby) {
    const rubyLeaf = new Text(this.getRubyTextStyle(ruby));
    const bounds = rubyLeaf.textDrawData.bounds;
    const spacingWidth = ruby.text === ' ' ? this.wordSpacing : 0;

    ruby.rubyLeaf = rubyLeaf;
    ruby.originalWidth = bounds.width + spacingWidth;
    ruby.originalHeight = bounds.height;
    ruby.width = ruby.originalWidth;
    ruby.height = ruby.originalHeight;

    return rubyLeaf;
  }

  createRtLeaf(rt) {
    const rtLeaf = new Text(this.getRtTextStyle(rt));
    const bounds = rtLeaf.textDrawData.bounds;

    rt.rtLeaf = rtLeaf;
    rt.originalWidth = bounds.width;
    rt.originalHeight = bounds.height;
    rt.width = bounds.width;
    rt.height = bounds.height;

    return rtLeaf;
  }

  relayoutAfterRtCompression() {
    this.updateTextScale();
    this.compressRuby();
    this.alignRuby();
    this.flatItemList.forEach(item => {
      this.positionRt(item);
    });
  }

  updateLayoutCache() {
    this.flatItemList = this.parseList.flat();
    this.rubyList = this.flatItemList.map(item => item.ruby);
  }

  updateRubyLineMap() {
    const rubyLineMap = new Map();
    this.rubyList.forEach(ruby => {
      if (ruby.line < 0) {
        return;
      }
      if (!rubyLineMap.has(ruby.line)) {
        rubyLineMap.set(ruby.line, []);
      }
      rubyLineMap.get(ruby.line).push(ruby);
    });
    this.rubyLineMap = rubyLineMap;
  }

  // 获取压缩文本
  compressText() {
    this.resetCompressionState();
    this.rebuildParseCache();
    this.resetGroup();
    this.createRuby();
    this.compressRuby();
    this.alignRuby();
    this.createRt();
    this.createGradient();
    this.createBounds();
    this.add(this.group);
  }

  // 创建文本
  createRuby() {
    this.rubyList.forEach(ruby => {
      this.createRubyLeaf(ruby);
    });
    this.applyOverflowFallback();
    this.rubyList.forEach(ruby => {
      this.group.add(ruby.rubyLeaf);
    });
    this.updateTextScale();
  }

  // 超宽回退处理

  findLargestFittingTextSegment(textList, start, bold) {
    let low = start;
    let high = textList.length;
    let bestItem = null;

    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      const nextItem = this.createMeasuredPlainTextItem(textList.slice(start, mid).join(''), bold);

      if (nextItem.ruby.width <= this.width) {
        this.destroyRubyLeaf(bestItem?.ruby);
        bestItem = nextItem;
        low = mid;
      } else {
        this.destroyRubyLeaf(nextItem.ruby);
        high = mid - 1;
      }
    }

    return bestItem ?? this.createMeasuredPlainTextItem(textList[start], bold);
  }

  // 仅在单个纯文本片段自身超宽时，才回退到按宽度切段的布局路径
  splitPlainTextItemIntoFittingSegments(item) {
    const textList = this.getTextCharList(item.ruby.text);
    const itemList = [];
    let start = 0;

    while (start < textList.length) {
      const bestItem = this.findLargestFittingTextSegment(textList, start, item.ruby.bold);

      itemList.push([bestItem]);
      start += this.getTextCharLength(bestItem.ruby.text);
    }

    return itemList;
  }

  expandItemForOverflowFallback(item) {
    if (this.isSplittablePlainTextItem(item)) {
      this.destroyRubyLeaf(item.ruby);
      return this.splitPlainTextItemIntoFittingSegments(item);
    }

    return [[item]];
  }

  splitOversizedItemList(itemList) {
    return itemList.flatMap(item => this.expandItemForOverflowFallback(item));
  }

  applyOverflowFallbackToItemList(itemList) {
    const itemWidth = this.getItemWidth(itemList);
    const canSplit = itemList.some(item => this.isSplittablePlainTextItem(item));

    if (itemWidth <= this.width || !canSplit) {
      return [itemList];
    }

    return this.splitOversizedItemList(itemList);
  }

  applyOverflowFallback() {
    if (!this.width) {
      return;
    }

    const nextNewlineList = this.newlineList.map(newline => {
      return newline.flatMap(itemList => this.applyOverflowFallbackToItemList(itemList));
    });

    this.newlineList = nextNewlineList;
    this.parseList = nextNewlineList.flat();
    this.updateLayoutCache();
  }

  getFirstLineScale() {
    const firstNewlineRubyList = this.newlineList[0].map(itemList => itemList.map(item => item.ruby)).flat();
    let firstNewlineTotalWidth = 0;
    let maxWidth = this.width;

    firstNewlineRubyList.forEach(ruby => {
      firstNewlineTotalWidth += ruby.originalWidth;
      maxWidth -= this.getPaddingWidth(ruby);
    });

    if (!firstNewlineTotalWidth) {
      return 1;
    }

    return Math.min(Math.floor(maxWidth / firstNewlineTotalWidth * 1000) / 1000, 1);
  }

  doesOverflowHeight(lastRuby) {
    return this.height && lastRuby && this.currentY + lastRuby.height > this.height;
  }

  // 压缩与对齐

  // 压缩文本
  compressRuby() {
    if (this.firstLineCompress && this.width) {
      // 首行压缩
      this.firstLineTextScale = this.getFirstLineScale();
      this.updateTextScale();
    }
    const lastRuby = this.rubyList[this.rubyList.length - 1];
    if (this.doesOverflowHeight(lastRuby)) {
      // 用二分法获取最大的scale，精度0.01
      let scale = 0.5;
      let start = 0;
      let end = this.textScale;
      while (scale > 0) {
        scale = (start + end) / 2;
        this.textScale = scale;
        this.updateTextScale();
        this.doesOverflowHeight(lastRuby) ? end = scale : start = scale;
        if (!this.doesOverflowHeight(lastRuby) && end - start <= 0.01) {
          // 如果是autoSmallSize，字体判断缩小，当字号大于1不执行
          if (this.autoSmallSize && scale < 0.7 && this.fontScale <= 1 && !this.isSmallSize) {
            this.isSmallSize = true;
            this.updateFontSize();
            scale = 0.5;
            start = 0;
            end = 1;
          } else {
            break;
          }
        }
      }
    }
  }

  // 对齐ruby
  getAlignLineCount() {
    return this.textScale < 1 || ['center', 'right'].includes(this.textAlign) || this.textJustifyLast ? this.currentLine + 1 : this.currentLine;
  }

  getLineRemainWidth(lineList) {
    const lastRuby = lineList[lineList.length - 1];
    const lastRubyLeaf = lastRuby.rubyLeaf;
    const lastPaddingRight = lastRuby.paddingRight || 0;

    return this.width - lastRubyLeaf.x - lastRuby.width - lastPaddingRight;
  }

  offsetRubyLine(lineList, offsetStep) {
    lineList.forEach((ruby, index) => {
      ruby.rubyLeaf.x += offsetStep(index);
    });
  }

  alignCenterLine(lineList, remainWidth) {
    this.offsetRubyLine(lineList, () => remainWidth / 2);
  }

  alignRightLine(lineList, remainWidth) {
    this.offsetRubyLine(lineList, () => remainWidth);
  }

  alignJustifyLine(lineList, remainWidth) {
    if (lineList.length <= 1 || lineList[lineList.length - 1].text === '\n') {
      return;
    }

    const gap = remainWidth / (lineList.length - 1);
    this.offsetRubyLine(lineList, index => index * gap);
  }

  alignRubyLine(lineList, remainWidth) {
    if (this.textAlign === 'center') {
      this.alignCenterLine(lineList, remainWidth);
    } else if (this.textAlign === 'right') {
      this.alignRightLine(lineList, remainWidth);
    } else if (this.textAlign === 'justify') {
      this.alignJustifyLine(lineList, remainWidth);
    }
  }

  alignRuby() {
    const alignLine = this.getAlignLineCount();
    for (let line = 0; line < alignLine; line++) {
      const lineList = this.rubyLineMap.get(line);
      if (!lineList?.length) {
        continue;
      }
      const remainWidth = this.getLineRemainWidth(lineList);
      if (remainWidth > 0) {
        this.alignRubyLine(lineList, remainWidth);
      }
    }
  }

  // 创建注音
  createRt() {
    this.flatItemList.forEach(item => {
      const rt = item.rt;
      if (rt.text) {
        const rtLeaf = this.createRtLeaf(rt);
        this.positionRt(item);
        this.group.add(rtLeaf);
      }
    });
    // 如果需要再次压缩
    if (this.needCompressTwice) {
      this.relayoutAfterRtCompression();
    }
  }

  updateRubyScale(ruby, scale) {
    const rubyLeaf = ruby.rubyLeaf;
    rubyLeaf.scaleX = scale;
    ruby.width = ruby.originalWidth * scale;
  }

  getItemWidth(itemList) {
    let itemWidth = 0;

    itemList.forEach(item => {
      const ruby = item.ruby;
      itemWidth += ruby.width + this.getPaddingWidth(ruby);
    });

    return itemWidth;
  }

  // 布局流程

  updateItemRubyScale(itemList, newlineIndex, lastNewline) {
    itemList.forEach(item => {
      const ruby = item.ruby;
      if (this.firstLineCompress && newlineIndex === 0) {
        // 首行压缩到一行
        this.updateRubyScale(ruby, this.firstLineTextScale);
      } else if (!this.noCompressText.includes(ruby.text) && lastNewline) {
        // 只压缩最后一行
        this.updateRubyScale(ruby, this.textScale);
      } else {
        this.updateRubyScale(ruby, 1);
      }
    });
  }

  resetLayoutPosition() {
    this.currentX = 0;
    this.currentY = 0;
    this.currentLine = 0;
  }

  shouldWrapItemList(itemList, itemWidth) {
    const hasBreak = itemList.some(item => item.ruby.text === '\n');
    const isOverWidth = this.width && this.currentX && this.currentX + itemWidth > this.width;

    return hasBreak || isOverWidth;
  }

  positionItemListRuby(itemList) {
    itemList.forEach(item => {
      this.positionRuby(item.ruby);
    });
  }

  layoutItemList(itemList, newlineIndex, lastNewline) {
    this.updateItemRubyScale(itemList, newlineIndex, lastNewline);
    const itemWidth = this.getItemWidth(itemList);

    if (this.shouldWrapItemList(itemList, itemWidth)) {
      this.addLine();
    }

    this.positionItemListRuby(itemList);
  }

  layoutNewlineItems(newline, newlineIndex) {
    const lastNewline = newlineIndex === this.newlineList.length - 1;

    newline.forEach(itemList => {
      this.layoutItemList(itemList, newlineIndex, lastNewline);
    });
  }

  // 更新文本压缩
  updateTextScale() {
    this.resetLayoutPosition();

    this.newlineList.forEach((newline, newlineIndex) => {
      this.layoutNewlineItems(newline, newlineIndex);
    });
    this.updateRubyLineMap();
  }

  // 更新文本大小
  updateFontSize() {
    this.textScale = 1;
    const fontSize = this.getCurrentFontSize();
    const sizePercent = fontSize / this.fontSize;
    this.rubyList.forEach(ruby => {
      const rubyLeaf = ruby.rubyLeaf;
      rubyLeaf.fontSize = fontSize * this.fontScale;
      rubyLeaf.lineHeight = fontSize * this.lineHeight * this.fontScale;
      ruby.originalWidth *= sizePercent;
      ruby.originalHeight *= sizePercent;
      ruby.width *= sizePercent;
      ruby.height *= sizePercent;
    });
    this.updateTextScale();
  }

  // 定位Ruby
  positionRuby(ruby) {
    const paddingLeft = ruby.paddingLeft || 0;
    const paddingRight = ruby.paddingRight || 0;
    const rubyLeaf = ruby.rubyLeaf;
    rubyLeaf.x = this.currentX + paddingLeft;
    rubyLeaf.y = this.currentY;
    this.currentX += ruby.width + paddingLeft + paddingRight;
    ruby.line = ruby.text === '\n' ? this.currentLine - 1 : this.currentLine;
  }

  // 添加行
  addLine() {
    this.removeLineLastSpace(this.currentLine);
    const fontSize = this.getCurrentFontSize();
    this.currentX = 0;
    this.currentY += fontSize * this.lineHeight * this.fontScale;
    this.currentLine++;
  }

  // 删除行尾空格
  removeLineLastSpace(line) {
    for (let index = this.rubyList.length - 1; index >= 0; index--) {
      const ruby = this.rubyList[index];
      if (ruby.line !== line) {
        continue;
      }
      if (ruby.text !== ' ') {
        break;
      }
      const rubyLeaf = ruby.rubyLeaf;
      const paddingLeft = ruby.paddingLeft || 0;
      const paddingRight = ruby.paddingRight || 0;
      this.currentX -= ruby.width + paddingLeft + paddingRight;
      rubyLeaf.destroy();
      ruby.line = -1;
    }
  }

  // 注音布局

  // 定位rt
  positionRt(item) {
    const rtStretchRate = 0.9;
    const rtCompressRate = 0.6;
    const ruby = item.ruby;
    const rt = item.rt;
    const rtLeaf = rt.rtLeaf;
    if (rtLeaf) {
      const rubyLeaf = ruby.rubyLeaf;
      const paddingLeft = ruby.paddingLeft || 0;
      const paddingRight = ruby.paddingRight || 0;
      const rubyWidth = ruby.width + paddingLeft + paddingRight;

      rtLeaf.around = { type: 'percent', x: 0.5, y: 0 };
      rtLeaf.x = rubyLeaf.x + rubyWidth / 2 - paddingLeft;
      rtLeaf.y = rubyLeaf.y + this.rtTop * this.fontScale;

      if (this.rtFontScaleX !== 1) {
        // 特殊情况不做压缩，只居中对齐
        rtLeaf.scaleX = this.rtFontScaleX;
      } else if (rt.width / rubyWidth < rtStretchRate && ruby.text.length > 1) {
        // 拉伸两端对齐
        const maxLetterSpacing = this.fontSize - this.rtFontSize / 2;
        const newLetterSpacing = (rubyWidth * rtStretchRate - rt.width) / (rt.text.length - 1);
        rtLeaf.letterSpacing = Math.min(newLetterSpacing, maxLetterSpacing);
        rtLeaf.x += rtLeaf.letterSpacing / 2;
      } else if (rt.width > rubyWidth) {
        // 压缩
        if (rubyWidth / rt.width < rtCompressRate) {
          // 防止过度压缩，加宽ruby
          // 公式：(rubyWidth + widen) / rtWidth = rtCompressRate
          const widen = rtCompressRate * rt.width - rubyWidth;
          rtLeaf.scaleX = rtCompressRate;
          ruby.paddingLeft = Math.min(widen / 2, 5);
          ruby.paddingRight = Math.min(widen / 2, 5);
          this.needCompressTwice = true;
        } else {
          rtLeaf.scaleX = rubyWidth / rt.width;
        }
      }
    }
  }

  // 视觉效果与边界

  // 创建渐变
  createGradient() {
    if (this.gradient) {
      const fontSize = this.getCurrentFontSize();
      this.rubyList.forEach(ruby => {
        const rubyLeaf = ruby.rubyLeaf;
        rubyLeaf.set({
          fill: {
            type: 'linear',
            stops: [
              { offset: 0, color: this.gradientColor1 },
              { offset: 0.4, color: this.gradientColor2 },
              { offset: 0.55, color: this.gradientColor2 },
              { offset: 0.6, color: this.gradientColor1 },
              { offset: 0.75, color: this.gradientColor2 },
            ],
          },
          stroke: 'rgba(0, 0, 0, 0.6)',
          strokeWidth: fontSize * 0.025 * this.fontScale,
          strokeAlign: 'outside',
          shadow: {
            blur: fontSize * 0.015 * this.fontScale,
            x: 0,
            y: fontSize * 0.025 * this.fontScale,
            color: 'rgba(0, 0, 0, 0.6)',
          },
        });
      });
    }
  }

  // 创建元素信息
  createBounds() {
    this.bounds = {
      width: 0,
      height: 0,
    };
    this.rubyLineMap.forEach(lineList => {
      const lastRuby = lineList[lineList.length - 1];
      const lastRubyLeaf = lastRuby.rubyLeaf;
      const lastPaddingRight = lastRuby.paddingRight || 0;
      this.bounds.width = Math.max(this.bounds.width, lastRubyLeaf.x + lastRuby.width + lastPaddingRight) * this.scaleX;
      this.bounds.height = Math.max(this.bounds.height, lastRubyLeaf.y + lastRuby.height) * this.scaleY;
    });
  }
}
