/**
 * 压缩文本渲染模块。
 *
 * 该模块提供 CompressText 类，用于在 Leafer 场景中渲染带有 ruby 注音的文本，
 * 并在给定宽高约束下完成解析、换行、压缩、对齐、注音定位以及视觉效果处理。
 *
 * 整体处理流程包括：
 * 1. 解析原始文本并拆分成 ruby/rt 结构。
 * 2. 按显式换行符分组构建布局输入。
 * 3. 创建正文与注音节点并测量尺寸。
 * 4. 对超宽连续纯文本执行布局阶段的回退切段。
 * 5. 根据宽高限制横向压缩指定段或末段，必要时切换到小字。
 * 6. 完成正文对齐、注音定位、渐变效果与最终边界统计。
 *
 * 其中，超长连续文本的处理属于布局阶段的回退逻辑，不会改变默认分词模块的基础语义。
 * 在浏览器环境中，模块还会在字体加载完成后自动重新执行一次排版，以确保测量结果准确。
 */
import type { IGroup, IText, ITextInputData, IUIInputData } from '@leafer-ui/interface';
import { Group, Text } from 'leafer-unified';
import { isBrowser } from '../utils/index.ts';
import { fontFamilies, fontFamilyKey, subscribeFontChanges, type FontEntry } from '../utils/font-loader.ts';
import { emergencyBreakOffsets, emergencyBreaks, parseBreakText } from './breaking/split-break-word.ts';
import { textGraphemes } from './breaking/text-graphemes.ts';
import { getTextLayoutContext } from './layout-context.ts';
import { getGlyphMetrics, type GlyphResolver, type SideBearingMode } from './glyph-metrics.ts';
import { createBodyRun } from './body-run.ts';
import { getBodyScaleX, getRtPadding, lastSegmentUnscaledSymbols } from './layout/body-scale.ts';
import { trialLayoutHeight } from './layout/trial-layout.ts';
import type {
  Annotation, BreakUnit, CompressTextOptions, HardBreakSegment,
  ParsedRuby, RubyLayout, TextItem, TextLeafStyle, TextPaint, TextSettings,
} from './layout/types.ts';

// 只由内部样式传递，不增加卡片数据字段或对外实例属性。
type ParsedToken = [text: string, rt: string, bold: boolean, atomic: boolean];
type TextBounds = { width: number; height: number };
const sideBearingModes = new WeakMap<CompressText, SideBearingMode>();
const layoutFonts = new WeakMap<CompressText, ReadonlyMap<string, FontEntry>>();
const glyphResolvers = new WeakMap<CompressText, GlyphResolver | null>();
const parsedTexts = new WeakMap<CompressText, { text: string; tokens: ParsedToken[][] | null }>();
const containerProperties = new Set(['x', 'y', 'visible', 'zIndex']);
const colorProperties = new Set(['color', 'rtColor']);

const normalizeSegmentNumbers = (value: unknown) => {
  if (!Array.isArray(value) || !value.length) return [];
  const numbers = value.filter((number: unknown): number is number => typeof number === 'number' && Number.isInteger(number) && number > 0);
  return [...new Set(numbers)].sort((a, b) => a - b);
};

const defaultLineHeightRatio = 1.15; // 默认正文与注音行高倍率。
const rtStretchTargetWidthRatio = 0.9; // 短注音通过字距铺到正文宽度的这一比例。
const minRtScaleX = 0.6; // 常规注音横向压缩的下限。
const segmentScaleSteps = 1000; // 指定段倍率以千分之一为步长。
const scaleXSearchPrecision = 0.01; // 高度压缩时二分搜索的停止精度。
const scaleXSearchLimit = 32; // 每个字号档位的搜索预算，避免无解时持续到浮点下溢。
const smallFontFallbackScaleXThreshold = 0.7; // autoSmallSize 触发切换到小字模式的缩放阈值。
const gradientStops = [0, 0.4, 0.55, 0.6, 0.75]; // 渐变填充的关键色标位置。
const gradientStrokeColor = 'rgba(0, 0, 0, 0.6)'; // 渐变模式下正文描边与阴影共用的颜色。
const gradientStrokeWidthRatio = 0.025; // 渐变模式下描边宽度相对字号的倍率。
const gradientShadowBlurRatio = 0.015; // 渐变模式下阴影模糊相对字号的倍率。
const gradientShadowOffsetYRatio = 0.025; // 渐变模式下阴影纵向偏移相对字号的倍率。
const exceedsHeight = (actual: number, limit: number) => actual - limit > 8 * Number.EPSILON * Math.max(1, Math.abs(actual), Math.abs(limit));

const TextGroup: new () => IGroup = Group;

export class CompressText extends TextGroup {
  #lastPlacedIndex = -1;
  #orderedLayout = false;

  // 这些实例选项由 set() 统一赋值，并用 Group 的属性保存位置和尺寸。
  declare text: TextSettings['text'];
  declare fontFamily: string;
  declare fontSize: number;
  declare fontWeight: TextSettings['fontWeight'];
  declare lineHeight: number;
  declare letterSpacing: number;
  declare wordSpacing: number;
  declare compressSegments: number[];
  declare textAlign: TextSettings['textAlign'];
  declare textJustifyLast: boolean;
  declare color: TextSettings['color'];
  declare strokeWidth: number;
  declare gradient: boolean;
  declare gradientColor1: string;
  declare gradientColor2: string;
  declare rtFontFamily: string;
  declare rtFontSize: number;
  declare rtFontWeight: TextSettings['rtFontWeight'];
  declare rtLineHeight: number;
  declare rtLetterSpacing: number;
  declare rtOffsetY: number;
  declare rtColor: TextSettings['rtColor'];
  declare rtStrokeWidth: number;
  declare rtScaleXOverride: number | null;
  declare fontSizeScale: number;
  declare autoSmallSize: boolean;
  declare smallFontSize: number;
  declare width: number;
  declare height: number;
  declare x: number;
  declare y: number;

  declare parseList: BreakUnit[];
  declare flatItemList: TextItem[];
  declare hardBreakSegments: HardBreakSegment[];
  declare rubyList: RubyLayout[];
  declare rubyLineMap: Map<number, RubyLayout[]>;
  declare segmentScaleX: Map<number, number>;
  declare group: IGroup | null;
  declare bounds: TextBounds;
  declare defaultData: TextSettings;
  declare fontLayoutQueued?: boolean;
  declare fontLayoutVersion?: number;
  declare onFontsLoaded?: ((event?: { fontfaces: readonly FontFace[] }) => void) | null;
  declare unsubscribeFontChanges?: () => void;
  declare currentX: number;
  declare currentY: number;
  declare currentLine: number;
  declare lastSegmentScaleX: number;
  declare isSmallSize: boolean;
  /**
   * 创建压缩文本渲染实例，并初始化默认配置、内部缓存和浏览器字体加载后的重排逻辑。
   */
  constructor(data: CompressTextOptions = {}) {
    super();
    this.parseList = []; // 解析后的文本列表
    this.flatItemList = []; // 平铺后的文本项列表
    this.hardBreakSegments = []; // 输入中的显式换行段
    this.rubyList = []; // 平铺后的ruby列表
    this.rubyLineMap = new Map(); // 按行分组的ruby列表
    this.currentX = 0; // 当前行的x坐标
    this.currentY = 0; // 当前行的y坐标
    this.currentLine = 0; // 当前视觉行的索引
    this.lastSegmentScaleX = 1;
    this.segmentScaleX = new Map();
    this.isSmallSize = false; // 是否是小文字
    this.group = null; // Leafer文本组
    this.bounds = {} as TextBounds; // 初次排版时填入宽高。

    this.defaultData = {
      text: '',
      fontFamily: 'ygo-sc',
      fontSize: 24,
      fontWeight: 'normal',
      lineHeight: defaultLineHeightRatio,
      letterSpacing: 0,
      wordSpacing: 0,
      compressSegments: [],
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
      rtLineHeight: defaultLineHeightRatio,
      rtLetterSpacing: 0,
      rtOffsetY: -9,
      rtColor: 'black',
      rtStrokeWidth: 0,
      rtScaleXOverride: null, // 默认按正文占宽适配，数值直接指定注音横向倍率。
      fontSizeScale: 1,
      autoSmallSize: false,
      smallFontSize: 18,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      zIndex: 0,
    };

    this.fontLayoutVersion = getTextLayoutContext()?.fontVersion;
    this.initData(data);

    if (isBrowser && this.fontLayoutVersion === undefined) {
      this.onFontsLoaded = event => {
        const families = new Set([this.fontFamily, this.rtFontFamily].flatMap(fontFamilies).map(fontFamilyKey));
        if (event?.fontfaces && !event.fontfaces.some(face => families.has(fontFamilyKey(face.family)))) return;
        if (this.fontLayoutQueued || this.destroyed) return;
        this.fontLayoutQueued = true;
        queueMicrotask(() => {
          this.fontLayoutQueued = false;
          if (!this.destroyed) this.compressText();
        });
      };
      document.fonts.addEventListener('loadingdone', this.onFontsLoaded);
      this.unsubscribeFontChanges = subscribeFontChanges(this.onFontsLoaded);
      document.fonts.ready.then(() => this.onFontsLoaded?.());
    }
  }

  /**
   * 批量更新实例配置。
   *
   * 仅当传入值与当前实例值不同的时候才会触发重新排版，避免无意义的重复计算。
   * 未提供的字段会回退到默认值语义，与现有 set 行为保持一致。
   */
  set(data?: CompressTextOptions): void;
  set(data: IUIInputData): void;
  set(data: CompressTextOptions | IUIInputData = {}) {
    const context = getTextLayoutContext();
    const version = context?.fontVersion;
    if (context) layoutFonts.set(this, context.loadedFonts);
    let needCompressText = version !== undefined && this.fontLayoutVersion !== version;
    let changed = false;
    let colorsChanged = false;
    if (version !== undefined) this.fontLayoutVersion = version;
    const values: Record<string, unknown> = data;
    const defaults = this.defaultData as unknown as Record<string, unknown>;
    const properties = this as unknown as Record<string, unknown>;
    Object.keys(data).forEach(key => {
      if (key === 'sideBearingMode') {
        const mode = values[key] === 'legacy' ? 'legacy' : 'native';
        if ((sideBearingModes.get(this) ?? 'native') !== mode) {
          sideBearingModes.set(this, mode);
          needCompressText = true;
          changed = true;
        }
        return;
      }
      let value = values[key] ?? defaults[key];
      if (key === 'compressSegments') {
        const numbers = normalizeSegmentNumbers(value);
        if (this.compressSegments?.length === numbers.length && this.compressSegments.every((number, index) => number === numbers[index])) return;
        value = numbers;
      }
      if (!Object.is(properties[key], value)) {
        properties[key] = value;
        changed = true;
        if (colorProperties.has(key)) colorsChanged = true;
        else if (!containerProperties.has(key)) needCompressText = true;
      }
    });
    if (changed && !needCompressText && (this.constructor !== CompressText || !defaultTextMethods.every(([name, method]) => this[name] === method))) {
      needCompressText = true;
    }
    const canUpdateColors = !this.gradient && typeof this.color === 'string' && typeof this.rtColor === 'string';
    if (needCompressText || (changed && (!this.group || this.group.destroyed)) || (colorsChanged && !canUpdateColors)) {
      this.compressText();
    } else if (colorsChanged) {
      this.updateColors();
    }
  }

  /** 颜色不影响度量；保留正文和注音的既有描边颜色依赖。 */
  updateColors() {
    const paint: TextPaint = { fill: this.color, stroke: this.strokeWidth ? this.color : null };
    for (const ruby of this.rubyList) {
      if (ruby.bodyRun) ruby.bodyRun.paint(paint);
      else ruby.rubyNode.set(paint as ITextInputData);
    }
    for (const { rt } of this.flatItemList) {
      rt.rtNode?.set({ fill: this.rtColor, stroke: this.rtStrokeWidth ? this.color : null } as ITextInputData);
    }
  }

  destroy() {
    if (this.onFontsLoaded) document.fonts.removeEventListener('loadingdone', this.onFontsLoaded);
    this.onFontsLoaded = null;
    this.unsubscribeFontChanges?.();
    parsedTexts.delete(this);
    super.destroy();
  }

  /**
   * 使用默认配置初始化实例数据。
   *
   * 该方法会将默认配置与传入配置合并后交给 set，确保初始化和后续更新走同一条赋值逻辑。
   */
  initData(data: CompressTextOptions = {}) {
    this.set(Object.assign({}, this.defaultData, data));
  }

  // 解析与缓存

  /**
   * 解析原始文本，生成内部使用的 itemList 列表。
   *
   * 该过程会处理：
   * 1. bold 标签切换。
   * 2. 显式换行符。
   * 3. lastSegmentUnscaledSymbols 中的特殊字符。
   * 4. ruby 标记与 rt 文本拆分。
   *
   * 返回结果中的每一项都是一个 itemList，itemList 由 ruby/rt 成对结构组成，
   * 后续布局、压缩和注音定位都基于这份解析结果展开。
   */
  getParseList() {
    const text = String(this.text);
    const cached = parsedTexts.get(this);
    const create = (ruby: string, rt: string, bold: boolean, atomic: boolean) => {
      const item = this.createTextItem(ruby, rt, bold);
      if (atomic) item.ruby.atomic = true;
      return item;
    };
    if (cached?.text === text && cached.tokens) {
      return cached.tokens.map(items => items.map(values => create(...values)));
    }
    // 首次出现的文本不分配第二份解析树；确实重排同一文本时再建立缓存。
    const tokens: ParsedToken[][] | null = cached?.text === text ? [] : null;
    const list = parseBreakText(text, lastSegmentUnscaledSymbols).map(parts => {
      tokens?.push(parts.map(part => [part.text, part.rt, part.bold, part.atomic]));
      return parts.map(part => create(part.text, part.rt, part.bold, part.atomic));
    });
    parsedTexts.set(this, { text, tokens });
    return list;
  }

  /**
   * 基于解析结果按显式换行符分组，生成内部的换行段列表。
   *
   * 解析已将显式换行符归一为 \n。relayoutBody 再按可用宽度划分视觉行。
   */
  groupByHardBreaks() {
    const segments: HardBreakSegment[] = [[]];
    let segmentIndex = 0;
    this.parseList.forEach(itemList => {
      const hasBreak = itemList.some(item => item.ruby.text === '\n');
      segments[segmentIndex].push(itemList);
      if (hasBreak) {
        segmentIndex++;
        segments[segmentIndex] = [];
      }
    });
    return segments;
  }

  /**
   * 获取当前参与布局的字号。
   *
   * 当 autoSmallSize 触发并进入小字模式时返回 smallFontSize，否则返回正常字号。
   */
  getCurrentFontSize() {
    return this.isSmallSize ? this.smallFontSize : this.fontSize;
  }

  /** 正文行框使用局部逻辑高度；Group 缩放仅在最终边界输出时应用。 */
  getLineHeight() {
    return this.getCurrentFontSize() * this.lineHeight * this.fontSizeScale;
  }

  getLayoutHeight() {
    return this.rubyList.length ? this.currentY + this.getLineHeight() : 0;
  }

  /**
   * 获取某个 ruby 项两侧额外补白的总宽度。
   *
   * 主要用于 rt 过宽时通过 paddingLeft/paddingRight 扩展 ruby 占位宽度的场景。
   */
  getPaddingWidth(ruby: Pick<RubyLayout, 'paddingLeft' | 'paddingRight'>) {
    return (ruby.paddingLeft || 0) + (ruby.paddingRight || 0);
  }

  /**
   * 判断一个 item 是否允许进入超宽回退切段逻辑。
   *
   * 当前仅允许“没有 rt 的纯文本片段”参与切段，避免拆散带注音的原子结构。
   * 同时过滤换行符和长度为 1 的片段，减少无意义处理。
   */
  isSplittablePlainTextItem(item: TextItem<ParsedRuby>) {
    return !item.ruby.atomic && !item.rt.text && item.ruby.text !== '\n' && Array.from(item.ruby.text).length > 1;
  }

  /**
   * 重置压缩阶段的临时状态。
   *
   * 每次完整重排前都会调用，重新计算指定段和末段的横向倍率以及小字状态。
   */
  resetCompressionState() {
    this.lastSegmentScaleX = 1;
    this.segmentScaleX.clear();
    this.isSmallSize = false;
  }

  /**
   * 重建解析缓存。
   *
   * 该方法会依次刷新 parseList、hardBreakSegments 和依赖它们的平铺缓存，
   * 是每次重新排版前的数据准备入口。
   */
  rebuildParseCache() {
    // createRuby() 在第一次排版前补齐这些解析项的测量属性。
    this.parseList = this.getParseList() as BreakUnit[];
    this.hardBreakSegments = this.groupByHardBreaks();
    this.updateLayoutCache();
  }

  /**
   * 重建承载文字节点的 Leafer Group。
   *
   * 如果旧 group 已存在，则会先销毁旧实例，避免旧节点残留在场景树中。
   */
  resetGroup() {
    if (this.group) {
      this.group.destroy();
    }
    this.group = new Group();
  }

  // 文本节点创建与测量

  /**
   * 创建一个通用文本 item。
   *
   * 该结构同时支持正文与注音文本，供解析阶段和纯文本切段逻辑复用。
   */
  createTextItem(rubyText: string, rtText = '', bold = false): TextItem<ParsedRuby> {
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
   */
  createPlainTextItem(text: string, bold = false) {
    return this.createTextItem(text, '', bold);
  }

  /**
   * 将字符串按字素簇边界拆分，保留组合字符和变体选择符。
   *
   * 超宽回退切段也不能拆开一个字素簇。
   */
  getTextCharList(text: string) {
    return textGraphemes(text);
  }

  /**
   * 获取字符串按 Unicode 字符边界计算后的长度。
   */
  getTextCharLength(text: string) {
    return this.getTextCharList(text).length;
  }

  /**
   * 创建并立即测量一个纯文本 item。
   *
   * 主要供超宽回退逻辑使用，生成 item 后立即附带 rubyNode、宽高等测量信息。
   */
  createMeasuredPlainTextItem(text: string, bold = false): TextItem {
    const item = this.createPlainTextItem(text, bold);
    this.createRubyNode(item.ruby);
    return item as TextItem;
  }

  /**
   * 销毁 ruby 对应的文本节点。
   *
   * 用于超宽回退切段时清理临时测量节点，避免多余节点残留。
   */
  destroyRubyNode(ruby?: Pick<RubyLayout, 'rubyNode'>) {
    if (ruby?.rubyNode) {
      ruby.rubyNode.destroy();
    }
  }

  /**
   * 生成 ruby 正文 Text 节点所需的样式配置。
   */
  getRubyTextStyle(ruby: ParsedRuby): TextLeafStyle {
    return {
      text: ruby.text,
      fontFamily: this.fontFamily,
      fontSize: this.fontSize * this.fontSizeScale,
      fontWeight: ruby.bold ? 'bold' : this.fontWeight,
      lineHeight: this.fontSize * this.lineHeight * this.fontSizeScale,
      fill: this.color,
      stroke: this.strokeWidth ? this.color : null,
      strokeWidth: this.strokeWidth,
      strokeAlign: 'center',
      letterSpacing: this.letterSpacing,
    };
  }

  /**
   * 生成注音 rt Text 节点所需的样式配置。
   */
  getRtTextStyle(rt: Annotation): TextLeafStyle {
    return {
      text: rt.text,
      fontFamily: this.rtFontFamily,
      fontSize: this.rtFontSize * this.fontSizeScale,
      fontWeight: this.rtFontWeight,
      lineHeight: this.rtFontSize * this.rtLineHeight * this.fontSizeScale,
      fill: this.rtColor,
      stroke: this.rtStrokeWidth ? this.color : null,
      strokeWidth: this.rtStrokeWidth,
      strokeAlign: 'center',
      letterSpacing: this.rtLetterSpacing,
    };
  }

  /**
   * 创建 ruby 正文节点并把测量结果回写到 ruby 对象。
   *
   * 测量结果会作为后续换行、压缩、对齐和边界计算的基础数据。
   * 对于空格字符，会额外叠加 wordSpacing。
   */
  createRubyNode(ruby: ParsedRuby): IText | IGroup {
    const metrics = glyphResolvers.get(this);
    const bodyRun = createBodyRun(this.getRubyTextStyle(ruby), metrics);
    const rubyNode = bodyRun?.node ?? new Text(this.getRubyTextStyle(ruby) as ITextInputData);
    const bounds = ['\n', '\u200B', '\u2060'].includes(ruby.text) ? { width: 0 } : bodyRun ? { width: bodyRun.width } : rubyNode.getBounds('content', 'inner');
    const spacingWidth = ruby.text === ' ' ? this.wordSpacing : 0;

    const measured = ruby as RubyLayout;
    measured.rubyNode = rubyNode;
    measured.bodyRun = bodyRun;
    measured.originalWidth = bounds.width + spacingWidth;
    measured.normalWidth = measured.originalWidth;
    measured.originalHeight = measured.text === '\n' ? 0 : this.getLineHeight();
    measured.width = measured.originalWidth;
    measured.height = measured.originalHeight;

    return rubyNode;
  }

  /** 创建注音节点，在居中锚点下测量自然占宽。 */
  createRtNode(rt: Annotation) {
    const rtNode = new Text({
      ...this.getRtTextStyle(rt),
      around: { type: 'percent', x: 0.5, y: 0 },
    } as ITextInputData);

    this.group!.add(rtNode);
    rt.rtNode = rtNode;
    if (this.rtScaleXOverride === null) rt.width = rtNode.getBounds('content', 'inner').width;
    else rtNode.scaleX = this.rtScaleXOverride;
  }

  /** 计算注音的最小占宽。整组超出一行时，按比例分配可用于注音的空间。 */
  private fitAnnotationWidths() {
    for (const items of this.parseList) {
      let requiredPadding = 0;
      for (const { ruby, rt } of items) {
        if (rt.width === undefined) continue;
        rt.minWidth = rt.width * minRtScaleX;
        requiredPadding += getRtPadding(ruby.originalWidth, rt.minWidth) * 2;
      }
      if (!this.width || !requiredPadding) continue;

      const bodyWidth = items.reduce((sum, { ruby, rt }) => {
        const padding = rt.minWidth === undefined ? this.getPaddingWidth(ruby) : 0;
        return sum + ruby.originalWidth + padding;
      }, 0);
      const availablePadding = Math.max(0, this.width - bodyWidth);
      if (requiredPadding <= availablePadding) continue;

      const ratio = availablePadding / requiredPadding;
      for (const { ruby, rt } of items) {
        if (rt.minWidth === undefined || rt.minWidth <= ruby.originalWidth) continue;
        rt.minWidth = ruby.originalWidth + (rt.minWidth - ruby.originalWidth) * ratio;
      }
    }
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
    const rubyLineMap = new Map<number, RubyLayout[]>();
    this.rubyList.forEach(ruby => {
      if (ruby.line < 0) {
        return;
      }
      if (!rubyLineMap.has(ruby.line)) {
        rubyLineMap.set(ruby.line, []);
      }
      rubyLineMap.get(ruby.line)!.push(ruby);
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
   * 4. 测量正文，处理超宽回退，再测量注音。
   * 5. 计算压缩、对齐、注音、渐变与边界。
   * 6. 将结果挂入当前 Group。
   */
  compressText() {
    glyphResolvers.set(this, getGlyphMetrics(this.fontFamily, sideBearingModes.get(this), layoutFonts.get(this)));
    this.resetCompressionState();
    this.rebuildParseCache();
    this.resetGroup();
    this.createRuby();
    this.compressRuby();
    this.alignRuby();
    this.placeRt();
    this.createGradient();
    this.createBounds();
    this.add(this.group!);
  }

  /**
   * 测量并处理超宽正文，再按绘制顺序加入正文和注音节点。
   */
  createRuby() {
    this.rubyList.forEach(ruby => {
      this.createRubyNode(ruby);
    });
    this.applyOverflowFallback();
    this.rubyList.forEach(ruby => {
      this.group!.add(ruby.rubyNode);
    });
    for (const { rt } of this.flatItemList) {
      if (rt.text) this.createRtNode(rt);
    }
    this.fitAnnotationWidths();
    this.relayoutBody();
  }

  // 超宽回退处理

  /**
   * 在给定起点上，通过二分查找找到当前容器宽度下可容纳的最大文本片段。
   *
   * 该方法会不断创建临时测量 item，保留最后一个能放下的候选项，
   * 是超长连续文本切段的核心测量逻辑。
   */
  findLargestFittingTextFragment(textList: string[], start: number, bold: boolean) {
    let low = start;
    let high = textList.length;
    let bestItem: TextItem | null = null;
    let bestEnd = start + 1;

    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      const nextItem = this.createMeasuredPlainTextItem(textList.slice(start, mid).join(''), bold);

      if (nextItem.ruby.width <= this.width) {
        this.destroyRubyNode(bestItem?.ruby);
        bestItem = nextItem;
        bestEnd = mid;
        low = mid;
      } else {
        this.destroyRubyNode(nextItem.ruby);
        high = mid - 1;
      }
    }

    const item = bestItem ?? this.createMeasuredPlainTextItem(textList[start], bold);
    if (defaultMeasurementMethods.every(([name, method]) => this[name] === method)) fittingEnds.set(item, bestEnd);
    return item;
  }

  /**
   * 将单个纯文本 item 按宽度切分成多个可容纳片段。
   *
    * 该方法仅在单个纯文本片段自身超宽时作为回退路径触发。
    *
   * 切分结果仍然保持 itemList 结构，便于直接复用现有布局流程。
   */
  splitPlainTextItemIntoFittingFragments(item: TextItem) {
    const textList = this.getTextCharList(item.ruby.text);
    const allowed = emergencyBreaks(textList);
    const itemList = [];
    let start = 0;

    while (start < textList.length) {
      let bestItem = this.findLargestFittingTextFragment(textList, start, item.ruby.bold);
      let end = fittingEnds.get(bestItem) ?? start + this.getTextCharLength(bestItem.ruby.text);
      if (allowed && !allowed.has(end)) {
        const measuredEnd = end;
        while (end > start && !allowed.has(end)) end--;
        if (end === start) {
          end = measuredEnd;
          while (!allowed.has(end)) end++;
        }
        this.destroyRubyNode(bestItem.ruby);
        bestItem = this.createMeasuredPlainTextItem(textList.slice(start, end).join(''), item.ruby.bold);
      }

      itemList.push([bestItem]);
      start = end;
    }

    return itemList;
  }

  /**
   * 对单个 item 应用超宽回退扩展。
   *
   * 如果该 item 可拆分，则会先清理原有测量节点，再按宽度切成多个片段；
   * 否则保持原样返回。
   */
  expandItemForOverflowFallback(item: TextItem) {
    if (this.isSplittablePlainTextItem(item)) {
      this.destroyRubyNode(item.ruby);
      return this.splitPlainTextItemIntoFittingFragments(item);
    }

    return [[item]];
  }

  /**
   * 将一个超宽 itemList 按规则展开成多个可布局片段。
   */
  splitOversizedItemList(itemList: BreakUnit) {
    const groups: BreakUnit[] = [];
    const allowed = emergencyBreakOffsets(itemList.map(item => item.ruby.text).join(''));
    let offset = 0;
    for (const next of itemList.flatMap(item => this.expandItemForOverflowFallback(item))) {
      const previous = groups.at(-1);
      if (previous && allowed && !allowed.has(offset)) previous.push(...next);
      else groups.push(next);
      offset += next.reduce((sum, item) => sum + item.ruby.text.length, 0);
    }
    return groups;
  }

  /**
   * 对单个 itemList 应用超宽回退逻辑。
   *
   * 只有当 itemList 总宽度超过容器宽度，且其中存在允许切段的纯文本项时，
   * 才会触发回退切分；否则保持原始结构。
   */
  applyOverflowFallbackToItemList(itemList: BreakUnit) {
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
   * 该方法会重建 hardBreakSegments、parseList 以及依赖它们的平铺缓存，
   * 确保后续布局直接基于已经切段后的结构运行。
   */
  applyOverflowFallback() {
    if (!this.width) {
      return;
    }

    const nextSegments = this.hardBreakSegments.map(segment => {
      return segment.flatMap(itemList => this.applyOverflowFallbackToItemList(itemList));
    });

    this.hardBreakSegments = nextSegments;
    this.parseList = nextSegments.flat();
    this.updateLayoutCache();
  }

  /**
   * 计算显式换行段排进一行所需的横向倍率。
   */
  calculateSegmentScaleX(segment: HardBreakSegment) {
    let segmentWidth = 0;
    let availableWidth = this.width;
    const annotations: { bodyWidth: number; minWidth: number }[] = [];

    for (const itemList of segment) {
      for (const { ruby, rt } of itemList) {
        segmentWidth += ruby.originalWidth;
        if (rt.minWidth === undefined) availableWidth -= this.getPaddingWidth(ruby);
        else annotations.push({ bodyWidth: ruby.originalWidth, minWidth: rt.minWidth });
      }
    }

    if (!segmentWidth) return 1;

    const maxStep = Math.min(Math.floor(availableWidth / segmentWidth * segmentScaleSteps), segmentScaleSteps);
    if (!Number.isFinite(maxStep) || maxStep <= 0) return undefined;
    if (!annotations.length) return maxStep / segmentScaleSteps;

    // 试算正文倍率时，按注音压缩下限预留两侧空间。
    const fits = (scaleX: number) => {
      let occupied = segmentWidth * scaleX;
      for (const { bodyWidth, minWidth } of annotations) {
        occupied += getRtPadding(bodyWidth * scaleX, minWidth) * 2;
      }
      return occupied <= availableWidth;
    };
    if (fits(maxStep / segmentScaleSteps)) return maxStep / segmentScaleSteps;

    let low = 1;
    let high = maxStep - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (fits(mid / segmentScaleSteps)) low = mid + 1;
      else high = mid - 1;
    }
    return high > 0 ? high / segmentScaleSteps : undefined;
  }

  /** 一次计算全部指定段的倍率，再刷新正文的位置和行数。 */
  updateSegmentScales() {
    this.segmentScaleX.clear();
    for (const number of this.compressSegments) {
      const segmentIndex = number - 1;
      if (segmentIndex >= this.hardBreakSegments.length) break;
      const scaleX = this.calculateSegmentScaleX(this.hardBreakSegments[segmentIndex]);
      if (scaleX !== undefined) this.segmentScaleX.set(segmentIndex, scaleX);
    }
    this.relayoutBody();
  }

  /**
   * 判断当前布局状态下末尾 ruby 是否已经超出高度限制。
   */
  doesOverflowHeight(lastRuby?: RubyLayout) {
    return !!(this.height && lastRuby && exceedsHeight(this.getLayoutHeight(), this.height));
  }

  /**
   * 判断当前高度压缩是否已经达到单行收敛边界。
   *
   * 当文本已经被压缩到一行，但单行本身的高度仍然超过容器高度时，
   * 继续做横向压缩也无法进一步降低高度，应直接停止压缩。
   */
  reachedSingleLineHeightLimit(lastRuby?: RubyLayout) {
    return !!(this.height && lastRuby && this.currentLine === 0 && exceedsHeight(this.getLineHeight(), this.height));
  }

  /** 固定前缀的实际换行也计入下界；最后一个硬换行之后至少需要一行。 */
  getMinimumLayoutHeight() {
    let lines = this.rubyList.length ? 1 : 0;
    for (const ruby of this.rubyList) if (ruby.text === '\n') lines = ruby.line + 2;
    return lines * this.getLineHeight();
  }

  /** 搜索满足高度限制的末段横向倍率，无解返回 null。 */
  findScaleXForHeight() {
    const lastRuby = this.rubyList[this.rubyList.length - 1];
    if (!this.doesOverflowHeight(lastRuby)) return this.lastSegmentScaleX;
    if (exceedsHeight(this.getMinimumLayoutHeight(), this.height)) return null;
    let lowerScaleX = 0;
    let upperScaleX = this.lastSegmentScaleX;
    let bestScaleX: number | null = null;
    // 自定义布局辅助方法的实例继续使用原路径，保留扩展行为。
    const numericTrial = defaultTextMethods.every(([name, method]) => this[name] === method);
    let tried = false;
    for (let iteration = 0; iteration < scaleXSearchLimit; iteration++) {
      const candidateScaleX = (lowerScaleX + upperScaleX) / 2;
      if (!(candidateScaleX > 0) || candidateScaleX === lowerScaleX || candidateScaleX === upperScaleX) break;
      this.lastSegmentScaleX = candidateScaleX;
      tried = true;
      if (!numericTrial) this.relayoutBody();
      const overflow = numericTrial
        ? exceedsHeight(trialLayoutHeight(
          this.hardBreakSegments, this.width, this.getLineHeight(),
          this.segmentScaleX, candidateScaleX,
        ), this.height)
        : this.doesOverflowHeight(lastRuby);
      if (overflow) {
        upperScaleX = candidateScaleX;
      } else {
        lowerScaleX = candidateScaleX;
        bestScaleX = candidateScaleX;
      }
      // 保持原先成功路径的试排顺序和精度，避免正常压缩比例发生变化。
      if (!overflow && upperScaleX - lowerScaleX <= scaleXSearchPrecision) break;
    }
    // 同步最后一次候选的节点，调用方随后应用选中的最佳倍率。
    if (numericTrial && tried) this.relayoutBody();
    return bestScaleX;
  }

  // 压缩与对齐

  /**
   * 根据当前宽高限制计算正文压缩比例。
   *
   * 将选中的显式段尽量收进一行。高度不足时，继续搜索可用的末段倍率。
   *
   * 当开启 autoSmallSize 且缩放过小时，会切换到 smallFontSize 再重新计算。
   */
  compressRuby() {
    if (this.compressSegments.length && this.width) this.updateSegmentScales();
    const normalScaleX = this.findScaleXForHeight();
    let selectedScaleX = normalScaleX ?? 1;
    const canUseSmall = this.autoSmallSize && this.fontSizeScale <= 1 && !this.isSmallSize && this.smallFontSize > 0 && this.smallFontSize < this.fontSize;
    if (canUseSmall && (normalScaleX === null || normalScaleX < smallFontFallbackScaleXThreshold)) {
      this.isSmallSize = true;
      this.updateFontSize();
      const smallScaleX = this.findScaleXForHeight();
      if (smallScaleX !== null || normalScaleX === null) {
        selectedScaleX = smallScaleX ?? 1;
      } else {
        this.isSmallSize = false;
        this.updateFontSize();
        selectedScaleX = normalScaleX;
      }
    }
    if (this.lastSegmentScaleX !== selectedScaleX) {
      this.lastSegmentScaleX = selectedScaleX;
      this.relayoutBody();
    }
  }

  /**
   * 获取当前需要参与对齐处理的行数。
   *
   * 当存在压缩、居中、右对齐或最后一行也需要 justify 时，需要把最后一行也纳入对齐。
   */
  getAlignLineCount() {
    return this.lastSegmentScaleX < 1 || ['center', 'right'].includes(this.textAlign) || this.textJustifyLast ? this.currentLine + 1 : this.currentLine;
  }

  /**
   * 获取某一行在当前布局后的剩余可用宽度。
   */
  getLineRemainWidth(lineList: RubyLayout[]) {
    const lastRuby = lineList.findLast(ruby => ruby.text !== '\n');
    if (!lastRuby) return 0;
    const lastRubyNode = lastRuby.rubyNode;
    const lastPaddingRight = lastRuby.paddingRight || 0;

    return this.width - lastRubyNode.x! - lastRuby.width - lastPaddingRight;
  }

  /**
   * 按给定偏移规则整体移动一行 ruby 的 x 坐标。
   */
  offsetRubyLine(lineList: RubyLayout[], offsetStep: (index: number) => number) {
    lineList.forEach((ruby, index) => {
      ruby.rubyNode.x = ruby.rubyNode.x! + offsetStep(index);
    });
  }

  /**
   * 对单行 ruby 执行居中对齐。
   */
  alignCenterLine(lineList: RubyLayout[], remainWidth: number) {
    this.offsetRubyLine(lineList, () => remainWidth / 2);
  }

  /**
   * 对单行 ruby 执行右对齐。
   */
  alignRightLine(lineList: RubyLayout[], remainWidth: number) {
    this.offsetRubyLine(lineList, () => remainWidth);
  }

  /**
   * 对单行 ruby 执行两端对齐。
   *
   * 仅当当前行存在至少两个可参与分配的项且末尾不是显式换行符时才会生效。
   */
  alignJustifyLine(lineList: RubyLayout[], remainWidth: number) {
    if (lineList.length <= 1 || lineList[lineList.length - 1].text === '\n') {
      return;
    }

    const gap = remainWidth / (lineList.length - 1);
    this.offsetRubyLine(lineList, index => index * gap);
  }

  /**
   * 根据当前 textAlign 对单行 ruby 应用对应的对齐逻辑。
   */
  alignRubyLine(lineList: RubyLayout[], remainWidth: number) {
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

  /** 按最终的正文占宽适配注音并居中。 */
  placeRt() {
    for (const { ruby, rt } of this.flatItemList) {
      const rtNode = rt.rtNode;
      if (!rtNode) continue;

      let centerX = ruby.rubyNode.x! + ruby.width / 2;
      const targetWidth = ruby.width * rtStretchTargetWidthRatio;
      if (rt.width !== undefined && rt.minWidth !== undefined && rt.width > ruby.width) {
        rtNode.scaleX = Math.max(ruby.width, rt.minWidth) / rt.width;
      } else if (rt.width !== undefined && rt.width < targetWidth && this.rtLetterSpacing === 0 && this.getTextCharLength(ruby.text) > 1) {
        const gapCount = this.getTextCharLength(rt.text) - 1;
        if (gapCount > 0) {
          const maxSpacing = (this.getCurrentFontSize() - this.rtFontSize / 2) * this.fontSizeScale;
          const spacing = Math.min((targetWidth - rt.width) / gapCount, maxSpacing);
          if (spacing > 0) {
            rtNode.letterSpacing = spacing;
            // Leafer 在末字之后也计入字距，补偿半个字距使可见文字居中。
            centerX += spacing / 2;
          }
        }
      }
      rtNode.x = centerX;
      rtNode.y = ruby.rubyNode.y! + this.rtOffsetY * this.fontSizeScale;
    }
  }

  /**
   * 更新单个 ruby 的横向缩放比例和当前宽度。
   */
  applyBodyScaleX(ruby: RubyLayout, scaleX: number) {
    const rubyNode = ruby.rubyNode;
    rubyNode.scaleX = scaleX;
    ruby.width = ruby.originalWidth * scaleX;
  }

  /**
   * 计算一个 itemList 在当前状态下的总宽度。
   *
   * 宽度包含每个 ruby 自身宽度以及左右补白。
   */
  getItemWidth(itemList: BreakUnit) {
    let itemWidth = 0;

    itemList.forEach(item => {
      const ruby = item.ruby;
      itemWidth += ruby.width + this.getPaddingWidth(ruby);
    });

    return itemWidth;
  }

  // 布局流程

  /**
   * 按所属的显式段为一个 itemList 的正文应用横向倍率。
   */
  applyBodyScaleXToItems(itemList: BreakUnit, segmentIndex: number, isLastSegment: boolean) {
    const segmentScaleX = this.segmentScaleX.get(segmentIndex);
    for (const item of itemList) {
      const { ruby } = item;
      const scaleX = getBodyScaleX(ruby.text, segmentScaleX, isLastSegment, this.lastSegmentScaleX);
      this.applyBodyScaleX(ruby, scaleX);
      this.updateRtPadding(item);
    }
  }

  /**
   * 重置布局过程中的游标状态。
   */
  resetLayoutPosition() {
    this.#lastPlacedIndex = -1;
    this.currentX = 0;
    this.currentY = 0;
    this.currentLine = 0;
  }

  /**
   * 判断当前 itemList 在当前位置是否需要换到下一行。
   */
  shouldWrapItemList(itemList: BreakUnit, itemWidth: number) {
    const hasBreak = itemList.some(item => item.ruby.text === '\n');
    const isOverWidth = this.width && this.currentX && this.currentX + itemWidth > this.width;

    return hasBreak || isOverWidth;
  }

  /**
   * 顺序定位一个 itemList 中所有 ruby 的坐标。
   */
  positionItemListRuby(itemList: BreakUnit) {
    itemList.forEach(item => {
      this.positionRuby(item.ruby);
    });
  }

  /**
   * 布局一个 itemList。
   *
   * 包括缩放、换行判断以及最终定位。
   */
  layoutItemList(itemList: BreakUnit, segmentIndex: number, isLastSegment: boolean) {
    if (itemList.some(item => item.ruby.text === '\n')) {
      this.positionItemListRuby(itemList);
      this.addLine();
      return;
    }
    this.applyBodyScaleXToItems(itemList, segmentIndex, isLastSegment);
    const itemWidth = this.getItemWidth(itemList);

    if (this.shouldWrapItemList(itemList, itemWidth)) {
      this.addLine();
    }

    this.positionItemListRuby(itemList);
  }

  /**
   * 布局一个显式换行分组中的所有 itemList。
   */
  layoutSegment(segment: HardBreakSegment, segmentIndex: number) {
    const isLastSegment = segmentIndex === this.hardBreakSegments.length - 1;

    segment.forEach(itemList => {
      this.layoutItemList(itemList, segmentIndex, isLastSegment);
    });
  }

  /**
   * 根据当前缩放状态重新执行一次正文布局。
   *
   * 该方法会重置游标，然后按显式换行分组顺序重新排版，最后刷新 rubyLineMap。
   */
  relayoutBody() {
    const previous = this.#orderedLayout;
    // 自定义辅助方法可能改变排版顺序，保守保留完整的行尾扫描。
    this.#orderedLayout = defaultTextMethods.every(([name, method]) => this[name] === method);
    try {
      this.resetLayoutPosition();
      // 试排中的行尾空格可能在下一轮回到行内，先恢复节点并清除旧行号。
      this.rubyList.forEach(ruby => {
        ruby.line = -1;
        ruby.rubyNode.visible = !['\n', '\u200B', '\u2060'].includes(ruby.text);
      });

      this.hardBreakSegments.forEach((segment, segmentIndex) => {
        this.layoutSegment(segment, segmentIndex);
      });
      this.updateRubyLineMap();
    } finally { this.#orderedLayout = previous; }
  }

  /**
   * 切换字号后更新所有 ruby 尺寸，并按新宽度重新计算指定段倍率。
   *
   * 更新后会立即重新布局，以确保新的字号、宽度和高度信息全部生效。
   */
  updateFontSize() {
    this.lastSegmentScaleX = 1;
    const fontSize = this.getCurrentFontSize();
    const fontSizeRatio = fontSize / this.fontSize;
    this.rubyList.forEach(ruby => {
      const rubyNode = ruby.rubyNode;
      if (ruby.bodyRun) {
        ruby.width = ruby.originalWidth = ruby.bodyRun.resize(fontSize * this.fontSizeScale, this.getLineHeight());
      } else {
        const textNode = rubyNode as IText;
        textNode.fontSize = fontSize * this.fontSizeScale;
        textNode.lineHeight = this.getLineHeight();
        // 从本次排版的原字号测量计算，避免恢复候选时累计缩放。
        ruby.width = ruby.originalWidth = ruby.normalWidth * fontSizeRatio;
      }
      ruby.height = ruby.originalHeight = ruby.text === '\n' ? 0 : this.getLineHeight();
    });
    this.fitAnnotationWidths();
    if (this.compressSegments.length && this.width) this.updateSegmentScales();
    else this.relayoutBody();
  }

  /**
   * 定位单个 ruby 的坐标并更新当前行游标。
   */
  positionRuby(ruby: RubyLayout) {
    this.#lastPlacedIndex++;
    const paddingLeft = ruby.paddingLeft || 0;
    const paddingRight = ruby.paddingRight || 0;
    const rubyNode = ruby.rubyNode;
    rubyNode.x = this.currentX + paddingLeft;
    rubyNode.y = this.currentY;
    this.currentX += ruby.width + paddingLeft + paddingRight;
    ruby.line = this.currentLine;
  }

  /**
   * 切换到下一行并更新行游标。
   *
   * 切行前会先清理上一行末尾多余空格。
   */
  addLine() {
    this.removeLineLastSpace(this.currentLine);
    this.currentX = 0;
    this.currentLine++;
    this.currentY = this.currentLine * this.getLineHeight();
  }

  /**
   * 隐藏指定行尾部连续的空格项，保留节点供后续试排复用。
   *
   * 这些空格在排版结束后不应继续占据宽度，因此会同步回退 currentX。
   */
  removeLineLastSpace(line: number) {
    const end = this.#orderedLayout ? Math.min(this.#lastPlacedIndex, this.rubyList.length - 1) : this.rubyList.length - 1;
    for (let index = end; index >= 0; index--) {
      const ruby = this.rubyList[index];
      if (ruby.line !== line) {
        continue;
      }
      if (ruby.text === '\n') continue;
      if (ruby.text !== ' ') {
        break;
      }
      const rubyNode = ruby.rubyNode;
      const paddingLeft = ruby.paddingLeft || 0;
      const paddingRight = ruby.paddingRight || 0;
      this.currentX -= ruby.width + paddingLeft + paddingRight;
      rubyNode.visible = false;
      ruby.line = -1;
    }
  }

  /** 正文缩窄时重新计算对应注音的预留空间。 */
  updateRtPadding({ ruby, rt }: TextItem) {
    if (rt.minWidth === undefined) return;

    const padding = getRtPadding(ruby.width, rt.minWidth);
    ruby.paddingLeft = padding;
    ruby.paddingRight = padding;
  }

  // 视觉效果与边界

  /**
   * 为正文节点应用渐变、描边和阴影效果。
   *
   * 仅在 gradient 开启时生效。
   */
  createGradient() {
    if (this.gradient) {
      const fontSize = this.getCurrentFontSize();
      this.rubyList.forEach(ruby => {
        const rubyNode = ruby.rubyNode;
        const paint: TextPaint = {
          fill: {
            type: 'linear',
            stops: [
              { offset: gradientStops[0], color: this.gradientColor1 },
              { offset: gradientStops[1], color: this.gradientColor2 },
              { offset: gradientStops[2], color: this.gradientColor2 },
              { offset: gradientStops[3], color: this.gradientColor1 },
              { offset: gradientStops[4], color: this.gradientColor2 },
            ],
          },
          stroke: gradientStrokeColor,
          strokeWidth: fontSize * gradientStrokeWidthRatio * this.fontSizeScale,
          strokeAlign: 'outside',
          shadow: {
            blur: fontSize * gradientShadowBlurRatio * this.fontSizeScale,
            x: 0,
            y: fontSize * gradientShadowOffsetYRatio * this.fontSizeScale,
            color: gradientStrokeColor,
          },
        };
        if (ruby.bodyRun) ruby.bodyRun.paint(paint);
        else rubyNode.set(paint as ITextInputData);
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
      const lastRuby = lineList.findLast(ruby => ruby.text !== '\n');
      if (!lastRuby) return;
      const lastRubyNode = lastRuby.rubyNode;
      const lastPaddingRight = lastRuby.paddingRight || 0;
      this.bounds.width = Math.max(this.bounds.width, lastRubyNode.x! + lastRuby.width + lastPaddingRight);
    });
    this.bounds.height = this.getLayoutHeight();
    this.bounds.width *= this.scaleX!;
    this.bounds.height *= this.scaleY!;
  }
}

const fittingEnds = new WeakMap<TextItem, number>();
const defaultMeasurementMethods = [
  'findLargestFittingTextFragment', 'createMeasuredPlainTextItem', 'createRubyNode', 'createPlainTextItem', 'createTextItem',
  'getRubyTextStyle', 'getTextCharList', 'getTextCharLength', 'destroyRubyNode',
].map(name => {
  const key = name as keyof CompressText;
  return [key, CompressText.prototype[key]] as const;
});

const defaultTextMethods = Object.getOwnPropertyNames(CompressText.prototype)
  .filter(name => name !== 'constructor')
  .map(name => {
    const key = name as keyof CompressText;
    return [key, CompressText.prototype[key]] as const;
  });
