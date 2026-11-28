# 从 1.x 升级到 2.0

游戏王卡片 2.0 调整了数据字段。升级时请同时更新构造参数里的 `data`、`setData()` 调用和保存的 JSON。本页以 1.9.2 为对照。 [yugioh-card 1.9.2](https://www.npmjs.com/package/yugioh-card/v/1.9.2)

## 迁移示例 {#example}

下面是一张怪兽卡的部分数据。段号从 `1` 开始，按 `cardText` 中的换行分段。

```diff
- { "description": "A demo monster.", "image": "/dragon.png", "scale": 1,
-   "firstLineCompress": true, "descriptionAlign": false }
+ { "cardText": "A demo monster.", "artwork": "/dragon.png", "renderScale": 1,
+   "compressCardTextSegments": [1], "cardTextAlign": "justify" }
```

## 字段对照 {#field-mapping}

### 所有卡片 {#all}

| 1.x | 2.0 |
| --- | --- |
| `scale` | `renderScale` |
| `radius` | `roundCorners` |

### 支持卡图的卡片 {#image}

| 1.x | 2.0 |
| --- | --- |
| `image` | `artwork` |

### 游戏王、超速决斗、第 2 期 {#front}

| 1.x | 2.0 |
| --- | --- |
| `color` | `nameColor` |
| `type` | `cardLayout` |
| `icon` | `spellTrapIcon` |
| `cardType` | `monsterFrame` |
| `monsterType` | `monsterTypeLine` |
| `description` | `cardText` |
| `descriptionZoom` | `bodyTextFontSizeScale` |
| `descriptionWeight` | `bodyTextStrokeWidth` |
| `package` | `cardNumber` |
| `laser` | `cornerMark` |
| `firstLineCompress: true / false` | `compressCardTextSegments: [1] / []` |
| `descriptionAlign: true / false` | `cardTextAlign: 'center' / 'justify'` |

### 游戏王、第 2 期 {#pair}

| 1.x | 2.0 |
| --- | --- |
| `align` | `nameTextAlign` |
| `gradient` | `applyNameGradient` |
| `gradientColor1` | `nameGradientColor1` |
| `gradientColor2` | `nameGradientColor2` |
| `copyright` | `copyrightLanguage` |
| `font` | `textStylePreset` |

### 游戏王 {#ygo}

| 1.x | 2.0 |
| --- | --- |
| `pendulumType` | `pendulumFrame` |
| `pendulumDescription` | `pendulumEffect` |
| `atkBar` | `showBattleStats` |
| `arrowList` | `linkArrows` |
| `rare` | `rarity` |
| `twentieth` | `show20thAnniversaryMark` |

### 超速决斗 {#rush}

| 1.x | 2.0 |
| --- | --- |
| `legend` | `showLegendMark` |
| `rare` | `rarity` |

### 游戏王卡背 {#back}

| 1.x | 2.0 |
| --- | --- |
| `type` | `backDesign` |
| `logo` | `gameLogo` |
| `konami` | `showKonamiLogo` |
| `register` | `showRegisteredMark` |

### 场地中心卡 {#center}

| 1.x | 2.0 |
| --- | --- |
| `cardBack` | `renderBackSide` |

## 值和渲染行为 {#behavior}

`arrowList` 改为 `linkArrows` 后，界面按有效且不重复的箭头数量计算 LINK。旧数据中重复的编号会得到不同的 LINK 数值。

`cardTextAlign` 还支持 `'left'` 和 `'right'`。使用 `compressCardTextSegments: [1, 3]` 可以指定第 1 段与第 3 段各压成一行。

第 2 期数据中可删除旧的 `rare`。超速决斗的 `password` 可保留在存储数据中。

## 升级后验证 {#checklist}

1. 安装 2.0 发布包，并从对应版本更新 `resourcePath` 下的[静态资源](../guide/resources.md)，包括新版 `ygo-jp.woff2`。
2. 转换现有 JSON，再按[卡片参数](../reference/)核对字段与枚举。枚举按旧卡片类选正确的映射，例如 `type` 在前面版式和卡背中的含义不同。
3. 在浏览器和 Node.js 中，每次 `setData()` 后读取并等待当前的 `card.ready`，然后导出。按 [Node.js 示例](../guide/node.md)复核批量流程。
4. 重导出代表性样例，尤其是日文注音、接近文本框边界的正文和连接怪兽，确认换行与尺寸符合预期。
