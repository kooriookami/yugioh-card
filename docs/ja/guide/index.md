# インストール

Yugioh Card は、遊戯王、ラッシュデュエル、遊戯王カードの裏面、フィールドセンターカード、遊戯王 第2期を Canvas で描画します。npm パッケージには ESM のエントリーポイントと TypeScript の型定義が含まれます。

## ブラウザ

```bash
npm install yugioh-card
```

[静的リソース](./resources.md)を用意し、[ブラウザ向けガイド](./browser.md)に沿ってカードを描画して PNG を書き出します。[Playground](../playground/) でエディターを試すこともできます。

## Node.js

```bash
npm install yugioh-card skia-canvas
```

`skia-canvas` は Node.js 向けの Canvas 実装です。リソースをローカルに用意すると、[Node.js のサンプル](./node.md)で同じインスタンスを使って複数枚を書き出せます。

1.x を使用中の場合は、[移行ガイド](../migration/)を参照してください。
