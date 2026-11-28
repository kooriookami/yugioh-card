# 游戏王

<script setup>
import CardExample from '../../.vitepress/components/CardExample.vue';
</script>

从 `yugioh-card` 导入 `YugiohCard`。各字段可通过构造选项的 `data` 或 `setData()` 提供。

<CardExample type="yugioh" />

## 示例数据 {#example}

```json
{
  "language": "sc",
  "name": "青眼白龙",
  "cardLayout": "monster",
  "monsterFrame": "normal",
  "attribute": "light",
  "level": 8,
  "monsterTypeLine": "龙族/通常",
  "atk": 3000,
  "def": 2500,
  "cardText": "以高攻击力著称的传说之龙。任何对手都能将之粉碎，其破坏力不可估量。"
}
```

## 参数 {#parameters}

| 字段 | 类型 | 默认值 | 说明与可选值 |
| --- | --- | --- | --- |
| `language` | `enum` | `'sc'` | `sc` 简体中文、`tc` 繁体中文、`jp` 日文、`kr` 韩文、`en` 英文、`astral` 星光界文 |
| `textStylePreset` | `enum` | `''` | 字体与文字排版预设。`''` 使用语言默认样式，`custom1` 和 `custom2` 使用对应的自定义预设 |
| `name` | `string` | `''` | 卡名 |
| `nameColor` | `string` | `''` | 卡名颜色，空字符串用默认色 |
| `nameTextAlign` | `enum` | `'left'` | `left` 左对齐、`center` 居中、`right` 右对齐 |
| `applyNameGradient` | `boolean` | `false` | 启用卡名渐变 |
| `nameGradientColor1` | `string` | `'#999999'` | 卡名渐变起始色 |
| `nameGradientColor2` | `string` | `'#ffffff'` | 卡名渐变结束色 |
| `cardLayout` | `enum` | `'monster'` | `monster` 怪兽、`spell` 魔法、`trap` 陷阱、`pendulum` 灵摆 |
| `attribute` | `enum` | `'dark'` | 怪兽属性可选 `dark` 暗、`light` 光、`earth` 地、`water` 水、`fire` 炎、`wind` 风、`divine` 神、`''` 隐藏属性 |
| `spellTrapIcon` | `enum` | `''` | `''` 无图标、`equip` 装备、`field` 场地、`quick-play` 速攻、`ritual` 仪式、`continuous` 永续、`counter` 反击 |
| `artwork` | `string` | `''` | 卡图 URL 或本地绝对路径 |
| `monsterFrame` | `enum` | `'normal'` | 怪兽卡框可选 `normal` 通常、`effect` 效果、`ritual` 仪式、`fusion` 融合、`synchro` 同步、`xyz` 超量、`link` 连接、`token` 衍生物 |
| `pendulumFrame` | `enum` | `'normal-pendulum'` | 灵摆版式的卡框可选 `normal-pendulum` 通常灵摆、`effect-pendulum` 效果灵摆、`ritual-pendulum` 仪式灵摆、`fusion-pendulum` 融合灵摆、`synchro-pendulum` 同步灵摆、`xyz-pendulum` 超量灵摆 |
| `level` | `number` | `0` | 怪兽等级 |
| `rank` | `number` | `0` | 超量怪兽的阶级 |
| `pendulumScale` | `number` | `0` | 灵摆刻度，两侧共用 |
| `pendulumEffect` | `string` | `''` | 灵摆效果文本 |
| `monsterTypeLine` | `string` | `''` | 怪兽的种族与类型行 |
| `showBattleStats` | `boolean` | `true` | 显示 ATK / DEF 或 ATK / LINK 栏的分隔线、标签和数值 |
| `atk` | `number` | `0` | 攻击力。`-1` 显示 `?`，`-2` 显示 `∞` |
| `def` | `number` | `0` | 守备力。`-1` 显示 `?`，`-2` 显示 `∞` |
| `linkArrows` | `number[]` | `[]` | [连接标记位置](#link-arrows) |
| `cardText` | `string` | `''` | 卡片正文，`\n` 分段 |
| `compressCardTextSegments` | `number[]` | `[]` | 指定段各压成一行，段号从 `1` 开始 |
| `cardTextAlign` | `enum` | `'justify'` | `left` 左对齐、`center` 居中、`right` 右对齐、`justify` 两端对齐 |
| `bodyTextFontSizeScale` | `number` | `1` | 卡片正文、灵摆效果文本及其注音的字号倍率 |
| `bodyTextStrokeWidth` | `number` | `0` | 卡片正文、灵摆效果文本、怪兽种族与类型行及其注音的描边宽度 |
| `cardNumber` | `string` | `''` | 收录编号 |
| `password` | `string` | `''` | 卡片密码，字符串保留前导零 |
| `copyrightLanguage` | `enum` | `''` | `''` 隐藏版权标记、`sc` 简体中文、`jp` 日文、`en` 英文 |
| `cornerMark` | `enum` | `''` | `''` 无角标、`laser1` 全息纹样 1、`laser2` 全息纹样 2、`laser3` 全息纹样 3、`laser4` 纯色角标 |
| `rarity` | `enum` | `''` | `''` 默认外观、`dt` DUEL TERMINAL 平行闪、`ur` 金闪稀有、`gr` 黄金稀有、`hr` 全息稀有、`ser` 银碎稀有、`gser` 黄金碎闪、`pser` 镜碎稀有 |
| `show20thAnniversaryMark` | `boolean` | `false` | 显示 20 周年标记 |
| `roundCorners` | `boolean` | `true` | 使用圆角 |
| `renderScale` | `number` | `1` | 卡片原始尺寸的倍率 |

### 连接标记与 LINK 数值 {#link-arrows}

`1` 至 `8` 依次为上、右上、右、右下、下、左下、左、左上。LINK 数值等于有效方向去重后的数量，`[1, 4, 6, 6]` 显示 `LINK-3`。
