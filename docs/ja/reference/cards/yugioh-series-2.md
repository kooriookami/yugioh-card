# 遊戯王 第2期

<script setup>
import CardExample from '../../../.vitepress/components/CardExample.vue';
</script>

`yugioh-card` から `YugiohSeries2Card` をインポートします。フィールドはコンストラクターの `data` または `setData()` に指定します。

<CardExample type="yugioh-series-2" />

## サンプルデータ {#example}

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

## パラメーター {#parameters}

| フィールド | 型 | 既定値 | 用途と選択肢 |
| --- | --- | --- | --- |
| `language` | `enum` | `'jp'` | `jp` 日本語 |
| `textStylePreset` | `enum` | `''` | フォントと文字組みのプリセット。`''` 言語の既定値、`custom1` カスタム1、`custom2` カスタム2 |
| `name` | `string` | `''` | カード名 |
| `nameColor` | `string` | `''` | カード名の色。空文字列で既定色 |
| `nameTextAlign` | `enum` | `'left'` | `left` 左揃え、`center` 中央揃え、`right` 右揃え |
| `applyNameGradient` | `boolean` | `false` | カード名にグラデーションを適用 |
| `nameGradientColor1` | `string` | `'#999999'` | カード名のグラデーションの開始色 |
| `nameGradientColor2` | `string` | `'#ffffff'` | カード名のグラデーションの終了色 |
| `cardLayout` | `enum` | `'monster'` | `monster` モンスター、`spell` 魔法、`trap` 罠 |
| `attribute` | `enum` | `'dark'` | モンスターの属性は `dark` 闇、`light` 光、`earth` 地、`water` 水、`fire` 炎、`wind` 風、`divine` 神、`''` 属性を非表示 |
| `spellTrapIcon` | `enum` | `''` | `''` アイコンなし、`equip` 装備、`field` フィールド、`quick-play` 速攻、`ritual` 儀式、`continuous` 永続、`counter` カウンター |
| `artwork` | `string` | `''` | イラストの URL または絶対パス |
| `monsterFrame` | `enum` | `'normal'` | モンスターのフレームは `normal` 通常、`effect` 効果、`ritual` 儀式、`fusion` 融合、`tormentor` オベリスクの巨神兵、`sky-dragon` オシリスの天空竜、`winged-dragon` ラーの翼神竜 |
| `level` | `number` | `0` | モンスターのレベル |
| `monsterTypeLine` | `string` | `''` | モンスターの種族・種類の行 |
| `atk` | `number` | `0` | 攻撃力。`-1` は `????`、`-2` は `X000` を表示 |
| `def` | `number` | `0` | 守備力。`-1` は `????`、`-2` は `X000` を表示 |
| `cardText` | `string` | `''` | カードテキスト。`\n` で段を区切る |
| `compressCardTextSegments` | `number[]` | `[]` | 指定した段を各1行に収める。段番号は `1` から |
| `cardTextAlign` | `enum` | `'justify'` | `left` 左揃え、`center` 中央揃え、`right` 右揃え、`justify` 両端揃え |
| `bodyTextFontSizeScale` | `number` | `1` | カードテキストとそのルビの文字サイズ倍率 |
| `bodyTextStrokeWidth` | `number` | `0` | カードテキスト、種族・種類行、およびそれぞれのルビの縁取り幅 |
| `cardNumber` | `string` | `''` | 収録番号 |
| `password` | `string` | `''` | カードのパスワード。先頭のゼロを保つ文字列 |
| `copyrightLanguage` | `enum` | `''` | `''` 著作権表記を非表示、`jp` 日本語 |
| `cornerMark` | `enum` | `''` | `''` マークなし、`laser1` ホログラム柄1、`laser2` ホログラム柄2、`laser3` ホログラム柄3、`laser4` 単色マーク |
| `roundCorners` | `boolean` | `true` | 角を丸める |
| `renderScale` | `number` | `1` | カードの基準サイズに対する倍率 |

カード名などルビに対応する欄では `[文字(よみ)]` と指定できます。
