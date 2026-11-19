# 场地中心卡

<script setup>
import CardExample from '../../.vitepress/components/CardExample.vue';
</script>

从 `yugioh-card` 导入 `FieldCenterCard`。各字段可通过构造选项的 `data` 或 `setData()` 提供。

<CardExample type="field-center" />

## 示例数据 {#example}

```json
{
  "artwork": "/artwork.png",
  "renderBackSide": false,
  "roundCorners": true,
  "renderScale": 1
}
```

## 参数 {#parameters}

| 字段 | 类型 | 默认值 | 说明与可选值 |
| --- | --- | --- | --- |
| `artwork` | `string` | `''` | 卡图 URL 或本地绝对路径 |
| `roundCorners` | `boolean` | `true` | 使用圆角 |
| `renderBackSide` | `boolean` | `false` | 切换到背面，卡图用于正面 |
| `renderScale` | `number` | `1` | 卡片原始尺寸的倍率 |

将示例中的 `/artwork.png` 换成你的卡图地址。
