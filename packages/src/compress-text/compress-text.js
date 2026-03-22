/**
 * 压缩文本渲染模块。
 *
 * 该模块提供 CompressText 类，用于在 Leafer 场景中渲染带有 ruby 注音的文本，
 * 并在给定宽高约束下完成解析、换行、压缩、对齐、注音定位以及视觉效果处理。
 *
 * 整体处理流程包括：
 * 1. 解析原始文本并拆分成 ruby/rt 结构。
 * 2. 按显式换行符分组构建布局输入。
 * 3. 创建正文与注音叶子并测量尺寸。
 * 4. 对超宽连续纯文本执行布局阶段的回退切段。
 * 5. 根据宽高限制执行首行压缩、末行压缩和自动缩小。
 * 6. 完成正文对齐、注音定位、渐变效果与最终边界统计。
 *
 * 其中，超长连续文本的处理属于布局阶段的回退逻辑，不会改变默认分词模块的基础语义。
 * 在浏览器环境中，模块还会在字体加载完成后自动重新执行一次排版，以确保测量结果准确。
 */
import { Group, Text } from 'leafer-unified';
import { isBrowser } from '../utils/index.js';
import { splitBreakWordWithBracket } from './split-break-word.js';

const rubyTokenPattern = /(\[[^\[\]()]*\([^\[\]()]*\)])/g;
const rubyRtPattern = /^\[([^\[\]()]+)\(([^\[\]()]*)\)]$/;

export class CompressText extends Group {
  /**
   * 创建压缩文本渲染实例，并初始化默认配置、内部缓存和浏览器字体加载后的重排逻辑。
   *
   * @param {object} [data={}] 初始化配置，会与默认配置合并后写入实例。
   */
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

  /**
   * 批量更新实例配置。
   *
   * 仅当传入值与当前实例值不同的时候才会触发重新排版，避免无意义的重复计算。
   * 未提供的字段会回退到默认值语义，与现有 set 行为保持一致。
   *
   * @param {object} [data={}] 需要更新的配置项。
   */
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

  /**
   * 使用默认配置初始化实例数据。
   *
   * 该方法会将默认配置与传入配置合并后交给 set，确保初始化和后续更新走同一条赋值逻辑。
   *
   * @param {object} [data={}] 初始化配置。
   */
  initData(data = {}) {
    this.set(Object.assign(this.defaultData, data));
  }

  // 解析与缓存

  /**
   * 解析原始文本，生成内部使用的 itemList 列表。
   *
   * 该过程会处理：
   * 1. bold 标签切换。
   * 2. 显式换行符。
   * 3. noCompressText 中的特殊字符。
   * 4. ruby 标记与 rt 文本拆分。
   *
   * 返回结果中的每一项都是一个 itemList，itemList 由 ruby/rt 成对结构组成，
   * 后续布局、压缩和注音定位都基于这份解析结果展开。
   *
   * @returns {Array<Array<{ruby: object, rt: object}>>} 解析后的文本项列表。
   */
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
          const item = this.createTextItem(rubyText, rtText, bold);
          itemList.push(item);
        });
        list.push(itemList);
      });
    });
    return list;
  }

  /**
   * 基于解析结果按显式换行符分组，生成内部的换行段列表。
   *
   * 这里的分组只处理用户输入中的 \n，不负责基于宽度的自动换行。
   * 宽度驱动的换行会在布局阶段由 updateTextScale 处理。
   *
   * @returns {Array<Array<Array<{ruby: object, rt: object}>>>} 按显式换行分组后的列表。
   */
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

  /**
   * 获取当前参与布局的字号。
   *
   * 当 autoSmallSize 触发并进入小字模式时返回 smallFontSize，否则返回正常字号。
   *
   * @returns {number} 当前布局字号。
   */
  getCurrentFontSize() {
    return this.isSmallSize ? this.smallFontSize : this.fontSize;
  }

  /**
   * 获取某个 ruby 项两侧额外补白的总宽度。
   *
   * 主要用于 rt 过宽时通过 paddingLeft/paddingRight 扩展 ruby 占位宽度的场景。
   *
   * @param {object} ruby ruby 布局对象。
   * @returns {number} 左右补白总和。
   */
  getPaddingWidth(ruby) {
    return (ruby.paddingLeft || 0) + (ruby.paddingRight || 0);
  }

  /**
   * 判断一个 item 是否允许进入超宽回退切段逻辑。
   *
   * 当前仅允许“没有 rt 的纯文本片段”参与切段，避免拆散带注音的原子结构。
   * 同时过滤换行符和长度为 1 的片段，减少无意义处理。
   *
   * @param {{ruby: object, rt: object}} item 文本项。
   * @returns {boolean} 是否允许按宽度切段。
   */
  isSplittablePlainTextItem(item) {
    return !item.rt.text && item.ruby.text !== '\n' && Array.from(item.ruby.text).length > 1;
  }

  /**
   * 重置压缩阶段的临时状态。
   *
   * 每次完整重排前都会调用，确保 textScale、首行压缩比例、小字状态以及二次压缩标记
   * 从干净状态开始重新计算。
   */
  resetCompressionState() {
    this.textScale = 1;
    this.firstLineTextScale = 1;
    this.isSmallSize = false;
    this.needCompressTwice = false;
  }

  /**
   * 重建解析缓存。
   *
   * 该方法会依次刷新 parseList、newlineList 和依赖它们的平铺缓存，
   * 是每次重新排版前的数据准备入口。
   */
  rebuildParseCache() {
    this.parseList = this.getParseList();
    this.newlineList = this.getNewlineList();
    this.updateLayoutCache();
  }

  /**
   * 重建承载文字叶子的 Leafer Group。
   *
   * 如果旧 group 已存在，则会先销毁旧实例，避免旧叶子残留在场景树中。
   */
  resetGroup() {
    if (this.group) {
      this.group.destroy();
    }
    this.group = new Group();
  }

  // 文本叶子创建与测量

  /**
   * 创建一个通用文本 item。
   *
   * 该结构同时支持正文与注音文本，供解析阶段和纯文本切段逻辑复用。
   *
   * @param {string} rubyText 正文文本。
   * @param {string} [rtText=''] 注音文本。
   * @param {boolean} [bold=false] 是否按粗体处理。
   * @returns {{ruby: {text: string, bold: boolean}, rt: {text: string}}} 通用文本 item。
   */
  createTextItem(rubyText, rtText = '', bold = false) {
    return {
      ruby: {
        text: rubyText,
        bold,
      },
      rt: {
        text: rtText,
      },
    };
  }

  /**
   * 创建一个不带注音的纯文本 item。
   *
   * 该方法是 createTextItem 的纯文本特化版本，主要供超宽回退切段时复用。
   *
   * @param {string} text 纯文本内容。
   * @param {boolean} [bold=false] 是否按粗体处理。
   * @returns {{ruby: {text: string, bold: boolean}, rt: {text: string}}} 纯文本 item。
   */
  createPlainTextItem(text, bold = false) {
    return this.createTextItem(text, '', bold);
  }

  /**
   * 将字符串按 Unicode 字符边界拆成字符数组。
   *
   * 使用 Array.from 可以避免 surrogate pair 被错误拆分，适合处理中日韩字符和扩展字符。
   *
   * @param {string} text 原始文本。
   * @returns {string[]} 字符数组。
   */
  getTextCharList(text) {
    return Array.from(text);
  }

  /**
   * 获取字符串按 Unicode 字符边界计算后的长度。
   *
   * @param {string} text 原始文本。
   * @returns {number} 字符数量。
   */
  getTextCharLength(text) {
    return this.getTextCharList(text).length;
  }

  /**
   * 创建并立即测量一个纯文本 item。
   *
   * 主要供超宽回退逻辑使用，生成 item 后立即附带 rubyLeaf、宽高等测量信息。
   *
   * @param {string} text 文本内容。
   * @param {boolean} [bold=false] 是否粗体。
   * @returns {{ruby: object, rt: {text: string}}} 已测量的纯文本 item。
   */
  createMeasuredPlainTextItem(text, bold = false) {
    const item = this.createPlainTextItem(text, bold);
    this.createRubyLeaf(item.ruby);
    return item;
  }

  /**
   * 销毁 ruby 对应的文本叶子。
   *
   * 用于超宽回退切段时清理临时测量叶子，避免多余节点残留。
   *
   * @param {object} ruby ruby 布局对象。
   */
  destroyRubyLeaf(ruby) {
    if (ruby?.rubyLeaf) {
      ruby.rubyLeaf.destroy();
    }
  }

  /**
   * 生成 ruby 正文 Text 叶子所需的样式配置。
   *
   * @param {object} ruby ruby 布局对象。
   * @returns {object} Leafer Text 配置。
   */
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

  /**
   * 生成注音 rt Text 叶子所需的样式配置。
   *
   * @param {object} rt rt 布局对象。
   * @returns {object} Leafer Text 配置。
   */
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

  /**
   * 创建 ruby 正文叶子并把测量结果回写到 ruby 对象。
   *
   * 测量结果会作为后续换行、压缩、对齐和边界计算的基础数据。
   * 对于空格字符，会额外叠加 wordSpacing。
   *
   * @param {object} ruby ruby 布局对象。
   * @returns {Text} 创建出的 Leafer Text 实例。
   */
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

  /**
   * 创建 rt 注音叶子并把测量结果回写到 rt 对象。
   *
   * @param {object} rt rt 布局对象。
   * @returns {Text} 创建出的 Leafer Text 实例。
   */
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

  /**
   * 在 rt 触发宽度压缩扩展后重新执行一次正文布局。
   *
   * 当 rt 太宽导致 ruby 被加宽时，需要重新计算正文换行、压缩和对齐，
   * 否则正文与注音的相对位置会失真。
   */
  relayoutAfterRtCompression() {
    this.updateTextScale();
    this.compressRuby();
    this.alignRuby();
    this.flatItemList.forEach(item => {
      this.positionRt(item);
    });
  }

  /**
   * 根据当前 parseList 重建平铺缓存。
   *
   * flatItemList 供统一遍历 item 使用，rubyList 则供正文定位、对齐与边界计算使用。
   */
  updateLayoutCache() {
    this.flatItemList = this.parseList.flat();
    this.rubyList = this.flatItemList.map(item => item.ruby);
  }

  /**
   * 按当前 ruby.line 信息重建按行分组的映射。
   *
   * 该映射主要用于对齐和边界统计，line 小于 0 的项会被视为无效项并跳过。
   */
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

  /**
   * 执行完整的文本压缩与渲染流程。
   *
   * 顺序包括：
   * 1. 重置压缩状态。
   * 2. 重建解析缓存。
   * 3. 重建承载 group。
   * 4. 创建正文叶子并处理超宽回退。
   * 5. 计算压缩、对齐、注音、渐变与边界。
   * 6. 将结果挂入当前 Group。
   */
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

  /**
   * 创建正文 ruby 叶子并执行基于宽度的初步布局准备。
   *
   * 该阶段会先为解析结果中的 ruby 创建叶子，随后应用超宽回退切段，
   * 再将最终保留的 rubyLeaf 加入 group，并执行一次基础布局。
   */
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

  /**
   * 在给定起点上，通过二分查找找到当前容器宽度下可容纳的最大文本片段。
   *
   * 该方法会不断创建临时测量 item，保留最后一个能放下的候选项，
   * 是超长连续文本切段的核心测量逻辑。
   *
   * @param {string[]} textList 字符数组。
   * @param {number} start 当前片段起始索引。
   * @param {boolean} bold 是否粗体。
   * @returns {{ruby: object, rt: {text: string}}} 当前起点下最大可容纳的文本片段。
   */
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

  /**
   * 将单个纯文本 item 按宽度切分成多个可容纳片段。
   *
    * 该方法仅在单个纯文本片段自身超宽时作为回退路径触发。
    *
   * 切分结果仍然保持 itemList 结构，便于直接复用现有布局流程。
   *
   * @param {{ruby: object, rt: object}} item 需要切分的纯文本项。
   * @returns {Array<Array<{ruby: object, rt: object}>>} 切分后的片段列表。
   */
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

  /**
   * 对单个 item 应用超宽回退扩展。
   *
   * 如果该 item 可拆分，则会先清理原有测量叶子，再按宽度切成多个片段；
   * 否则保持原样返回。
   *
   * @param {{ruby: object, rt: object}} item 文本项。
   * @returns {Array<Array<{ruby: object, rt: object}>>} 展开后的片段列表。
   */
  expandItemForOverflowFallback(item) {
    if (this.isSplittablePlainTextItem(item)) {
      this.destroyRubyLeaf(item.ruby);
      return this.splitPlainTextItemIntoFittingSegments(item);
    }

    return [[item]];
  }

  /**
   * 将一个超宽 itemList 按规则展开成多个可布局片段。
   *
   * @param {Array<{ruby: object, rt: object}>} itemList 原始 itemList。
   * @returns {Array<Array<{ruby: object, rt: object}>>} 展开后的 itemList 列表。
   */
  splitOversizedItemList(itemList) {
    return itemList.flatMap(item => this.expandItemForOverflowFallback(item));
  }

  /**
   * 对单个 itemList 应用超宽回退逻辑。
   *
   * 只有当 itemList 总宽度超过容器宽度，且其中存在允许切段的纯文本项时，
   * 才会触发回退切分；否则保持原始结构。
   *
   * @param {Array<{ruby: object, rt: object}>} itemList 原始 itemList。
   * @returns {Array<Array<{ruby: object, rt: object}>>} 处理后的 itemList 列表。
   */
  applyOverflowFallbackToItemList(itemList) {
    const itemWidth = this.getItemWidth(itemList);
    const canSplit = itemList.some(item => this.isSplittablePlainTextItem(item));

    if (itemWidth <= this.width || !canSplit) {
      return [itemList];
    }

    return this.splitOversizedItemList(itemList);
  }

  /**
   * 对整份换行段列表应用超宽回退逻辑。
   *
   * 该方法会重建 newlineList、parseList 以及依赖它们的平铺缓存，
   * 确保后续布局直接基于已经切段后的结构运行。
   */
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

  /**
   * 计算首行压缩时的最大可用缩放比例。
   *
   * 该方法只考虑显式换行分组中的第一段，返回值会截断到三位小数并且不超过 1。
   *
   * @returns {number} 首行可用的压缩比例。
   */
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

  /**
   * 判断当前布局状态下末尾 ruby 是否已经超出高度限制。
   *
   * @param {object} lastRuby 当前最后一个 ruby 项。
   * @returns {boolean} 是否超出高度限制。
   */
  doesOverflowHeight(lastRuby) {
    return this.height && lastRuby && this.currentY + lastRuby.height > this.height;
  }

  // 压缩与对齐

  /**
   * 根据当前宽高限制计算正文压缩比例。
   *
   * 包含两类压缩：
   * 1. 首行压缩到一行。
   * 2. 在高度不足时对最后一行执行二分缩放。
   *
   * 当开启 autoSmallSize 且缩放过小时，会切换到 smallFontSize 再重新计算。
   */
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

  /**
   * 获取当前需要参与对齐处理的行数。
   *
   * 当存在压缩、居中、右对齐或最后一行也需要 justify 时，需要把最后一行也纳入对齐。
   *
   * @returns {number} 需要对齐的行数。
   */
  getAlignLineCount() {
    return this.textScale < 1 || ['center', 'right'].includes(this.textAlign) || this.textJustifyLast ? this.currentLine + 1 : this.currentLine;
  }

  /**
   * 获取某一行在当前布局后的剩余可用宽度。
   *
   * @param {object[]} lineList 当前行的 ruby 列表。
   * @returns {number} 当前行剩余宽度。
   */
  getLineRemainWidth(lineList) {
    const lastRuby = lineList[lineList.length - 1];
    const lastRubyLeaf = lastRuby.rubyLeaf;
    const lastPaddingRight = lastRuby.paddingRight || 0;

    return this.width - lastRubyLeaf.x - lastRuby.width - lastPaddingRight;
  }

  /**
   * 按给定偏移规则整体移动一行 ruby 的 x 坐标。
   *
   * @param {object[]} lineList 当前行的 ruby 列表。
   * @param {(index: number) => number} offsetStep 根据索引返回偏移量的函数。
   */
  offsetRubyLine(lineList, offsetStep) {
    lineList.forEach((ruby, index) => {
      ruby.rubyLeaf.x += offsetStep(index);
    });
  }

  /**
   * 对单行 ruby 执行居中对齐。
   *
   * @param {object[]} lineList 当前行的 ruby 列表。
   * @param {number} remainWidth 当前行剩余宽度。
   */
  alignCenterLine(lineList, remainWidth) {
    this.offsetRubyLine(lineList, () => remainWidth / 2);
  }

  /**
   * 对单行 ruby 执行右对齐。
   *
   * @param {object[]} lineList 当前行的 ruby 列表。
   * @param {number} remainWidth 当前行剩余宽度。
   */
  alignRightLine(lineList, remainWidth) {
    this.offsetRubyLine(lineList, () => remainWidth);
  }

  /**
   * 对单行 ruby 执行两端对齐。
   *
   * 仅当当前行存在至少两个可参与分配的项且末尾不是显式换行符时才会生效。
   *
   * @param {object[]} lineList 当前行的 ruby 列表。
   * @param {number} remainWidth 当前行剩余宽度。
   */
  alignJustifyLine(lineList, remainWidth) {
    if (lineList.length <= 1 || lineList[lineList.length - 1].text === '\n') {
      return;
    }

    const gap = remainWidth / (lineList.length - 1);
    this.offsetRubyLine(lineList, index => index * gap);
  }

  /**
   * 根据当前 textAlign 对单行 ruby 应用对应的对齐逻辑。
   *
   * @param {object[]} lineList 当前行的 ruby 列表。
   * @param {number} remainWidth 当前行剩余宽度。
   */
  alignRubyLine(lineList, remainWidth) {
    if (this.textAlign === 'center') {
      this.alignCenterLine(lineList, remainWidth);
    } else if (this.textAlign === 'right') {
      this.alignRightLine(lineList, remainWidth);
    } else if (this.textAlign === 'justify') {
      this.alignJustifyLine(lineList, remainWidth);
    }
  }

  /**
   * 对所有需要处理的行执行正文对齐。
    *
    * 该方法会根据当前对齐模式遍历每一行，并在存在剩余宽度时应用对应的对齐策略。
   */
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

  /**
   * 创建所有注音 rt 叶子并完成初始定位。
   *
   * 如果在 rt 压缩过程中触发了正文扩宽，会再执行一次正文重排以保持对齐正确。
   */
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

  /**
   * 更新单个 ruby 的横向缩放比例和当前宽度。
   *
   * @param {object} ruby ruby 布局对象。
   * @param {number} scale 横向缩放比例。
   */
  updateRubyScale(ruby, scale) {
    const rubyLeaf = ruby.rubyLeaf;
    rubyLeaf.scaleX = scale;
    ruby.width = ruby.originalWidth * scale;
  }

  /**
   * 计算一个 itemList 在当前状态下的总宽度。
   *
   * 宽度包含每个 ruby 自身宽度以及左右补白。
   *
   * @param {Array<{ruby: object, rt: object}>} itemList 文本项列表。
   * @returns {number} 总宽度。
   */
  getItemWidth(itemList) {
    let itemWidth = 0;

    itemList.forEach(item => {
      const ruby = item.ruby;
      itemWidth += ruby.width + this.getPaddingWidth(ruby);
    });

    return itemWidth;
  }

  // 布局流程

  /**
   * 更新一个 itemList 中所有 ruby 的缩放状态。
   *
   * 该方法会根据是否首行压缩、是否最后一段以及 noCompressText 规则决定使用哪种缩放比例。
   *
   * @param {Array<{ruby: object, rt: object}>} itemList 文本项列表。
   * @param {number} newlineIndex 当前显式换行分组索引。
   * @param {boolean} lastNewline 当前是否最后一个显式换行分组。
   */
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

  /**
   * 重置布局过程中的游标状态。
   */
  resetLayoutPosition() {
    this.currentX = 0;
    this.currentY = 0;
    this.currentLine = 0;
  }

  /**
   * 判断当前 itemList 在当前位置是否需要换到下一行。
   *
   * @param {Array<{ruby: object, rt: object}>} itemList 当前文本项列表。
   * @param {number} itemWidth 当前文本项总宽度。
   * @returns {boolean} 是否需要换行。
   */
  shouldWrapItemList(itemList, itemWidth) {
    const hasBreak = itemList.some(item => item.ruby.text === '\n');
    const isOverWidth = this.width && this.currentX && this.currentX + itemWidth > this.width;

    return hasBreak || isOverWidth;
  }

  /**
   * 顺序定位一个 itemList 中所有 ruby 的坐标。
   *
   * @param {Array<{ruby: object, rt: object}>} itemList 当前文本项列表。
   */
  positionItemListRuby(itemList) {
    itemList.forEach(item => {
      this.positionRuby(item.ruby);
    });
  }

  /**
   * 布局一个 itemList。
   *
   * 包括缩放、换行判断以及最终定位。
   *
   * @param {Array<{ruby: object, rt: object}>} itemList 当前文本项列表。
   * @param {number} newlineIndex 当前显式换行分组索引。
   * @param {boolean} lastNewline 当前是否最后一个显式换行分组。
   */
  layoutItemList(itemList, newlineIndex, lastNewline) {
    this.updateItemRubyScale(itemList, newlineIndex, lastNewline);
    const itemWidth = this.getItemWidth(itemList);

    if (this.shouldWrapItemList(itemList, itemWidth)) {
      this.addLine();
    }

    this.positionItemListRuby(itemList);
  }

  /**
   * 布局一个显式换行分组中的所有 itemList。
   *
   * @param {Array<Array<{ruby: object, rt: object}>>} newline 当前分组。
   * @param {number} newlineIndex 当前分组索引。
   */
  layoutNewlineItems(newline, newlineIndex) {
    const lastNewline = newlineIndex === this.newlineList.length - 1;

    newline.forEach(itemList => {
      this.layoutItemList(itemList, newlineIndex, lastNewline);
    });
  }

  /**
   * 根据当前缩放状态重新执行一次正文布局。
   *
   * 该方法会重置游标，然后按显式换行分组顺序重新排版，最后刷新 rubyLineMap。
   */
  updateTextScale() {
    this.resetLayoutPosition();

    this.newlineList.forEach((newline, newlineIndex) => {
      this.layoutNewlineItems(newline, newlineIndex);
    });
    this.updateRubyLineMap();
  }

  /**
   * 在切换到小字模式后更新所有 ruby 的尺寸信息。
   *
    * 更新后会立即重新布局，以确保新的字号、宽度和高度信息全部生效。
   */
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

  /**
   * 定位单个 ruby 的坐标并更新当前行游标。
   *
   * @param {object} ruby ruby 布局对象。
   */
  positionRuby(ruby) {
    const paddingLeft = ruby.paddingLeft || 0;
    const paddingRight = ruby.paddingRight || 0;
    const rubyLeaf = ruby.rubyLeaf;
    rubyLeaf.x = this.currentX + paddingLeft;
    rubyLeaf.y = this.currentY;
    this.currentX += ruby.width + paddingLeft + paddingRight;
    ruby.line = ruby.text === '\n' ? this.currentLine - 1 : this.currentLine;
  }

  /**
   * 切换到下一行并更新行游标。
   *
   * 切行前会先清理上一行末尾多余空格。
   */
  addLine() {
    this.removeLineLastSpace(this.currentLine);
    const fontSize = this.getCurrentFontSize();
    this.currentX = 0;
    this.currentY += fontSize * this.lineHeight * this.fontScale;
    this.currentLine++;
  }

  /**
   * 删除指定行尾部连续的空格项。
   *
   * 这些空格在排版结束后不应继续占据宽度，因此会同步回退 currentX。
   *
   * @param {number} line 目标行号。
   */
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

  /**
   * 获取注音布局所需的上下文信息。
   *
   * @param {{ruby: object, rt: object}} item 包含 ruby 与 rt 的文本项。
   * @returns {{ruby: object, rt: object, rubyLeaf: Text, rtLeaf: Text, paddingLeft: number, paddingRight: number, rubyWidth: number}} 注音布局上下文。
   */
  getRtLayoutContext(item) {
    const ruby = item.ruby;
    const rt = item.rt;
    const rubyLeaf = ruby.rubyLeaf;
    const rtLeaf = rt.rtLeaf;
    const paddingLeft = ruby.paddingLeft || 0;
    const paddingRight = ruby.paddingRight || 0;
    const rubyWidth = ruby.width + paddingLeft + paddingRight;

    return {
      ruby,
      rt,
      rubyLeaf,
      rtLeaf,
      paddingLeft,
      paddingRight,
      rubyWidth,
    };
  }

  /**
   * 执行注音的基础定位。
   *
   * @param {{rubyLeaf: Text, rtLeaf: Text, paddingLeft: number, rubyWidth: number}} context 注音布局上下文。
   */
  positionRtBase(context) {
    const { rubyLeaf, rtLeaf, paddingLeft, rubyWidth } = context;

    rtLeaf.around = { type: 'percent', x: 0.5, y: 0 };
    rtLeaf.x = rubyLeaf.x + rubyWidth / 2 - paddingLeft;
    rtLeaf.y = rubyLeaf.y + this.rtTop * this.fontScale;
  }

  /**
   * 应用直接指定的注音横向缩放。
   *
   * @param {{rtLeaf: Text}} context 注音布局上下文。
   */
  applyRtScaleXOverride(context) {
    context.rtLeaf.scaleX = this.rtFontScaleX;
  }

  /**
   * 通过增加字距对注音执行拉伸。
   *
   * @param {{ruby: object, rt: object, rtLeaf: Text, rubyWidth: number}} context 注音布局上下文。
   */
  stretchRtLetterSpacing(context) {
    const { ruby, rt, rtLeaf, rubyWidth } = context;
    const rtStretchRate = 0.9;
    const maxLetterSpacing = this.fontSize - this.rtFontSize / 2;
    const newLetterSpacing = (rubyWidth * rtStretchRate - rt.width) / (rt.text.length - 1);

    rtLeaf.letterSpacing = Math.min(newLetterSpacing, maxLetterSpacing);
    rtLeaf.x += rtLeaf.letterSpacing / 2;
  }

  /**
   * 在注音宽于正文时执行压缩或扩宽正文占位。
   *
   * @param {{ruby: object, rt: object, rtLeaf: Text, rubyWidth: number}} context 注音布局上下文。
   */
  compressRtToRubyWidth(context) {
    const rtCompressRate = 0.6;
    const { ruby, rt, rtLeaf, rubyWidth } = context;

    if (rubyWidth / rt.width < rtCompressRate) {
      const widen = rtCompressRate * rt.width - rubyWidth;
      rtLeaf.scaleX = rtCompressRate;
      ruby.paddingLeft = Math.min(widen / 2, 5);
      ruby.paddingRight = Math.min(widen / 2, 5);
      this.needCompressTwice = true;
    } else {
      rtLeaf.scaleX = rubyWidth / rt.width;
    }
  }

  /**
   * 根据注音与正文宽度关系选择对应的宽度适配策略。
   *
   * @param {{ruby: object, rt: object, rtLeaf: Text, rubyWidth: number}} context 注音布局上下文。
   */
  applyRtWidthStrategy(context) {
    const rtStretchRate = 0.9;
    const { ruby, rt } = context;

    if (this.rtFontScaleX !== 1) {
      this.applyRtScaleXOverride(context);
    } else if (rt.width / context.rubyWidth < rtStretchRate && ruby.text.length > 1) {
      this.stretchRtLetterSpacing(context);
    } else if (rt.width > context.rubyWidth) {
      this.compressRtToRubyWidth(context);
    }
  }

  /**
   * 定位并调整单个注音 rt。
   *
   * 该方法会根据 ruby 和 rt 的宽度关系选择：
   * 1. 直接使用指定 scaleX。
   * 2. 增加 letterSpacing 进行拉伸。
   * 3. 压缩 rt。
   * 4. 在必要时通过增加 ruby padding 触发二次正文重排。
   *
   * @param {{ruby: object, rt: object}} item 包含 ruby 与 rt 的文本项。
   */
  positionRt(item) {
    const context = this.getRtLayoutContext(item);

    if (!context.rtLeaf) {
      return;
    }

    this.positionRtBase(context);
    this.applyRtWidthStrategy(context);
  }

  // 视觉效果与边界

  /**
   * 为正文叶子应用渐变、描边和阴影效果。
   *
   * 仅在 gradient 开启时生效。
   */
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

  /**
   * 根据当前行分组结果统计最终渲染边界。
   *
   * 结果会写入 this.bounds，供外部或后续逻辑读取。
   */
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
