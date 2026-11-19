# 在浏览器中渲染

用下面的命令创建 Vite 项目。如果已有 ESM 前端项目，可以直接安装 `yugioh-card` 并使用其中的容器元素。

```bash
npm create vite@latest card-preview -- --template vanilla
cd card-preview
npm install
npm install yugioh-card
```

按[静态资源指南](./resources.md)准备 `public/card-assets`。保留模板的 `#app` 容器，将入口文件内容替换为以下代码，再运行 `npm run dev`。

<<< @/examples/browser.js

将你自己的图片放进公开目录，并把 URL 传给 `data.artwork` 即可加上卡图。用 `card.setData({ name: 'Another Dragon' })` 更新卡名，更新后重新读取 `card.ready`，等待排版和资源加载完成再导出。

`renderScale` 控制卡片渲染尺寸。只需改变页面预览大小时，可以缩放外层显示容器。组件卸载时调用 `card.leafer.destroy(true)`。卡片类型和可用字段见 [API 参考](../reference/)。
