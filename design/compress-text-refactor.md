# 卡片与文本排版内部命名整理

本次以 `d7f362f` 为排版基线，统一五种卡片及 `CompressText` 的内部术语，并按职责整理文本模块。2.0 的公开参数命名已实现，待发布。[Issue #35](https://github.com/kooriookami/yugioh-card/issues/35) · [断行规则](text-breaking.md) · [2.0 公开参数命名](#20-公开参数命名)

## 1.x 内部重构记录

下列接口边界、术语、目录及验收结果对应内部重构提交 `0b3d305`。

### 接口边界

1.x 内部重构以基线中英文 README 记载的五种卡片参数为对外契约，包括构造选项、数据表和使用示例中的字段。`descriptionZoom`、`firstLineCompress`、`scale` 等按原名和原语义接收，`ready`、`setData()` 和通过 `card.leafer` 导出沿用原用法。

未记录的卡片参数、卡片样式和渲染状态可以直接整理。`CompressText` 是库内实现，字段、方法和子模块随调用点一起改名或移动。源码与项目内测试统一使用新名称；对照工具负责读取冻结版本的旧名称。

五种卡片的 `data` 默认值逐项对过两份 README，共 99 个字段位置。唯一未记录的是第二期卡的 `rare`，渲染器没有读取，已从该卡的默认值和演示数据移除。普通游戏王卡和 Rush Duel 的 `rare` 各自有公开定义。[1.x 中文参数](https://github.com/kooriookami/yugioh-card/blob/d7f362f5184ac3da1e3ae0ac71f50ac4f53f58d1/README.md#-data-属性) · [1.x 英文参数](https://github.com/kooriookami/yugioh-card/blob/d7f362f5184ac3da1e3ae0ac71f50ac4f53f58d1/README.en.md#-data-properties)

### 命名规则与落点

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

`rtScaleXOverride` 改用 `null` 进入自动适配，固定数值直接应用到注音节点的横向变换。`1` 因此能明确表示固定 100%。卡片内置样式已有的 `1.2` 继续传入，其余卡片样式走自动适配。此参数仅在项目内部使用。[当时的正文与注音排版](https://github.com/kooriookami/yugioh-card/blob/0b3d305b58c559b511371a7a7d5a14267e19c9c0/packages/src/compress-text/compress-text.js)

### 代码职责

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

### 验收

- 对照固定提交 `d7f362f`。114 组文本包含前轮的 15 组断行边界用例，本轮对所有用例逐项比较布局和 RGBA。再比较 100 个更新状态、100 张连续导出和五种卡片类型。
- 运行 `pnpm test`、变更文件的 ESLint、库和网站构建。`rtScaleXOverride` 的回归覆盖自动适配、固定倍率以及切回自动。
- 将 dist 打成 tgz 后装入独立项目，在 Node 和 Edge 中验证实际发布包。浏览器按 `baseline`、`source`、`package` 顺序运行 `/tools/perf/browser.html?run=refactor&mode=baseline` 及其对应模式，准备基线用 `node tools/perf/prepare-baseline.mjs --refactor`。
- 对照 `tools/perf/benchmark-layout.mjs` 的位置、颜色、宽度、内容更新及长文本场景，检查重构热路径。[性能验证工具](../tools/perf/benchmark-layout.mjs)

Node / Skia 与 Edge 均完成基线、源码及独立安装包的对照。114 组文本、100 个更新状态、100 张连续导出和五种卡片类型的布局及 RGBA 完全一致。156 项测试通过，ESLint、库和网站构建通过。五种卡片在 README 中记录的默认值逐项核对一致。

重构前后的节点工作量一致。位置和颜色更新均重建 0 次正文组，高度试排的节点写入为 672 次，长英文分字为 2 次。一次成对计时中，宽度更新中位数为 2.42 → 2.52 ms，内容更新为 2.68 → 2.77 ms，长英文为 8.57 → 9.05 ms，长 CJK 为 12.76 → 12.44 ms。该计时用于排查明显退化。

## 2.0 公开参数命名

公开字段变更随 `2.0.0` 发布，属于破坏性升级。接口沿用扁平的 `data` 和局部 `setData()`，让五种卡片在相同含义上使用相同的名字。卡面内容参考英文 TCG 的字段命名，并用日文和简体中文 OCG 的官方资料核对含义。版式和排版选项按渲染器的实际职责命名。[Konami 英文入门](https://www.yugioh-card.com/en/forbeginners/)

### 中日英官方字段对照

规则书、卡片详情和检索页面的标签随用途而异。[简中规则书](https://source.windoent.com/yugioh/rulebook_2020_SC_ver7.pdf) · [日文规则书](https://img.yugioh-card.com/japan/howto/data/rulebook_masterrule20200401_ver1.0.pdf) · [英文规则书](https://img.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf)

| 字段 | 简体中文 OCG | 日文 OCG | 英文 TCG |
| --- | --- | --- | --- |
| 卡名和属性 | 卡名、属性 | カード名、属性 | Card Name、Attribute |
| 等级和阶级 | 等级、阶级 | レベル、ランク | Level、Rank |
| 攻守数值 | 攻击力、守备力 | 攻撃力、守備力 | ATK、DEF |
| 主文本 | 怪兽信息、效果说明（规则书），效果文本（大陆卡查） | モンスター情報、効果説明（规则书），カードテキスト（Neuron） | Card Description（规则书），Card Text（Neuron） |
| 种族（检索） | 种族 | 種族 | Monster Type |
| 种族后的分类（检索） | 其他项目 | その他項目 | Card Type |
| 灵摆效果和刻度 | 灵摆效果、灵摆刻度 | ペンデュラム効果、ペンデュラムスケール | Pendulum Effect、Pendulum Scale |
| 魔法、陷阱图标 | 效果标记（规则书）、效果图标（官网） | 効果アイコン | Icon |
| 连接箭头和数值 | 连接标记、连接数值 | リンクマーカー、LINKの数値 | Link Arrows、LINK Rating |
| 印刷编号 | 卡编号（规则书）、卡片编号（赛事公告） | カードナンバー | Card Number |

以异色眼灵摆龙为例，三版的类型栏分别是「龙族／灵摆／效果」「ドラゴン族／ペンデュラム／効果」和 `Dragon / Pendulum / Effect`。龙族是种族筛选项，灵摆和效果是分类筛选项。[简中卡片页](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=11213&ope=2&request_locale=cn) · [日文卡片页](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=11213&ope=2&request_locale=ja) · [英文卡片页](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=11213&ope=2&request_locale=en) · [简中检索](https://db.yugioh-card-cn.com/card_search.action.html) · [日文检索](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=1&request_locale=ja) · [英文检索](https://www.db.yugioh-card.com/yugiohdb/external/card_search.action)

大陆卡查使用「效果文本」，国际 Neuron 的简中卡片页沿用 `Card Text`。简中官网的卡面图解使用「效果图标」，大陆赛事公告在卡表填写要求中使用「卡片编号」。[大陆卡查](https://db.yugioh-card-cn.com/card_detail.html?id=11213&lang=cn) · [青眼白龙简中卡片页](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=4007&ope=2&request_locale=cn) · [简中官网玩法介绍](https://www.yugioh-card-cn.com/playing) · [大陆赛事公告](https://www.bilibili.com/opus/1199587020115017745)

### 卡面内容

| 1.x 名称 | 2.0 名称 | 含义与适用范围 |
| --- | --- | --- |
| `description` | `cardText` | 三种正面卡的主文本。沿用 Neuron 的 **Card Text**，覆盖效果、召唤素材和通常怪兽的背景文字。[青眼白龙卡页](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=4007&ope=2&request_locale=en) |
| `pendulumDescription` | `pendulumEffect` | 灵摆效果文字。官方卡页单列 **Pendulum Effect**，与主文本独立输入。 |
| `monsterType` | `monsterTypeLine` | 包含种族及后续分类的类型栏整行文字，仍是字符串，保留现有注音和格式标记。 |
| `icon` | `spellTrapIcon` | 魔法或陷阱的装备、永续、反击等图标，沿用现有枚举。 |
| `atk`、`def` | `atk`、`def` | 数字，默认 `0`。普通游戏王卡的 `-1`、`-2` 分别显示为 `?`、`∞`。第二期卡分别显示为 `????`、`X000`。Rush Duel 用 `-1` 显示 `?`。 |
| `arrowList` | `linkArrows` | 连接标记的方向数组，沿用 `1` 到 `8` 的方向编号。取其中有效且唯一的整数方向，用同一组方向点亮箭头、计算卡面的 `LINK` 数值。[箭头绘制](../packages/src/yugioh-card/index.ts#L475) · [LINK 计数](../packages/src/yugioh-card/index.ts#L149) |
| `package` | `cardNumber` | 卡面上用于标识发行版本的印刷编号，沿用字符串，如 `QCAC-SC044` 或 `TN23-EN011`。字段名对应官方 **Card Number**。[Konami 卡表](https://img.yugioh-card.com/en/downloads/rivalry_of_warlords/S_Force-Manual.pdf) |
| `rare` | `rarity` | 罕贵度，沿用普通游戏王卡、Rush Duel 各自支持的效果枚举。[Konami 卡表](https://img.yugioh-card.com/en/downloads/rivalry_of_warlords/S_Force-Manual.pdf) |
| `password` | `password` | 普通游戏王卡和第二期卡的左下角密码。使用字符串，保留前导零。Konami 英文 OCG 产品页使用 **password**，YGOPRODeck 使用 **passcode**。[Konami 英文产品页](https://www.yugioh-card.com/asia/product/limited-pack-gx-%EF%BC%8Dra-yellow%EF%BC%8D/) · [YGOPRODeck API](https://ygoprodeck.com/api-guide/) |
| `image` | `artwork` | 三种正面卡及场地中心卡的主图，沿用现有图片来源字符串。[场地中心卡绘制](../packages/src/field-center-card/index.ts) |
| `logo` | `gameLogo` | 卡背上的主游戏标志，沿用 `ocg`、`tcg`、`rd`，空字符串隐藏标志。[卡背绘制](../packages/src/yugioh-back-card/index.ts) |
| `copyright` | `copyrightLanguage` | 选择版权图案的语言。普通游戏王卡支持 `sc`、`jp`、`en`，第二期卡支持 `jp`，空字符串隐藏图案。 |
| `laser` | `cornerMark` | 选择右下角的角标样式，沿用 `laser1` 至 `laser4`，空字符串隐藏角标。 |

`name`、`language`、`attribute`、`level`、`rank` 和 `pendulumScale` 的含义已明确。Rush Duel 的 `maximumAtk` 对应卡面的 **MAXIMUM ATK**。各类仍接受自身支持的字段和值。[英文规则书](https://img.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf) · [Rush Duel 官方卡表](https://www.db.yugioh-card.com/rushdb/member_deck.action?cgid=951b1e71a6a30f01ee6f025086d06941&dno=46&request_locale=ja)

Rush Duel 的 `password` 仅作为数据字段保留，类型为字符串，默认值为 `''`，演示值为 `'120120000'`。[Rush Duel 实现](../packages/src/rush-duel-card/index.ts) · [演示数据](../src/assets/demo/rush-duel-demo.js)

### 版式和渲染选项

| 1.x 名称 | 2.0 名称 | 含义与适用范围 |
| --- | --- | --- |
| 正面的 `type` | `cardLayout` | 选择怪兽、魔法、陷阱或灵摆版式。项目把 `pendulum` 作为独立的排版分支，规则书则将灵摆归为怪兽卡。[英文规则书](https://img.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf) · [版式选择](../packages/src/yugioh-card/index.ts) |
| `cardType`、`pendulumType` | `monsterFrame`、`pendulumFrame` | 选择对应版式的底框，沿用现有枚举。用 **frame** 与类型栏文字区分，命名参考社区 API 的 `frameType`。[YGOPRODeck API](https://ygoprodeck.com/api-guide/) |
| 卡背的 `type` | `backDesign` | 选择卡背图样，沿用现有枚举。 |
| `font` | `textStylePreset` | 选择包含字体、字号、行高和位置的文字样式预设。普通游戏王卡和第 2 期支持 `custom1`、`custom2`。 |
| `color`、`align` | `nameColor`、`nameTextAlign` | 卡名的颜色和对齐方向，沿用现有类型和默认值。 |
| `gradientColor1`、`gradientColor2` | `nameGradientColor1`、`nameGradientColor2` | 卡名渐变的两个颜色。 |
| `descriptionZoom` | `bodyTextFontSizeScale` | 卡片正文及其注音的字号倍率，影响测量、行高和换行。普通游戏王卡的灵摆效果文本及其注音共用该倍率。 |
| `descriptionAlign` | `cardTextAlign` | 三种正面卡的主文本对齐。支持 `'left'`（左对齐）、`'center'`（居中）、`'right'`（右对齐）和 `'justify'`（两端对齐，默认）。 |
| `firstLineCompress` | `compressCardTextSegments` | 三种正面卡的主文本段号数组，默认 `[]`。尝试把指定的每一段各压进一行。 |
| `descriptionWeight` | `bodyTextStrokeWidth` | 正文描边宽度，覆盖主文本、怪兽类型栏、普通游戏王卡的灵摆文本，以及这些区域对应的注音。 |
| `scale` | `renderScale` | 五种卡共用的整卡渲染倍率，影响画布及导出尺寸。 |

`cardTextAlign` 复用 `CompressText` 的逐行对齐。`left` 以文本区域左缘为起点，`right` 将每一行（含末行）整体靠右。两者都沿用原有测量、断行、压缩和注音排版。灵摆效果栏沿用自身的对齐规则。[逐行对齐实现](../packages/src/compress-text/compress-text.ts#L978)

`compressCardTextSegments` 按传给渲染器的 `cardText` 中的显式换行计数，段号为从 `1` 开始的正整数。换行符先归一化，文末空白按现有规则清理。正文中的空段也占一个段号，自动折行产生的多行仍属于原段。重复段号只处理一次，越界段号忽略。`[]` 交给现有自动排版处理，`[1]` 等价于原首段压缩开启，`[2, 3]` 分别尝试把第 2 段和第 3 段各压进一行。

复用原首段的宽度计算，按选中的段号计算横向倍率，供正文布局和高度试排共用。只应用有限且大于 `0` 的倍率。固定补白占满或超出框宽等情况导致单行压缩无解时，该段恢复常规断行，整体高度仍走现有的小字回退流程。选中的段恰好是末段且有可用倍率时，优先应用指定的单行压缩，再按整体高度判定是否需要小字回退。切换字号时按该字号重新计算指定段的倍率。[指定段倍率计算](../packages/src/compress-text/compress-text.ts#L778) · [倍率优先级](../packages/src/compress-text/layout/body-scale.ts#L4)

### 显示与渲染开关

控制卡面上某个元素显隐的布尔值用 `showXxx`。样式、排版行为和正反面选择用动作命名，`true` 执行该动作。样式和语言用名词字段选择。对于 `gameLogo`、`copyrightLanguage` 等可选图案，空字符串表示隐藏。

| 1.x 名称 | 2.0 名称 | 默认值 | 含义与适用范围 |
| --- | --- | --- | --- |
| `atkBar` | `showBattleStats` | `true` | 在普通游戏王卡的怪兽和灵摆版式中显示攻守栏的分隔线、标签与数值。正文随攻守栏的显隐调整可用高度。[攻守栏绘制](../packages/src/yugioh-card/index.ts#L625) |
| `konami` | `showKonamiLogo` | `true` | 显示卡背上的 KONAMI 标志。[卡背绘制](../packages/src/yugioh-back-card/index.ts) |
| `register` | `showRegisteredMark` | `true` | 显示卡背上的 ® 标记。[卡背绘制](../packages/src/yugioh-back-card/index.ts) |
| `twentieth` | `show20thAnniversaryMark` | `false` | 显示普通游戏王卡的 20 周年标记。[周年标记绘制](../packages/src/yugioh-card/index.ts#L782) |
| `legend` | `showLegendMark` | `false` | 显示 Rush Duel 卡面的 **LEGEND** 标记。[LEGEND 绘制](../packages/src/rush-duel-card/index.ts#L475) |
| `gradient` | `applyNameGradient` | `false` | 使用两个渐变色渲染普通游戏王卡和第二期卡的卡名。 |
| `radius` | `roundCorners` | `true` | 对五种卡应用现有的圆角样式。 |
| 场地中心卡的 `cardBack` | `renderBackSide` | `false` | `true` 渲染背面，`false` 渲染正面。切换会替换底图，并联动主图和遮罩的显示。[场地中心卡绘制](../packages/src/field-center-card/index.ts#L58) |

### 2.0 发布与验收

构造参数、`setData()` 和 `card.data` 统一使用 2.0 的字段名与取值。2.0 起，中英文 README 仅用于项目简介。详细接口和用法由维护者另行编写，调用方根据独立发布的升级说明更新调用代码和存量 JSON。发布时同步更新 [AGENTS.md](../AGENTS.md) 的文档约定。

各卡类分别声明自己的数据类型。构造参数中的 `data` 和 `setData()` 接收该类型的部分字段，`card.data` 使用完整类型。`linkArrows` 和 `compressCardTextSegments` 显式声明为数字数组，`cardTextAlign` 声明为四个字符串字面量的联合类型。

- 发布时将库版本设为 `2.0.0`，同步更新公开类型、Node 示例和网页 JSON 编辑器的示例数据。[库版本清单](../packages/package.json)
- 随库同步发布配套静态资源。使用 `resourcePath` 的调用方同时更新资源目录，包含同名的新版 `ygo-jp.woff2`。新版字体恢复了字符占宽，由排版代码统一缩减留白。公开示例和线上演示使用对应发布的 Git 标签或提交固定资源版本。[日文字体发布约定](jp-font-sidebearings.md#12-已确认的设计决策)
- 将 2.0 的 `dist` 打包成 `.tgz`，在独立消费项目中安装并使用配套静态资源。用 Node 和 Edge 验证五种卡片的构造、`setData()` 局部更新及 `ready` 后的 PNG 导出，覆盖 `false`、`0` 和空字符串等有效输入。以字段变更前后的等价数据和同一套资源对比排版与导出像素。
- 在独立消费项目中从 `.tgz` 导入类并运行 TypeScript 类型检查。验证构造、`setData()` 和 `card.data` 的字段类型，覆盖 `linkArrows: [1, 3]`、`compressCardTextSegments: [2, 3]` 和 `cardTextAlign: 'left'`。
- 验证 `cardTextAlign` 的四种对齐和默认值。左右对齐用含注音与显式换行的多行主文本检查，包括末行。
- 对比分段压缩的 `[]`、`[1]` 与字段变更前首段开关关闭、开启时的排版和导出像素。用 `[2, 3]` 检查选中的两段是否分别压进一行，覆盖含注音、显式空段及选中末段的情况。在三段正文中确认 `[2, 2, 3, 99]` 与 `[2, 3]` 效果一致。仅通过 `setData()` 更换选段或传入 `[]` 清空时，应重新排版。验证固定补白使单行压缩无解时能回退到常规断行，正文保持可见。
- 验证 `linkArrows` 的有效方向和 `LINK` 数值一致。`[1, 3, 5]` 点亮三个方向并显示 `LINK-3`，`[1, 1, 9]` 点亮方向 `1` 并显示 `LINK-1`。

### 2.0 实现验证

- Node / Skia 和 Edge 均用 d7f362f 基线、源码和独立安装的 2.0 打包产物完成对照。114 组文本、100 次更新、100 张批量导出和五种卡片的布局及导出像素一致。
- Node 回归覆盖分段选择、清空选段、单行压缩无解回退、正文四种对齐和 LINK 计数。Edge 额外用实际发布包验证了选段、左右对齐、清空选段以及 LINK 去重后的 PNG 导出。
- 独立消费项目的严格 TypeScript 检查通过，覆盖五种卡的构造、局部更新和数据读取。库与演示应用的构建通过。
- 在 Edge 中用固定提交对应的本地资源验证生产构建。五种卡片均能完成预览，切换时 JSON 编辑器显示相应的 2.0 示例字段。
