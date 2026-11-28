# Yu-Gi-Oh!

<script setup>
import CardExample from '../../../.vitepress/components/CardExample.vue';
</script>

Import `YugiohCard` from `yugioh-card`. Pass card fields in the constructor's `data` option or to `setData()`.

<CardExample type="yugioh" />

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
  "cardText": "以高攻击力著称的传说之龙。任何对手都能将之粉碎，其破坏力不可估量。"
}
```

## Parameters {#parameters}

| Field | Type | Default | Meaning and values |
| --- | --- | --- | --- |
| `language` | `enum` | `'sc'` | `sc` Simplified Chinese, `tc` Traditional Chinese, `jp` Japanese, `kr` Korean, `en` English, `astral` Astral script |
| `textStylePreset` | `enum` | `''` | Font and text layout preset. `''` Language default, `custom1` Custom preset 1, `custom2` Custom preset 2 |
| `name` | `string` | `''` | Card name |
| `nameColor` | `string` | `''` | Name color. Empty uses the default |
| `nameTextAlign` | `enum` | `'left'` | `left` Left, `center` Centered, `right` Right |
| `applyNameGradient` | `boolean` | `false` | Enable the name gradient |
| `nameGradientColor1` | `string` | `'#999999'` | Name gradient start color |
| `nameGradientColor2` | `string` | `'#ffffff'` | Name gradient end color |
| `cardLayout` | `enum` | `'monster'` | `monster` Monster, `spell` Spell, `trap` Trap, `pendulum` Pendulum |
| `attribute` | `enum` | `'dark'` | Monster Attributes include `dark` DARK, `light` LIGHT, `earth` EARTH, `water` WATER, `fire` FIRE, `wind` WIND, `divine` DIVINE, `''` Hide the Attribute |
| `spellTrapIcon` | `enum` | `''` | `''` No icon, `equip` Equip, `field` Field, `quick-play` Quick-Play, `ritual` Ritual, `continuous` Continuous, `counter` Counter |
| `artwork` | `string` | `''` | Artwork URL or absolute path |
| `monsterFrame` | `enum` | `'normal'` | Monster frames include `normal` Normal, `effect` Effect, `ritual` Ritual, `fusion` Fusion, `synchro` Synchro, `xyz` Xyz, `link` Link, `token` Token |
| `pendulumFrame` | `enum` | `'normal-pendulum'` | Pendulum frames include `normal-pendulum` Normal Pendulum, `effect-pendulum` Effect Pendulum, `ritual-pendulum` Ritual Pendulum, `fusion-pendulum` Fusion Pendulum, `synchro-pendulum` Synchro Pendulum, `xyz-pendulum` Xyz Pendulum |
| `level` | `number` | `0` | Monster Level |
| `rank` | `number` | `0` | Xyz Monster Rank |
| `pendulumScale` | `number` | `0` | Pendulum Scale on both sides |
| `pendulumEffect` | `string` | `''` | Pendulum Effect text |
| `monsterTypeLine` | `string` | `''` | Monster type line |
| `showBattleStats` | `boolean` | `true` | Show the divider, labels, and values for ATK / DEF or ATK / LINK |
| `atk` | `number` | `0` | ATK. `-1` shows `?` and `-2` shows `∞` |
| `def` | `number` | `0` | DEF. `-1` shows `?` and `-2` shows `∞` |
| `linkArrows` | `number[]` | `[]` | [Link Arrow positions](#link-arrows) |
| `cardText` | `string` | `''` | Card Text. `\n` starts a new segment |
| `compressCardTextSegments` | `number[]` | `[]` | Fit each selected segment on one line. Numbering starts at `1` |
| `cardTextAlign` | `enum` | `'justify'` | `left` Left, `center` Centered, `right` Right, `justify` Justified |
| `bodyTextFontSizeScale` | `number` | `1` | Font size multiplier for Card Text, Pendulum Effect, and their ruby text |
| `bodyTextStrokeWidth` | `number` | `0` | Stroke width for Card Text, Pendulum Effect, the monster type line, and their ruby text |
| `cardNumber` | `string` | `''` | Set number |
| `password` | `string` | `''` | Card password. A string preserves leading zeros |
| `copyrightLanguage` | `enum` | `''` | `''` Hide the copyright mark, `sc` Simplified Chinese, `jp` Japanese, `en` English |
| `cornerMark` | `enum` | `''` | `''` No mark, `laser1` Hologram pattern 1, `laser2` Hologram pattern 2, `laser3` Hologram pattern 3, `laser4` Solid-color mark |
| `rarity` | `enum` | `''` | `''` Default finish, `dt` Duel Terminal Parallel, `ur` Ultra Rare, `gr` Gold Rare, `hr` Holographic Rare, `ser` Secret Rare, `gser` Gold Secret Rare, `pser` Prismatic Secret Rare |
| `show20thAnniversaryMark` | `boolean` | `false` | Show the 20th anniversary mark |
| `roundCorners` | `boolean` | `true` | Round the corners |
| `renderScale` | `number` | `1` | Scale relative to native dimensions |

### Link Arrows and Link Rating {#link-arrows}

`1` through `8` map to up, upper-right, right, lower-right, down, lower-left, left, and upper-left. LINK counts unique valid directions. `[1, 4, 6, 6]` displays `LINK-3`.
