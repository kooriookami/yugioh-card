# 卡片与文本排版内部命名整理

本次以 `d7f362f` 为排版基线，统一五种卡片及 `CompressText` 的内部术语，并按职责整理文本模块。公开参数的命名及兼容迁移另行讨论。[Issue #35](https://github.com/kooriookami/yugioh-card/issues/35) · [断行规则](text-breaking.md)

## 接口边界

中英文 README 中记录的五种卡片参数是对外契约，包括构造选项、数据表和使用示例中的字段。`descriptionZoom`、`firstLineCompress`、`scale` 等按原名和原语义接收，`ready`、`setData()` 和通过 `card.leafer` 导出沿用原用法。

未记录的卡片参数、卡片样式和渲染状态可以直接整理。`CompressText` 是库内实现，字段、方法和子模块随调用点一起改名或移动。源码与项目内测试统一使用新名称；对照工具负责读取冻结版本的旧名称。

五种卡片的 `data` 默认值逐项对过两份 README，共 99 个字段位置。唯一未记录的是第二期卡的 `rare`，渲染器没有读取，已从该卡的默认值和演示数据移除。普通游戏王卡和 Rush Duel 的 `rare` 各自有公开定义。[中文参数](../README.md#-data-属性) · [英文参数](../README.en.md#-data-properties)

## 命名规则与落点

- **段（segment）**按显式换行划分，**行（line）**指实际排出来的一行，**片段（fragment）**用于超宽连续文字的应急切分。
- **字号倍率（fontSizeScale）**影响测量前的字号及派生尺寸。**轴向倍率（ScaleX、ScaleY）**用于某一对象的变换。**比值（Ratio）**用于尺寸比较或相对比例，**阈值（Threshold、Min）**用于选择策略。
- 注音内部用 `rt`，与解析结果的 `rt` 含义一致。注音纵向偏移和横向倍率在样式与排版层使用同一套命名。

| 原名称 | 新名称 | 用途 |
| --- | --- | --- |
| `newlineList`、`newlineIndex`、`lastNewline` | `hardBreakSegments`、`segmentIndex`、`isLastSegment` | 显式段列表、索引及末段标记 |
| `firstLineTextScale`、`textScale` | `firstSegmentScaleX`、`lastSegmentScaleX` | 首段和末段正文的横向倍率 |
| `getFirstLineScale()`、`findHeightScale()` | `calculateFirstSegmentScaleX()`、`findScaleXForHeight()` | 首段适配宽度，末段通过横向压缩适配高度 |
| `updateTextScale()` | `relayoutBody()` | 重排正文，刷新坐标、视觉行和行映射 |
| `updateRubyScale()`、`updateItemRubyScale()` | `applyBodyScaleX()`、`applyBodyScaleXToItems()` | 应用正文横向倍率并更新逻辑占宽 |
| `fontScale`、`firstLineCompress`（排版内部） | `fontSizeScale`、`compressFirstSegment` | 分别接收卡片的 `descriptionZoom` 和 `firstLineCompress` |
| `rtTop`、`rtFontScaleX` | `rtOffsetY`、`rtScaleXOverride` | 注音相对于正文的纵向偏移及固定横向倍率 |
| `sizePercent`、`rtStretchRate`、`rtCompressRate` | `fontSizeRatio`、`rtStretchTargetWidthRatio`、`minAutoRtScaleX` | 字号比值、注音覆盖率及自动横向倍率下限 |
| `noCompressText`、`autoSmallSizeScaleThreshold` | `lastSegmentUnscaledSymbols`、`smallFontFallbackScaleXThreshold` | 保留原宽的末段符号，以及小字回退阈值 |
| `updateScale()`（Card） | `applyCardScale()` | 五种卡共用的整卡缩放，读取公开的 `data.scale` |

末段可能折成多条视觉行，进入高度试排时这些行都使用同一个末段横向倍率，部分固定符号保留原宽。开启首段压缩时，第一段优先使用首段倍率，即便它同时也是末段。字号倍率参与原有小字判定。普通游戏王卡的主效果与灵摆效果继续共用 `descriptionZoom`。

`rtScaleXOverride` 改用 `null` 进入自动适配，固定数值直接应用到注音节点的横向变换。`1` 因此能明确表示固定 100%。卡片内置样式已有的 `1.2` 继续传入，其余卡片样式走自动适配。此参数仅在项目内部使用。[正文与注音排版](../packages/src/compress-text/compress-text.js)

## 代码职责

```text
packages/src/compress-text/
├── index.js                  内部排版类入口
├── compress-text.js          配置更新、排版流程、Leafer 节点
├── breaking/
│   ├── split-break-word.js    文本标记解析与断点规则
│   └── text-graphemes.js      字素及其边界
├── layout/
│   ├── body-scale.js         正文横向倍率规则
│   └── trial-layout.js       仅计算候选行框高度
├── glyph-metrics.js          字体度量和度量缓存
├── layout-context.js         卡片绘制时共用的字体上下文
├── body-run.js               正文度量与 Leafer 节点适配
└── __tests__/                回归用例和浏览器验证
```

正文布局与高度试排共用 `getBodyScaleX()`，由 `CompressText` 应用倍率和维护场景节点。`trialLayoutHeight()` 仍只读布局数据。首段宽度计算按原顺序遍历并减去补白，直接使用已有的分组，省去临时数组。断行模块和字素模块放在一起，字体度量和节点适配按需直接引入字素模块。注音扩宽、二次重排和绘制顺序继续在排版类中协调。

项目内继承测试改用新方法名，仍覆盖自定义布局与测量方法使用原路径的情况。纯计算沿用原有数值运算顺序、二分精度、尝试预算、符号例外和显式换行处理。[继承测试](../packages/src/compress-text/__tests__/trial-layout.test.js)

## 验收

- 对照固定提交 `d7f362f`。114 组文本包含前轮的 15 组断行边界用例，本轮对所有用例逐项比较布局和 RGBA。再比较 100 个更新状态、100 张连续导出和五种卡片类型。
- 运行 `pnpm test`、变更文件的 ESLint、库和网站构建。`rtScaleXOverride` 的回归覆盖自动适配、固定倍率以及切回自动。
- 将 dist 打成 tgz 后装入独立项目，在 Node 和 Edge 中验证实际发布包。浏览器按 `baseline`、`source`、`package` 顺序运行 `/tools/perf/browser.html?run=refactor&mode=baseline` 及其对应模式，准备基线用 `node tools/perf/prepare-baseline.mjs --refactor`。
- 对照 `tools/perf/benchmark-layout.mjs` 的位置、颜色、宽度、内容更新及长文本场景，检查重构热路径。[性能验证工具](../tools/perf/benchmark-layout.mjs)

Node / Skia 与 Edge 均完成基线、源码及独立安装包的对照。114 组文本、100 个更新状态、100 张连续导出和五种卡片类型的布局及 RGBA 完全一致。156 项测试通过，ESLint、库和网站构建通过。五种卡片在 README 中记录的默认值逐项核对一致。

重构前后的节点工作量一致。位置和颜色更新均重建 0 次正文组，高度试排的节点写入为 672 次，长英文分字为 2 次。一次成对计时中，宽度更新中位数为 2.42 → 2.52 ms，内容更新为 2.68 → 2.77 ms，长英文为 8.57 → 9.05 ms，长 CJK 为 12.76 → 12.44 ms。该计时用于排查明显退化。
