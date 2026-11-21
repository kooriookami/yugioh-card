# Field Center Card

<script setup>
import CardExample from '../../../.vitepress/components/CardExample.vue';
</script>

Import `FieldCenterCard` from `yugioh-card`. Pass card fields in the constructor's `data` option or to `setData()`.

<CardExample type="field-center" />

## Example data {#example}

```json
{
  "artwork": "/artwork.png",
  "renderBackSide": false,
  "roundCorners": true,
  "renderScale": 1
}
```

## Parameters {#parameters}

| Field | Type | Default | Meaning and values |
| --- | --- | --- | --- |
| `artwork` | `string` | `''` | Artwork URL or absolute path |
| `roundCorners` | `boolean` | `true` | Round the corners |
| `renderBackSide` | `boolean` | `false` | Show the back. Artwork appears on the front |
| `renderScale` | `number` | `1` | Scale relative to native dimensions |

Replace `/artwork.png` in the example with your artwork URL.
