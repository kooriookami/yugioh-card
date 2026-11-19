# 公共 API

从 `yugioh-card` 导入以下类。各类接受 `CardOptions<TData>`，卡片字段通过 `data` 提供。

| 卡片 | 类 |
| --- | --- |
| [游戏王](./cards/yugioh.md) | `YugiohCard` |
| [超速决斗](./cards/rush-duel.md) | `RushDuelCard` |
| [游戏王卡背](./cards/yugioh-back.md) | `YugiohBackCard` |
| [场地中心卡](./cards/field-center.md) | `FieldCenterCard` |
| [游戏王第 2 期](./cards/yugioh-series-2.md) | `YugiohSeries2Card` |

## 构造选项 {#card-options}

| 选项 | 类型 | 用法 |
| --- | --- | --- |
| `view` | `ILeaferInputData['view']` | 浏览器传入承载画布的 DOM 元素。Node.js 中可省略。 |
| `data` | `Partial<TData>` | 要覆盖的卡片默认字段。 |
| `resourcePath` | `string` | 承载卡模、图标和字体的[资源根目录](../guide/resources.md)。 |
| `skia` | `SkiaCanvas` | Node.js 传入从 `skia-canvas` 导入的对象。 |
| `readyTimeout` | `number` | 每个就绪周期的超时，单位毫秒，默认 `30000`。 |

## 更新和等待 {#updates-and-ready}

`card.setData(patch)` 合并提供的字段，值为 `undefined` 的字段跳过。清除文本或卡图时可显式传 `''`。浏览器在字体准备好前可以使用回退字体预览。

`await card.ready` 等待当前卡片所需的字体、图片、最终排版和一次绘制。每次 `setData()` 后重新读取。必需资源出错或超时时，Promise 会拒绝。处理错误后，可以发起一次新的更新重试。

## 导出和销毁 {#export-and-destroy}

通过 `card.leafer.export()` 导出。浏览器的文件下载示例见[浏览器指南](../guide/browser.md)。Node.js 可传 `{ screenshot: true, blob: true }` 获取 PNG Buffer。导出和文件写入有各自的错误处理。页面卸载或脚本结束后调用 `card.leafer.destroy(true)`。

## 术语参考 {#terminology}

字段说明中的卡片术语参考简中 OCG、英文 TCG、日文 OCG 和日文超速决斗官方数据库。相同的字段名和枚举可直接用于各语言版本。 [简中 OCG](https://db.yugioh-card-cn.com/card_search.action.html) · [英文 TCG](https://www.db.yugioh-card.com/yugiohdb/card_search.action?request_locale=en) · [日文 OCG](https://www.db.yugioh-card.com/yugiohdb/card_search.action?request_locale=ja) · [超速决斗](https://www.db.yugioh-card.com/rushdb/?request_locale=ja)
