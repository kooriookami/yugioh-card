# ラッシュデュエル

<script setup>
import CardExample from '../../../.vitepress/components/CardExample.vue';
</script>

`yugioh-card` から `RushDuelCard` をインポートします。フィールドはコンストラクターの `data` または `setData()` に指定します。

<CardExample type="rush-duel" />

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
  "cardText": "以高攻击力著称的传说之龙。任何对手都能将之粉碎，其破坏力不可估量。",
  "cardNumber": "RD/KP01-SC000",
  "showLegendMark": true
}
```

## パラメーター {#parameters}

| フィールド | 型 | 既定値 | 用途と選択肢 |
| --- | --- | --- | --- |
| `language` | `enum` | `'sc'` | `sc` 簡体字中国語、`jp` 日本語 |
| `name` | `string` | `''` | カード名 |
| `nameColor` | `string` | `''` | カード名の色。空文字列で既定色 |
| `cardLayout` | `enum` | `'monster'` | `monster` モンスター、`spell` 魔法、`trap` 罠 |
| `attribute` | `enum` | `'dark'` | モンスターの属性は `dark` 闇、`light` 光、`earth` 地、`water` 水、`fire` 炎、`wind` 風、`divine` 神、`''` 属性を非表示 |
| `spellTrapIcon` | `enum` | `''` | `''` アイコンなし、`equip` 装備、`field` フィールド、`quick-play` 速攻、`ritual` 儀式、`continuous` 永続、`counter` カウンター |
| `artwork` | `string` | `''` | イラストの URL または絶対パス |
| `monsterFrame` | `enum` | `'normal'` | モンスターのフレームは `normal` 通常、`effect` 効果、`ritual` 儀式、`fusion` 融合 |
| `level` | `number` | `0` | モンスターのレベル |
| `monsterTypeLine` | `string` | `''` | モンスターの種族・種類の行 |
| `maximumAtk` | `number` | `0` | マキシマムATK。`0` で非表示 |
| `atk` | `number` | `0` | 攻撃力。負の値は `?` を表示 |
| `def` | `number` | `0` | 守備力。負の値は `?` を表示 |
| `cardText` | `string` | `''` | カードテキスト。`\n` で段を区切る |
| `compressCardTextSegments` | `number[]` | `[]` | 指定した段を各1行に収める。段番号は `1` から |
| `cardTextAlign` | `enum` | `'justify'` | `left` 左揃え、`center` 中央揃え、`right` 右揃え、`justify` 両端揃え |
| `bodyTextFontSizeScale` | `number` | `1` | カードテキストとそのルビの文字サイズ倍率 |
| `bodyTextStrokeWidth` | `number` | `0` | カードテキスト、種族・種類行、およびそれぞれのルビの縁取り幅 |
| `cardNumber` | `string` | `''` | 収録番号 |
| `password` | `string` | `''` | 保存データ用のパスワード |
| `showLegendMark` | `boolean` | `false` | LEGEND マークを表示 |
| `cornerMark` | `enum` | `''` | `''` マークなし、`laser1` ホログラム柄1、`laser2` ホログラム柄2、`laser3` ホログラム柄3、`laser4` 単色マーク |
| `rarity` | `enum` | `''` | `''` 標準の仕上げ、`sr` スーパーレア、`rr` ラッシュレア、`pser` プリズマティックシークレットレア |
| `roundCorners` | `boolean` | `true` | 角を丸める |
| `renderScale` | `number` | `1` | カードの基準サイズに対する倍率 |
