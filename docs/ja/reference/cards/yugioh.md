# 遊戯王

<script setup>
import CardExample from '../../../.vitepress/components/CardExample.vue';
</script>

`yugioh-card` から `YugiohCard` をインポートします。フィールドはコンストラクターの `data` または `setData()` に指定します。

<CardExample type="yugioh" />

## サンプルデータ {#example}

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

## パラメーター {#parameters}

| フィールド | 型 | 既定値 | 用途と選択肢 |
| --- | --- | --- | --- |
| `language` | `enum` | `'sc'` | `sc` 簡体字中国語、`tc` 繁体字中国語、`jp` 日本語、`kr` 韓国語、`en` 英語、`astral` アストラル文字 |
| `fontPreset` | `enum` | `''` | `''` 言語の既定値、`custom1` カスタム1、`custom2` カスタム2 |
| `name` | `string` | `''` | カード名 |
| `nameColor` | `string` | `''` | カード名の色。空文字列で既定色 |
| `nameTextAlign` | `enum` | `'left'` | `left` 左揃え、`center` 中央揃え、`right` 右揃え |
| `applyNameGradient` | `boolean` | `false` | カード名にグラデーションを適用 |
| `nameGradientColor1` | `string` | `'#999999'` | カード名のグラデーションの開始色 |
| `nameGradientColor2` | `string` | `'#ffffff'` | カード名のグラデーションの終了色 |
| `cardLayout` | `enum` | `'monster'` | `monster` モンスター、`spell` 魔法、`trap` 罠、`pendulum` ペンデュラム |
| `attribute` | `enum` | `'dark'` | モンスターの属性は `dark` 闇、`light` 光、`earth` 地、`water` 水、`fire` 炎、`wind` 風、`divine` 神、`''` 属性を非表示 |
| `spellTrapIcon` | `enum` | `''` | `''` アイコンなし、`equip` 装備、`field` フィールド、`quick-play` 速攻、`ritual` 儀式、`continuous` 永続、`counter` カウンター |
| `artwork` | `string` | `''` | イラストの URL または絶対パス |
| `monsterFrame` | `enum` | `'normal'` | モンスターのフレームは `normal` 通常、`effect` 効果、`ritual` 儀式、`fusion` 融合、`synchro` シンクロ、`xyz` エクシーズ、`link` リンク、`token` トークン |
| `pendulumFrame` | `enum` | `'normal-pendulum'` | ペンデュラムのフレームは `normal-pendulum` 通常ペンデュラム、`effect-pendulum` 効果ペンデュラム、`ritual-pendulum` 儀式ペンデュラム、`fusion-pendulum` 融合ペンデュラム、`synchro-pendulum` シンクロペンデュラム、`xyz-pendulum` エクシーズペンデュラム |
| `level` | `number` | `0` | モンスターのレベル |
| `rank` | `number` | `0` | エクシーズモンスターのランク |
| `pendulumScale` | `number` | `0` | 左右共通のペンデュラムスケール |
| `pendulumEffect` | `string` | `''` | ペンデュラム効果のテキスト |
| `monsterTypeLine` | `string` | `''` | モンスターの種族・種類の行 |
| `showStatsLine` | `boolean` | `true` | 攻守欄の罫線とラベルを表示 |
| `atk` | `number` | `0` | 攻撃力。`-1` は `?`、`-2` は `∞` を表示 |
| `def` | `number` | `0` | 守備力。`-1` は `?`、`-2` は `∞` を表示 |
| `linkArrows` | `number[]` | `[]` | [リンクマーカーの位置](#link-arrows) |
| `cardText` | `string` | `''` | カードテキスト。`\n` で段を区切る |
| `compressCardTextSegments` | `number[]` | `[]` | 指定した段を各1行に収める。段番号は `1` から |
| `cardTextAlign` | `enum` | `'justify'` | `left` 左揃え、`center` 中央揃え、`right` 右揃え、`justify` 両端揃え |
| `cardTextFontSizeScale` | `number` | `1` | カードテキストの文字サイズ倍率 |
| `bodyTextStrokeWidth` | `number` | `0` | 本文の縁取り幅 |
| `cardNumber` | `string` | `''` | 収録番号 |
| `password` | `string` | `''` | カードのパスワード。先頭のゼロを保つ文字列 |
| `copyrightLanguage` | `enum` | `''` | `''` 著作権表記を非表示、`sc` 簡体字中国語、`jp` 日本語、`en` 英語 |
| `cornerMark` | `enum` | `''` | `''` マークなし、`laser1` ホログラム柄1、`laser2` ホログラム柄2、`laser3` ホログラム柄3、`laser4` 単色マーク |
| `rarity` | `enum` | `''` | `''` 標準の仕上げ、`dt` デュエルターミナルのパラレル仕様、`ur` ウルトラレア、`gr` ゴールドレア、`hr` ホログラフィックレア、`ser` シークレットレア、`gser` ゴールドシークレットレア、`pser` プリズマティックシークレットレア |
| `show20thAnniversaryMark` | `boolean` | `false` | 20周年マークを表示 |
| `roundCorners` | `boolean` | `true` | 角を丸める |
| `renderScale` | `number` | `1` | カードの基準サイズに対する倍率 |

### リンクマーカーと LINK の数値 {#link-arrows}

`1` から `8` は順に上、右上、右、右下、下、左下、左、左上です。有効な方向を重複なしで数えた値が LINK です。`[1, 4, 6, 6]` は `LINK-3` と表示されます。
