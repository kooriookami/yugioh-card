# 游戏王卡背

<script setup>
import CardExample from '../../.vitepress/components/CardExample.vue';
</script>

从 `yugioh-card` 导入 `YugiohBackCard`。各字段可通过构造选项的 `data` 或 `setData()` 提供。

<CardExample type="yugioh-back" />

## 示例数据 {#example}

```json
{
  "backDesign": "normal",
  "gameLogo": "ocg",
  "showKonamiLogo": true,
  "showRegisteredMark": true
}
```

## 参数 {#parameters}

| 字段 | 类型 | 默认值 | 说明与可选值 |
| --- | --- | --- | --- |
| `backDesign` | `enum` | `'normal'` | `normal` 普通卡背、`tormentor` 巨神兵、`sky-dragon` 天空龙、`winged-dragon` 翼神龙 |
| `gameLogo` | `enum` | `'ocg'` | `''` 无标志、`ocg` OCG 标志、`tcg` TCG 标志、`rd` 超速决斗标志 |
| `showKonamiLogo` | `boolean` | `true` | 显示 KONAMI 标志 |
| `showRegisteredMark` | `boolean` | `true` | 显示注册商标标记 |
| `roundCorners` | `boolean` | `true` | 使用圆角 |
| `renderScale` | `number` | `1` | 卡片原始尺寸的倍率 |
