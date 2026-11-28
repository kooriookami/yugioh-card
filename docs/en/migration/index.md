# Upgrade from 1.x to 2.0

Yugioh Card 2.0 revises the card data fields. Update constructor `data`, calls to `setData()`, and stored JSON together. This guide uses 1.9.2 as the baseline. [yugioh-card 1.9.2](https://www.npmjs.com/package/yugioh-card/v/1.9.2)

## Before and after {#example}

This is a partial data object for a monster card. Segment numbers start at `1` and follow newlines in `cardText`.

```diff
- { "description": "A demo monster.", "image": "/dragon.png", "scale": 1,
-   "firstLineCompress": true, "descriptionAlign": false }
+ { "cardText": "A demo monster.", "artwork": "/dragon.png", "renderScale": 1,
+   "compressCardTextSegments": [1], "cardTextAlign": "justify" }
```

## Field mapping {#field-mapping}

### All cards {#all}

| 1.x | 2.0 |
| --- | --- |
| `scale` | `renderScale` |
| `radius` | `roundCorners` |

### Cards with artwork {#image}

| 1.x | 2.0 |
| --- | --- |
| `image` | `artwork` |

### Yu-Gi-Oh!, Rush Duel, and Series 2 {#front}

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

### Yu-Gi-Oh! and Series 2 {#pair}

| 1.x | 2.0 |
| --- | --- |
| `align` | `nameTextAlign` |
| `gradient` | `applyNameGradient` |
| `gradientColor1` | `nameGradientColor1` |
| `gradientColor2` | `nameGradientColor2` |
| `copyright` | `copyrightLanguage` |
| `font` | `textStylePreset` |

### Yu-Gi-Oh! {#ygo}

| 1.x | 2.0 |
| --- | --- |
| `pendulumType` | `pendulumFrame` |
| `pendulumDescription` | `pendulumEffect` |
| `atkBar` | `showBattleStats` |
| `arrowList` | `linkArrows` |
| `rare` | `rarity` |
| `twentieth` | `show20thAnniversaryMark` |

### Rush Duel {#rush}

| 1.x | 2.0 |
| --- | --- |
| `legend` | `showLegendMark` |
| `rare` | `rarity` |

### Yu-Gi-Oh! Card Back {#back}

| 1.x | 2.0 |
| --- | --- |
| `type` | `backDesign` |
| `logo` | `gameLogo` |
| `konami` | `showKonamiLogo` |
| `register` | `showRegisteredMark` |

### Field Center Card {#center}

| 1.x | 2.0 |
| --- | --- |
| `cardBack` | `renderBackSide` |

## Value and rendering changes {#behavior}

Use `linkArrows` in place of `arrowList`. The Link Rating counts unique valid directions. Duplicate positions in older data can produce a different rating in 2.0.

`cardTextAlign` also accepts `'left'` and `'right'`. Set `compressCardTextSegments: [1, 3]` to fit the first and third segments on one line each.

Remove `rare` from Series 2 data. You can keep `password` in stored Rush Duel data.

## Check the upgrade {#checklist}

1. Install the 2.0 package and update the [static assets](../guide/resources.md) at `resourcePath` to the corresponding version, including the new `ygo-jp.woff2`.
2. Convert stored JSON and check the fields and enums in the [API reference](../reference/). Choose the mapping for the original class. For example, `type` refers to different options on card fronts and card backs.
3. In both the browser and Node.js, read and await `card.ready` after each `setData()` call, then export. Use the [Node.js example](../guide/node.md) to check batch exports.
4. Re-export representative cards. Check line wrapping and dimensions on Japanese ruby text, longer card text, and Link Monsters.
