# Shared API

Import the classes below from `yugioh-card`. Each class takes `CardOptions<TData>`. Pass card fields in `data`.

| Card | Class |
| --- | --- |
| [Yu-Gi-Oh!](./cards/yugioh.md) | `YugiohCard` |
| [Rush Duel](./cards/rush-duel.md) | `RushDuelCard` |
| [Yu-Gi-Oh! Card Back](./cards/yugioh-back.md) | `YugiohBackCard` |
| [Field Center Card](./cards/field-center.md) | `FieldCenterCard` |
| [Yu-Gi-Oh! Series 2](./cards/yugioh-series-2.md) | `YugiohSeries2Card` |

## Constructor options {#card-options}

| Option | Type | Usage |
| --- | --- | --- |
| `view` | `ILeaferInputData['view']` | The DOM element that hosts the canvas in a browser. Optional in Node.js. |
| `data` | `Partial<TData>` | Fields to override in the default card data. |
| `resourcePath` | `string` | The [asset root](../guide/resources.md) for frames, icons, and fonts. |
| `skia` | `SkiaCanvas` | In Node.js, pass the object imported from `skia-canvas`. |
| `readyTimeout` | `number` | Timeout for each readiness cycle, in milliseconds. Defaults to `30000`. |

## Updates and readiness {#updates-and-ready}

`card.setData(patch)` merges the fields you supply and skips values of `undefined`. Pass `''` to explicitly clear text or artwork. The browser can preview a card with fallback fonts while the fonts load.

`await card.ready` waits for the current card's required fonts, images, final layout, and a draw. Read it again after each call to `setData()`. The promise rejects on required asset errors or a timeout. After handling an error, you can start another update to retry.

## Export and cleanup {#export-and-destroy}

Call `card.leafer.export()`. See the [browser guide](../guide/browser.md) for downloads. In Node.js, `{ screenshot: true, blob: true }` returns a PNG Buffer. Handle export and file-write failures separately. Call `card.leafer.destroy(true)` when unmounting a page component or finishing a script.

## Terminology {#terminology}

The field descriptions draw on the official TCG, OCG, and Rush Duel databases. Field names and enum values are shared across locales. [English TCG](https://www.db.yugioh-card.com/yugiohdb/card_search.action?request_locale=en) · [Simplified Chinese OCG](https://db.yugioh-card-cn.com/card_search.action.html) · [Japanese OCG](https://www.db.yugioh-card.com/yugiohdb/card_search.action?request_locale=ja) · [Rush Duel](https://www.db.yugioh-card.com/rushdb/?request_locale=ja)
