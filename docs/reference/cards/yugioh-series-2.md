# 游戏王第 2 期

<script setup>
import CardExample from '../../.vitepress/components/CardExample.vue';
</script>

从 `yugioh-card` 导入 `YugiohSeries2Card`。各字段可通过构造选项的 `data` 或 `setData()` 提供。

<CardExample type="yugioh-series-2" />

## 示例数据 {#example}

```json
{
  "language": "jp",
  "name": "[青眼の白龍(ブルーアイズ・ホワイト・ドラゴン)]",
  "attribute": "light",
  "level": 8,
  "monsterTypeLine": "ドラゴン[族(ぞく)]",
  "atk": 3000,
  "def": 2500,
  "cardNumber": "LB-01"
}
```

## 参数 {#parameters}

| 字段 | 类型 | 默认值 | 说明与可选值 |
| --- | --- | --- | --- |
| `language` | `enum` | `'jp'` | `jp` 日文 |
| `textStylePreset` | `enum` | `''` | 字体与文字排版预设。`''` 使用语言默认样式，`custom1` 和 `custom2` 使用对应的自定义预设 |
| `name` | `string` | `''` | 卡名 |
| `nameColor` | `string` | `''` | 卡名颜色，空字符串用默认色 |
| `nameTextAlign` | `enum` | `'left'` | `left` 左对齐、`center` 居中、`right` 右对齐 |
| `applyNameGradient` | `boolean` | `false` | 启用卡名渐变 |
| `nameGradientColor1` | `string` | `'#999999'` | 卡名渐变起始色 |
| `nameGradientColor2` | `string` | `'#ffffff'` | 卡名渐变结束色 |
| `cardLayout` | `enum` | `'monster'` | `monster` 怪兽、`spell` 魔法、`trap` 陷阱 |
| `attribute` | `enum` | `'dark'` | 怪兽属性可选 `dark` 暗、`light` 光、`earth` 地、`water` 水、`fire` 炎、`wind` 风、`divine` 神、`''` 隐藏属性 |
| `spellTrapIcon` | `enum` | `''` | `''` 无图标、`equip` 装备、`field` 场地、`quick-play` 速攻、`ritual` 仪式、`continuous` 永续、`counter` 反击 |
| `artwork` | `string` | `''` | 卡图 URL 或本地绝对路径 |
| `monsterFrame` | `enum` | `'normal'` | 怪兽卡框可选 `normal` 通常、`effect` 效果、`ritual` 仪式、`fusion` 融合、`tormentor` 巨神兵、`sky-dragon` 天空龙、`winged-dragon` 翼神龙 |
| `level` | `number` | `0` | 怪兽等级 |
| `monsterTypeLine` | `string` | `''` | 怪兽的种族与类型行 |
| `atk` | `number` | `0` | 攻击力。`-1` 显示 `????`，`-2` 显示 `X000` |
| `def` | `number` | `0` | 守备力。`-1` 显示 `????`，`-2` 显示 `X000` |
| `cardText` | `string` | `''` | 卡片正文，`\n` 分段 |
| `compressCardTextSegments` | `number[]` | `[]` | 指定段各压成一行，段号从 `1` 开始 |
| `cardTextAlign` | `enum` | `'justify'` | `left` 左对齐、`center` 居中、`right` 右对齐、`justify` 两端对齐 |
| `bodyTextFontSizeScale` | `number` | `1` | 卡片正文及其注音的字号倍率 |
| `bodyTextStrokeWidth` | `number` | `0` | 卡片正文、怪兽种族与类型行及其注音的描边宽度 |
| `cardNumber` | `string` | `''` | 收录编号 |
| `password` | `string` | `''` | 卡片密码，字符串保留前导零 |
| `copyrightLanguage` | `enum` | `''` | `''` 隐藏版权标记、`jp` 日文 |
| `cornerMark` | `enum` | `''` | `''` 无角标、`laser1` 全息纹样 1、`laser2` 全息纹样 2、`laser3` 全息纹样 3、`laser4` 纯色角标 |
| `roundCorners` | `boolean` | `true` | 使用圆角 |
| `renderScale` | `number` | `1` | 卡片原始尺寸的倍率 |

卡名等支持注音的字段可用 `[文字(読み)]`。
