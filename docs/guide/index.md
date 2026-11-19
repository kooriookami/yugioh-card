# 安装

Yugioh Card 使用 Canvas 渲染游戏王、超速决斗、游戏王卡背、场地中心卡和游戏王第 2 期卡片。npm 包提供 ESM 入口和 TypeScript 类型。

## 浏览器

```bash
npm install yugioh-card
```

准备[静态资源](./resources.md)，再按[浏览器指南](./browser.md)在页面中渲染并导出第一张卡。「在线试用」可以直接打开 [Playground](../playground/)。

## Node.js

```bash
npm install yugioh-card skia-canvas
```

`skia-canvas` 提供 Node.js 下的 Canvas 实现。将资源放在本地后，可直接运行 [Node.js 示例](./node.md)，也可复用实例批量导出。

从旧版升级时，请先查看 [1.x → 2.0 迁移指南](../migration/)。
