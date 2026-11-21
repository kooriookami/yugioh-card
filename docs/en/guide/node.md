# Render in Node.js

Put the assets in `card-assets/` next to your script. Install `yugioh-card` and `skia-canvas`, save the example as `render.mjs`, and run `node render.mjs`. The PNG files appear in `output/` next to the script.

<<< @/examples/node.mjs

You can reuse an instance for cards of the same type. Call `setData()`, read and await `ready`, then export and write each card before advancing to the next one. In Node.js, the example uses `blob: true` to get a PNG `Buffer`.

`setData()` merges the supplied fields into the current data. Provide every field that changes from one card to the next. For example, pass `artwork: ''` to clear the previous card's artwork. To change card type, instantiate the corresponding class.

See [Export and cleanup with Leafer](../reference/#export-and-destroy) for the available options.
