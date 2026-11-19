# 共通 API

以下のクラスを `yugioh-card` からインポートします。各クラスは `CardOptions<TData>` を受け取り、カードのフィールドは `data` で指定します。

| カード | クラス |
| --- | --- |
| [遊戯王](./cards/yugioh.md) | `YugiohCard` |
| [ラッシュデュエル](./cards/rush-duel.md) | `RushDuelCard` |
| [遊戯王カードの裏面](./cards/yugioh-back.md) | `YugiohBackCard` |
| [フィールドセンターカード](./cards/field-center.md) | `FieldCenterCard` |
| [遊戯王 第2期](./cards/yugioh-series-2.md) | `YugiohSeries2Card` |

## コンストラクターオプション {#card-options}

| オプション | 型 | 用途 |
| --- | --- | --- |
| `view` | `ILeaferInputData['view']` | ブラウザで Canvas を配置する DOM 要素。Node.js では省略できます。 |
| `data` | `Partial<TData>` | カードの既定値を上書きするフィールド。 |
| `resourcePath` | `string` | フレーム、アイコン、フォントを含む[リソースのルート](../guide/resources.md)。 |
| `skia` | `SkiaCanvas` | Node.js では `skia-canvas` からインポートしたオブジェクトを指定します。 |
| `readyTimeout` | `number` | 各描画サイクルのタイムアウト。単位はミリ秒で、既定値は `30000` です。 |

## 更新と描画完了の待機 {#updates-and-ready}

`card.setData(patch)` は、指定したフィールドを現在のデータに反映します。`undefined` のフィールドはスキップされます。文字やイラストを削除するには `''` を指定します。ブラウザではフォントの読み込み中に代替フォントでプレビューできます。

`await card.ready` は、現在のカードに必要なフォントと画像、最終レイアウト、描画の完了を待ちます。`setData()` のたびに取得し直してください。必須リソースのエラーまたはタイムアウトで Promise が拒否されます。エラー処理後は、データを再度更新してリトライできます。

## 書き出しと破棄 {#export-and-destroy}

`card.leafer.export()` で書き出します。ブラウザでのダウンロードは[ブラウザ向けガイド](../guide/browser.md)を参照してください。Node.js では `{ screenshot: true, blob: true }` を指定すると PNG の Buffer を受け取れます。書き出しやファイル保存のエラーは別途処理してください。コンポーネントのアンマウント時、またはスクリプトの終了時に `card.leafer.destroy(true)` を呼び出します。

## 用語の参照先 {#terminology}

カードの用語は OCG、TCG、ラッシュデュエルの公式カードデータベースを参照しています。フィールド名と列挙値は各言語で共通です。 [日本語 OCG](https://www.db.yugioh-card.com/yugiohdb/card_search.action?request_locale=ja) · [英語 TCG](https://www.db.yugioh-card.com/yugiohdb/card_search.action?request_locale=en) · [簡体字 OCG](https://db.yugioh-card-cn.com/card_search.action.html) · [ラッシュデュエル](https://www.db.yugioh-card.com/rushdb/?request_locale=ja)
