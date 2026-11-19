# ブラウザで描画する

以下のコマンドで Vite プロジェクトを作成します。既存の ESM フロントエンドでは `yugioh-card` をインストールし、ページ上のコンテナー要素を使えます。

```bash
npm create vite@latest card-preview -- --template vanilla
cd card-preview
npm install
npm install yugioh-card
```

[静的リソース](./resources.md)に沿って `public/card-assets` を用意します。テンプレートの `#app` を残し、エントリーファイルを次のコードに置き換え、`npm run dev` を実行します。

<<< @/examples/browser.js

イラストを表示するには、公開ディレクトリに画像を置き、その URL を `data.artwork` に指定します。`card.setData({ name: 'Another Dragon' })` でカード名を更新できます。更新後は `card.ready` を取得し直し、描画が完了してから書き出してください。

`renderScale` は描画サイズを指定します。画面上のプレビューだけを拡大・縮小する場合は、外側のコンテナーを縮尺します。コンポーネントのアンマウント時は `card.leafer.destroy(true)` を呼び出します。各カードのフィールドは [API リファレンス](../reference/)を参照してください。
