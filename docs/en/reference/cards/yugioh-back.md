# Yu-Gi-Oh! Card Back

<script setup>
import CardExample from '../../../.vitepress/components/CardExample.vue';
</script>

Import `YugiohBackCard` from `yugioh-card`. Pass card fields in the constructor's `data` option or to `setData()`.

<CardExample type="yugioh-back" />

## Example data {#example}

```json
{
  "backDesign": "normal",
  "gameLogo": "ocg",
  "showKonamiLogo": true,
  "showRegisteredMark": true
}
```

## Parameters {#parameters}

| Field | Type | Default | Meaning and values |
| --- | --- | --- | --- |
| `backDesign` | `enum` | `'normal'` | `normal` Standard card back, `tormentor` Obelisk the Tormentor, `sky-dragon` Slifer the Sky Dragon, `winged-dragon` The Winged Dragon of Ra |
| `gameLogo` | `enum` | `'ocg'` | `''` No logo, `ocg` Official Card Game (OCG), `tcg` Trading Card Game (TCG), `rd` Rush Duel (RD) |
| `showKonamiLogo` | `boolean` | `true` | Show the KONAMI logo |
| `showRegisteredMark` | `boolean` | `true` | Show the registered trademark symbol |
| `roundCorners` | `boolean` | `true` | Round the corners |
| `renderScale` | `number` | `1` | Scale relative to native dimensions |
