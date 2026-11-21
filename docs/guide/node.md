# 在 Node.js 中渲染

将资源放在脚本旁的 `card-assets/` 目录中。安装 `yugioh-card`、`skia-canvas`，将下例保存为 `render.mjs`，执行 `node render.mjs`。输出位于脚本旁的 `output/`。

<<< @/examples/node.mjs

同一类型的卡片可以复用实例。每轮先调用 `setData()`，再读取并等待 `ready`，然后导出和写入文件。上例用 `blob: true` 在 Node.js 中直接取得 PNG `Buffer`。

`setData()` 合并本轮数据。批量数据应明确提供每张卡会变化的字段。例如某张卡要清除上一张的卡图时，传 `artwork: ''`。需要更换卡片类型时，使用相应的卡片类创建实例。

导出选项和销毁参数见 [Leafer 导出和销毁](../reference/#export-and-destroy)。
