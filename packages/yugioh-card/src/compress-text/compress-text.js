import { cloneDeep, isEqual } from 'lodash-unified';
import { Group, Text } from 'leafer-unified';
import { isBrowser } from '../utils';
import { splitBreakWordWithBracket } from './split-break-word';

export class CompressText extends Group {
  constructor(data = {}) {
    super();
    this.baseLineHeight = 1.15; // 基础行高
    this.noCompressText = '●①②③④⑤⑥⑦⑧⑨⑩'; // 不压缩的文本
    this.parseList = []; // 解析后的文本列表
    this.newlineList = []; // 根据换行符分割的文本列表
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
    data = cloneDeep(data);
    let needCompressText = false;
    Object.keys(data).forEach(key => {
      const value = data[key] ?? this.defaultData[key];
      if (!isEqual(this[key], value)) {
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

  // 获取解析后的文本列表
  getParseList() {
    const list = [];
    let bold = false;
    const text = String(this.text).trimEnd();
    // 正则的捕获圆括号不要随意修改
    text.split(new RegExp(`(<b>|</b>|\n|[${this.noCompressText}])`)).filter(value => value).forEach(value => {
      if (value === '<b>') {
        bold = true;
        return null;
      }
      if (value === '</b>') {
        bold = false;
        return null;
      }
      const splitList = splitBreakWordWithBracket(value);
      splitList.forEach(value => {
        const itemList = [];
        value.split(/(\[.*?\(.*?\)])/g).filter(value => value).forEach(value => {
          let rubyText = value;
          let rtText = '';
          if (/\[.*?\(.*?\)]/g.test(value)) {
            rubyText = value.replace(/\[(.*?)\((.*?)\)]/g, '$1');
            rtText = value.replace(/\[(.*?)\((.*?)\)]/g, '$2');
          }
          const obj = {
            ruby: {
              text: rubyText,
              bold,
            },
            rt: {
              text: rtText,
            },
          };
          itemList.push(obj);
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
      itemList.forEach(item => {
        const ruby = item.ruby;
        list[currentIndex].push(itemList);
        if (ruby.text === '\n') {
          currentIndex++;
          list[currentIndex] = [];
        }
      });
    });
    return list;
  }

  // 获取平铺的ruby列表
  getRubyList() {
    return this.parseList.map(itemList => itemList.map(item => item.ruby)).flat();
  }

  // 获取压缩文本
  compressText() {
    this.textScale = 1;
    this.firstLineTextScale = 1;
    this.isSmallSize = false;
    this.needCompressTwice = false;
    this.parseList = this.getParseList();
    this.newlineList = this.getNewlineList();
    if (this.group) {
      this.group.destroy();
    }
    this.group = new Group();
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
    this.parseList.forEach(itemList => {
      itemList.forEach(item => {
        const ruby = item.ruby;
        const rubyLeaf = new Text({
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
        });
        const bounds = rubyLeaf.textDrawData.bounds;
        ruby.rubyLeaf = rubyLeaf;
        ruby.originalWidth = bounds.width;
        ruby.originalHeight = bounds.height;
        ruby.width = bounds.width;
        ruby.height = bounds.height;
        if (ruby.text === ' ') {
          // todo
          ruby.originalWidth += this.wordSpacing;
          ruby.width += this.wordSpacing;
        }
        this.group.add(rubyLeaf);
      });
    });
    this.updateTextScale();
  }

  // 压缩文本
  compressRuby() {
    if (this.firstLineCompress && this.width) {
      // 首行压缩
      const firstNewlineRubyList = this.newlineList[0].map(itemList => itemList.map(item => item.ruby)).flat();
      let firstNewlineTotalWidth = 0;
      let maxWidth = this.width;
      firstNewlineRubyList.forEach(ruby => {
        const paddingLeft = ruby.paddingLeft || 0;
        const paddingRight = ruby.paddingRight || 0;
        firstNewlineTotalWidth += ruby.originalWidth;
        maxWidth -= paddingLeft + paddingRight;
      });
      this.firstLineTextScale = Math.min(Math.floor(maxWidth / firstNewlineTotalWidth * 1000) / 1000, 1);
      this.updateTextScale();
    }
    const rubyList = this.getRubyList();
    const lastRuby = rubyList[rubyList.length - 1];
    if (this.height && lastRuby && this.currentY + lastRuby.height > this.height) {
      // 用二分法获取最大的scale，精度0.01
      let scale = 0.5;
      let start = 0;
      let end = this.textScale;
      while (scale > 0) {
        scale = (start + end) / 2;
        this.textScale = scale;
        this.updateTextScale();
        this.currentY + lastRuby.height > this.height ? end = scale : start = scale;
        if (this.currentY + lastRuby.height <= this.height && end - start <= 0.01) {
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
  alignRuby() {
    const rubyList = this.getRubyList();
    const alignLine = this.textScale < 1 || ['center', 'right'].includes(this.textAlign) || this.textJustifyLast ? this.currentLine + 1 : this.currentLine;
    for (let line = 0; line < alignLine; line++) {
      const lineList = rubyList.filter(item => item.line === line);
      if (lineList.length) {
        const lastRuby = lineList[lineList.length - 1];
        const lastRubyLeaf = lastRuby.rubyLeaf;
        const lastPaddingRight = lastRuby.paddingRight || 0;
        const remainWidth = this.width - lastRubyLeaf.x - lastRuby.width - lastPaddingRight;
        if (remainWidth > 0) {
          if (this.textAlign === 'center') {
            const offset = remainWidth / 2;
            lineList.forEach(ruby => {
              const rubyLeaf = ruby.rubyLeaf;
              rubyLeaf.x += offset;
            });
          } else if (this.textAlign === 'right') {
            const offset = remainWidth;
            lineList.forEach(ruby => {
              const rubyLeaf = ruby.rubyLeaf;
              rubyLeaf.x += offset;
            });
          } else if (this.textAlign === 'justify') {
            if (lineList.length > 1 && lastRuby.text !== '\n') {
              // todo 间隙不均匀
              const gap = remainWidth / (lineList.length - 1);
              lineList.forEach((ruby, index) => {
                const rubyLeaf = ruby.rubyLeaf;
                rubyLeaf.x += index * gap;
              });
            }
          }
        }
      }
    }
  }

  // 创建注音
  createRt() {
    this.parseList.forEach(itemList => {
      itemList.forEach(item => {
        const rt = item.rt;
        if (rt.text) {
          const rtLeaf = new Text({
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
          });
          const bounds = rtLeaf.textDrawData.bounds;
          rt.rtLeaf = rtLeaf;
          rt.originalWidth = bounds.width;
          rt.originalHeight = bounds.height;
          rt.width = bounds.width;
          rt.height = bounds.height;
          this.positionRt(item);
          this.group.add(rtLeaf);
        }
      });
    });
    // 如果需要再次压缩
    if (this.needCompressTwice) {
      this.updateTextScale();
      this.compressRuby();
      this.alignRuby();
      this.parseList.forEach(itemList => {
        itemList.forEach(item => {
          this.positionRt(item);
        });
      });
    }
  }

  getItemWidth(itemList) {
    let itemWidth = 0;
    itemList.forEach(item => {
      const ruby = item.ruby;
      const paddingLeft = ruby.paddingLeft || 0;
      const paddingRight = ruby.paddingRight || 0;
      itemWidth += ruby.width + paddingLeft + paddingRight;
    });
    return itemWidth;
  }

  // 更新文本压缩
  updateTextScale() {
    this.currentX = 0;
    this.currentY = 0;
    this.currentLine = 0;

    let noBreakTotalWidth = 0;

    this.newlineList.forEach((newline, newlineIndex) => {
      const lastNewline = newlineIndex === this.newlineList.length - 1;
      newline.forEach(itemList => {
        itemList.forEach(item => {
          const ruby = item.ruby;
          const rubyLeaf = ruby.rubyLeaf;
          if (this.firstLineCompress && newlineIndex === 0) {
            // 首行压缩到一行
            rubyLeaf.scaleX = this.firstLineTextScale;
            ruby.width = ruby.originalWidth * this.firstLineTextScale;
          } else if (!this.noCompressText.includes(ruby.text) && lastNewline) {
            // 只压缩最后一行
            rubyLeaf.scaleX = this.textScale;
            ruby.width = ruby.originalWidth * this.textScale;
          }
        });
        const itemWidth = this.getItemWidth(itemList);
        noBreakTotalWidth += itemWidth;
        const hasBreak = itemList.some(item => item.ruby.text === '\n');
        const isOverWidth = this.width && this.currentX && this.currentX + noBreakTotalWidth > this.width;
        if (hasBreak || isOverWidth) {
          this.addRow();
          noBreakTotalWidth = 0;
        }
        itemList.forEach(item => {
          const ruby = item.ruby;
          this.positionRuby(ruby);
        });
      });
    });
  }

  // 更新文本大小
  updateFontSize() {
    this.textScale = 1;
    const fontSize = this.isSmallSize ? this.smallFontSize : this.fontSize;
    const sizePercent = fontSize / this.fontSize;
    const rubyList = this.getRubyList();
    rubyList.forEach(ruby => {
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
    ruby.line = this.currentLine;
  }

  // 添加行
  addRow() {
    this.removeLineLastSpace(this.currentLine);
    const fontSize = this.isSmallSize ? this.smallFontSize : this.fontSize;
    this.currentX = 0;
    this.currentY += fontSize * this.lineHeight * this.fontScale;
    this.currentLine++;
  }

  // 删除行尾空格
  removeLineLastSpace(line) {
    const rubyList = this.getRubyList();
    const lineList = rubyList.filter(item => item.line === line);
    if (lineList.length) {
      const lastRuby = lineList[lineList.length - 1];
      if (lastRuby.text === ' ') {
        const lastRubyLeaf = lastRuby.rubyLeaf;
        const lastPaddingLeft = lastRuby.paddingLeft || 0;
        const lastPaddingRight = lastRuby.paddingRight || 0;
        this.currentX -= lastRuby.width + lastPaddingLeft + lastPaddingRight;
        lastRubyLeaf.destroy();
        lastRuby.line = -1;
        this.removeLineLastSpace(line);
      }
    }
  }

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

  // 创建渐变
  createGradient() {
    if (this.gradient) {
      const rubyList = this.getRubyList();
      const fontSize = this.isSmallSize ? this.smallFontSize : this.fontSize;
      rubyList.forEach(ruby => {
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
    const rubyList = this.getRubyList();
    for (let line = 0; line < this.currentLine + 1; line++) {
      const lineList = rubyList.filter(item => item.line === line);
      if (lineList.length) {
        const lastRuby = lineList[lineList.length - 1];
        const lastRubyLeaf = lastRuby.rubyLeaf;
        const lastPaddingRight = lastRuby.paddingRight || 0;
        this.bounds.width = Math.max(this.bounds.width, lastRubyLeaf.x + lastRuby.width + lastPaddingRight) * this.scaleX;
        this.bounds.height = Math.max(this.bounds.height, lastRubyLeaf.y + lastRuby.height) * this.scaleY;
      }
    }
  }
}
