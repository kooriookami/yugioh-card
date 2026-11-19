# 遊戯王カードの裏面

<script setup>
import CardExample from '../../../.vitepress/components/CardExample.vue';
</script>

`yugioh-card` から `YugiohBackCard` をインポートします。フィールドはコンストラクターの `data` または `setData()` に指定します。

<CardExample type="yugioh-back" />

## サンプルデータ {#example}

```json
{
  "backDesign": "normal",
  "gameLogo": "ocg",
  "showKonamiLogo": true,
  "showRegisteredMark": true
}
```

## パラメーター {#parameters}

| フィールド | 型 | 既定値 | 用途と選択肢 |
| --- | --- | --- | --- |
| `backDesign` | `enum` | `'normal'` | `normal` 通常の裏面、`tormentor` オベリスクの巨神兵、`sky-dragon` オシリスの天空竜、`winged-dragon` ラーの翼神竜 |
| `gameLogo` | `enum` | `'ocg'` | `''` ロゴなし、`ocg` OCG ロゴ、`tcg` TCG ロゴ、`rd` ラッシュデュエルのロゴ |
| `showKonamiLogo` | `boolean` | `true` | KONAMI ロゴを表示 |
| `showRegisteredMark` | `boolean` | `true` | 登録商標マークを表示 |
| `roundCorners` | `boolean` | `true` | 角を丸める |
| `renderScale` | `number` | `1` | カードの基準サイズに対する倍率 |
