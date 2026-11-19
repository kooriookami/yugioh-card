# Installation

Yugioh Card renders Yu-Gi-Oh!, Rush Duel, Yu-Gi-Oh! card backs, Field Center Cards, and Yu-Gi-Oh! Series 2 layouts on Canvas. The npm package provides an ESM entry point and TypeScript declarations.

## Browser

```bash
npm install yugioh-card
```

Prepare the [assets](./resources.md), then follow the [browser guide](./browser.md) to render and download your first card. You can also try the editor in [Playground](../playground/).

## Node.js

```bash
npm install yugioh-card skia-canvas
```

`skia-canvas` supplies the Canvas implementation for Node.js. Put the assets on disk and run the [Node.js example](./node.md) to export several cards with one instance.

If you already use 1.x, see the [migration guide](../migration/).
