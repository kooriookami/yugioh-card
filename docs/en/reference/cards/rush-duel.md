# Rush Duel

<script setup>
import CardExample from '../../../.vitepress/components/CardExample.vue';
</script>

Import `RushDuelCard` from `yugioh-card`. Pass card fields in the constructor's `data` option or to `setData()`.

<CardExample type="rush-duel" />

## Example data {#example}

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

## Parameters {#parameters}

| Field | Type | Default | Meaning and values |
| --- | --- | --- | --- |
| `language` | `enum` | `'sc'` | `sc` Simplified Chinese, `jp` Japanese |
| `name` | `string` | `''` | Card name |
| `nameColor` | `string` | `''` | Name color. Empty uses the default |
| `cardLayout` | `enum` | `'monster'` | `monster` Monster, `spell` Spell, `trap` Trap |
| `attribute` | `enum` | `'dark'` | Monster Attributes include `dark` DARK, `light` LIGHT, `earth` EARTH, `water` WATER, `fire` FIRE, `wind` WIND, `divine` DIVINE, `''` Hide the Attribute |
| `spellTrapIcon` | `enum` | `''` | `''` No icon, `equip` Equip, `field` Field, `quick-play` Quick-Play, `ritual` Ritual, `continuous` Continuous, `counter` Counter |
| `artwork` | `string` | `''` | Artwork URL or absolute path |
| `monsterFrame` | `enum` | `'normal'` | Monster frames include `normal` Normal, `effect` Effect, `ritual` Ritual, `fusion` Fusion |
| `level` | `number` | `0` | Monster Level |
| `monsterTypeLine` | `string` | `''` | Monster type line |
| `maximumAtk` | `number` | `0` | MAXIMUM ATK. `0` hides the field |
| `atk` | `number` | `0` | ATK. Negative values show `?` |
| `def` | `number` | `0` | DEF. Negative values show `?` |
| `cardText` | `string` | `''` | Card Text. `\n` starts a new segment |
| `compressCardTextSegments` | `number[]` | `[]` | Fit each selected segment on one line. Numbering starts at `1` |
| `cardTextAlign` | `enum` | `'justify'` | `left` Left, `center` Centered, `right` Right, `justify` Justified |
| `bodyTextFontSizeScale` | `number` | `1` | Font size multiplier for Card Text and its ruby text |
| `bodyTextStrokeWidth` | `number` | `0` | Stroke width for Card Text, the monster type line, and their ruby text |
| `cardNumber` | `string` | `''` | Set number |
| `password` | `string` | `''` | Password field for stored data |
| `showLegendMark` | `boolean` | `false` | Show the LEGEND mark |
| `cornerMark` | `enum` | `''` | `''` No mark, `laser1` Hologram pattern 1, `laser2` Hologram pattern 2, `laser3` Hologram pattern 3, `laser4` Solid-color mark |
| `rarity` | `enum` | `''` | `''` Default finish, `sr` Super Rare, `rr` Rush Rare, `pser` Prismatic Secret Rare |
| `roundCorners` | `boolean` | `true` | Round the corners |
| `renderScale` | `number` | `1` | Scale relative to native dimensions |
