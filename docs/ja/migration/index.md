# 1.x から 2.0 へ移行する

Yugioh Card 2.0 ではカードデータのフィールドを変更しました。コンストラクターの `data`、`setData()` の引数、保存済み JSON を併せて更新してください。このページでは 1.9.2 を基準にしています。 [yugioh-card 1.9.2](https://www.npmjs.com/package/yugioh-card/v/1.9.2)

## 移行例 {#example}

モンスターカードのデータの一部です。段番号は `1` から始まり、`cardText` の改行が段の区切りになります。

```diff
- { "description": "A demo monster.", "image": "/dragon.png", "scale": 1,
-   "firstLineCompress": true, "descriptionAlign": false }
+ { "cardText": "A demo monster.", "artwork": "/dragon.png", "renderScale": 1,
+   "compressCardTextSegments": [1], "cardTextAlign": "justify" }
```

## フィールドの対応表 {#field-mapping}

### 全カード共通 {#all}

| 1.x | 2.0 |
| --- | --- |
| `scale` | `renderScale` |
| `radius` | `roundCorners` |

### イラストを持つカード {#image}

| 1.x | 2.0 |
| --- | --- |
| `image` | `artwork` |

### 遊戯王・ラッシュデュエル・第2期 {#front}

| 1.x | 2.0 |
| --- | --- |
| `color` | `nameColor` |
| `type` | `cardLayout` |
| `icon` | `spellTrapIcon` |
| `cardType` | `monsterFrame` |
| `monsterType` | `monsterTypeLine` |
| `description` | `cardText` |
| `descriptionZoom` | `cardTextFontSizeScale` |
| `descriptionWeight` | `bodyTextStrokeWidth` |
| `package` | `cardNumber` |
| `laser` | `cornerMark` |
| `firstLineCompress: true / false` | `compressCardTextSegments: [1] / []` |
| `descriptionAlign: true / false` | `cardTextAlign: 'center' / 'justify'` |

### 遊戯王と第2期 {#pair}

| 1.x | 2.0 |
| --- | --- |
| `align` | `nameTextAlign` |
| `gradient` | `applyNameGradient` |
| `gradientColor1` | `nameGradientColor1` |
| `gradientColor2` | `nameGradientColor2` |
| `copyright` | `copyrightLanguage` |

### 遊戯王 {#ygo}

| 1.x | 2.0 |
| --- | --- |
| `font` | `fontPreset` |
| `pendulumType` | `pendulumFrame` |
| `pendulumDescription` | `pendulumEffect` |
| `atkBar` | `showStatsLine` |
| `arrowList` | `linkArrows` |
| `rare` | `rarity` |
| `twentieth` | `show20thAnniversaryMark` |

### ラッシュデュエル {#rush}

| 1.x | 2.0 |
| --- | --- |
| `legend` | `showLegendMark` |
| `rare` | `rarity` |

### 遊戯王カードの裏面 {#back}

| 1.x | 2.0 |
| --- | --- |
| `type` | `backDesign` |
| `logo` | `gameLogo` |
| `konami` | `showKonamiLogo` |
| `register` | `showRegisteredMark` |

### フィールドセンターカード {#center}

| 1.x | 2.0 |
| --- | --- |
| `cardBack` | `renderBackSide` |

## 値と描画の変更 {#behavior}

`arrowList` は `linkArrows` に変更します。LINK の数値は有効な位置を重複なしで数えた値です。旧データに同じ位置が複数ある場合、LINK の数値が変わることがあります。

`cardTextAlign` には `'left'` と `'right'` も指定できます。`compressCardTextSegments: [1, 3]` を指定すると、第1段と第3段がそれぞれ1行に収まります。

第2期のデータから `rare` を削除できます。この版式では `fontPreset` でフォントを選べます。ラッシュデュエルの保存データには `password` を引き続き保持できます。

## 移行後の確認 {#checklist}

1. 2.0 をインストールし、`resourcePath` の[静的リソース](../guide/resources.md)を対応バージョンに更新します。新版の `ygo-jp.woff2` も含めてください。
2. 保存済み JSON を変換し、[API リファレンス](../reference/)のフィールドと列挙値を確認します。元のクラスに対応する行を選んでください。例えば `type` の意味はカードの表面と裏面で異なります。
3. ブラウザと Node.js の両方で、`setData()` のたびに `card.ready` を取得して待ってから書き出します。一括書き出しは [Node.js のサンプル](../guide/node.md)で確認できます。
4. 代表的なカードを書き出し直します。特に日本語のルビ、長いカードテキスト、リンクモンスターで、改行とサイズを確認してください。
