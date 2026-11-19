# Node.js で描画する

スクリプトの隣に `card-assets/` を配置します。`yugioh-card` と `skia-canvas` をインストールし、サンプルを `render.mjs` として保存して `node render.mjs` を実行します。PNG はスクリプトの隣の `output/` に出力されます。

<<< @/examples/node.mjs

同じ種類のカードはインスタンスを再利用できます。各カードで `setData()` を呼び出し、その時点の `ready` を取得して待機し、書き出しとファイル保存が完了してから次のカードへ進みます。この例では `blob: true` を指定し、PNG を Node.js の `Buffer` として受け取ります。

`setData()` は現在のデータに指定したフィールドを反映します。カードごとに変わるフィールドを毎回指定してください。前のカードのイラストを消す場合は `artwork: ''` を指定します。カードの種類が変わる場合は、対応するクラスのインスタンスを作成します。

オプションの詳細は [Leafer での書き出しと破棄](../reference/#export-and-destroy)を参照してください。
