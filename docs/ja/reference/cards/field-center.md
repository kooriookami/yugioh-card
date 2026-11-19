# フィールドセンターカード

<script setup>
import CardExample from '../../../.vitepress/components/CardExample.vue';
</script>

`yugioh-card` から `FieldCenterCard` をインポートします。フィールドはコンストラクターの `data` または `setData()` に指定します。

<CardExample type="field-center" />

## サンプルデータ {#example}

```json
{
  "artwork": "/artwork.png",
  "renderBackSide": false,
  "roundCorners": true,
  "renderScale": 1
}
```

## パラメーター {#parameters}

| フィールド | 型 | 既定値 | 用途と選択肢 |
| --- | --- | --- | --- |
| `artwork` | `string` | `''` | イラストの URL または絶対パス |
| `roundCorners` | `boolean` | `true` | 角を丸める |
| `renderBackSide` | `boolean` | `false` | 裏面を表示。イラストは表面に使用 |
| `renderScale` | `number` | `1` | カードの基準サイズに対する倍率 |

サンプルの `/artwork.png` を使用するイラストの URL に置き換えてください。
