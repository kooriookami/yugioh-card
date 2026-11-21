# Yu-Gi-Oh! Series 2

<script setup>
import CardExample from '../../../.vitepress/components/CardExample.vue';
</script>

Import `YugiohSeries2Card` from `yugioh-card`. Pass card fields in the constructor's `data` option or to `setData()`.

<CardExample type="yugioh-series-2" />

## Example data {#example}

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

## Parameters {#parameters}

| Field | Type | Default | Meaning and values |
| --- | --- | --- | --- |
| `language` | `enum` | `'jp'` | `jp` Japanese |
| `fontPreset` | `enum` | `''` | `''` Language default, `custom1` Custom preset 1, `custom2` Custom preset 2 |
| `name` | `string` | `''` | Card name |
| `nameColor` | `string` | `''` | Name color. Empty uses the default |
| `nameTextAlign` | `enum` | `'left'` | `left` Left, `center` Centered, `right` Right |
| `applyNameGradient` | `boolean` | `false` | Enable the name gradient |
| `nameGradientColor1` | `string` | `'#999999'` | Name gradient start color |
| `nameGradientColor2` | `string` | `'#ffffff'` | Name gradient end color |
| `cardLayout` | `enum` | `'monster'` | `monster` Monster, `spell` Spell, `trap` Trap |
| `attribute` | `enum` | `'dark'` | Monster Attributes include `dark` DARK, `light` LIGHT, `earth` EARTH, `water` WATER, `fire` FIRE, `wind` WIND, `divine` DIVINE, `''` Hide the Attribute |
| `spellTrapIcon` | `enum` | `''` | `''` No icon, `equip` Equip, `field` Field, `quick-play` Quick-Play, `ritual` Ritual, `continuous` Continuous, `counter` Counter |
| `artwork` | `string` | `''` | Artwork URL or absolute path |
| `monsterFrame` | `enum` | `'normal'` | Monster frames include `normal` Normal, `effect` Effect, `ritual` Ritual, `fusion` Fusion, `tormentor` Obelisk the Tormentor, `sky-dragon` Slifer the Sky Dragon, `winged-dragon` The Winged Dragon of Ra |
| `level` | `number` | `0` | Monster Level |
| `monsterTypeLine` | `string` | `''` | Monster type line |
| `atk` | `number` | `0` | ATK. `-1` shows `????` and `-2` shows `X000` |
| `def` | `number` | `0` | DEF. `-1` shows `????` and `-2` shows `X000` |
| `cardText` | `string` | `''` | Card Text. `\n` starts a new segment |
| `compressCardTextSegments` | `number[]` | `[]` | Fit each selected segment on one line. Numbering starts at `1` |
| `cardTextAlign` | `enum` | `'justify'` | `left` Left, `center` Centered, `right` Right, `justify` Justified |
| `cardTextFontSizeScale` | `number` | `1` | Card Text font size multiplier |
| `bodyTextStrokeWidth` | `number` | `0` | Body text stroke width |
| `cardNumber` | `string` | `''` | Set number |
| `password` | `string` | `''` | Card password. A string preserves leading zeros |
| `copyrightLanguage` | `enum` | `''` | `''` Hide the copyright mark, `jp` Japanese |
| `cornerMark` | `enum` | `''` | `''` No mark, `laser1` Hologram pattern 1, `laser2` Hologram pattern 2, `laser3` Hologram pattern 3, `laser4` Solid-color mark |
| `roundCorners` | `boolean` | `true` | Round the corners |
| `renderScale` | `number` | `1` | Scale relative to native dimensions |

Use `[text(reading)]` to add ruby to supported fields such as the card name.
