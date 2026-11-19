# 超速决斗

<script setup>
import CardExample from '../../.vitepress/components/CardExample.vue';
</script>

从 `yugioh-card` 导入 `RushDuelCard`。各字段可通过构造选项的 `data` 或 `setData()` 提供。

<CardExample type="rush-duel" />

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
  "cardText": "以高攻击力著称的传说之龙。任何对手都能将之粉碎，其破坏力不可估量。",
  "cardNumber": "RD/KP01-SC000",
  "showLegendMark": true
}
```

## 参数 {#parameters}

| 字段 | 类型 | 默认值 | 说明与可选值 |
| --- | --- | --- | --- |
| `language` | `enum` | `'sc'` | `sc` 简体中文、`jp` 日文 |
| `name` | `string` | `''` | 卡名 |
| `nameColor` | `string` | `''` | 卡名颜色，空字符串用默认色 |
| `cardLayout` | `enum` | `'monster'` | `monster` 怪兽、`spell` 魔法、`trap` 陷阱 |
| `attribute` | `enum` | `'dark'` | 怪兽属性可选 `dark` 暗、`light` 光、`earth` 地、`water` 水、`fire` 炎、`wind` 风、`divine` 神、`''` 隐藏属性 |
| `spellTrapIcon` | `enum` | `''` | `''` 无图标、`equip` 装备、`field` 场地、`quick-play` 速攻、`ritual` 仪式、`continuous` 永续、`counter` 反击 |
| `artwork` | `string` | `''` | 卡图 URL 或本地绝对路径 |
| `monsterFrame` | `enum` | `'normal'` | 怪兽卡框可选 `normal` 通常、`effect` 效果、`ritual` 仪式、`fusion` 融合 |
| `level` | `number` | `0` | 怪兽等级 |
| `monsterTypeLine` | `string` | `''` | 怪兽的种族与类型行 |
| `maximumAtk` | `number` | `0` | MAXIMUM ATK，`0` 隐藏数值栏 |
| `atk` | `number` | `0` | 攻击力。负数显示 `?` |
| `def` | `number` | `0` | 守备力。负数显示 `?` |
| `cardText` | `string` | `''` | 卡片正文，`\n` 分段 |
| `compressCardTextSegments` | `number[]` | `[]` | 指定段各压成一行，段号从 `1` 开始 |
| `cardTextAlign` | `enum` | `'justify'` | `left` 左对齐、`center` 居中、`right` 右对齐、`justify` 两端对齐 |
| `cardTextFontSizeScale` | `number` | `1` | 正文字号倍率 |
| `bodyTextStrokeWidth` | `number` | `0` | 正文描边宽度 |
| `cardNumber` | `string` | `''` | 收录编号 |
| `password` | `string` | `''` | 保存用的密码字段 |
| `showLegendMark` | `boolean` | `false` | 显示 LEGEND 标记 |
| `cornerMark` | `enum` | `''` | `''` 无角标、`laser1` 全息纹样 1、`laser2` 全息纹样 2、`laser3` 全息纹样 3、`laser4` 纯色角标 |
| `rarity` | `enum` | `''` | `''` 默认外观、`sr` 面闪稀有、`rr` 超速稀有、`pser` 镜碎稀有 |
| `roundCorners` | `boolean` | `true` | 使用圆角 |
| `renderScale` | `number` | `1` | 卡片原始尺寸的倍率 |
