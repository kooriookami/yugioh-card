# 静的リソース

npm パッケージのバージョンに対応するソースから `src/assets/yugioh-card` ディレクトリ全体をコピーし、`card-assets` という名前で配置します。ディレクトリ構成とファイル名の大文字・小文字を保ち、フォント一覧とフォントファイルを一緒にコピーしてください。 [プロジェクトのリソース](https://github.com/kooriookami/yugioh-card/tree/master/src/assets/yugioh-card)

```text
card-assets/
├─ yugioh/
│  ├─ font/
│  └─ image/
├─ yugioh-series-2/image/
├─ rush-duel/
│  ├─ font/
│  └─ image/
├─ yugioh-back/image/
└─ field-center/image/
```

- **ブラウザ**ではサイトの公開ディレクトリに配置します。Vite の場合は `public/card-assets` に置き、`import.meta.env.BASE_URL` を使って URL を組み立てます。
- **Node.js** では `resourcePath` にローカルディレクトリの絶対パスを指定します。`fileURLToPath(new URL('./card-assets', import.meta.url))` でスクリプトからの相対位置を解決できます。
- **カードイラスト**は `artwork` で指定します。ブラウザでは画像 URL を使い、Node.js のサンプルではファイルの絶対パスを使います。ブラウザで別オリジンの画像を使って PNG を書き出すには、画像サーバーで CORS の許可が必要です。

`resourcePath` には `yugioh/` などの親ディレクトリを指定します。描画に失敗した場合は、エラーに表示されたパス、ディレクトリ構成、パッケージのバージョンを確認してください。
