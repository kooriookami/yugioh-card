# Render in the browser

Start with a Vite project using these commands. In an existing ESM frontend project, install `yugioh-card` and use your own HTML container.

```bash
npm create vite@latest card-preview -- --template vanilla
cd card-preview
npm install
npm install yugioh-card
```

Prepare `public/card-assets` as described in [Static assets](./resources.md). Keep the template's `#app` container, replace the entry file with this code, and run `npm run dev`.

<<< @/examples/browser.js

To add artwork, put an image in the public directory and pass its URL as `data.artwork`. Call `card.setData({ name: 'Another Dragon' })` to update the name. After updates, read `card.ready` again and wait for rendering to finish before exporting.

`renderScale` controls the rendered dimensions. To enlarge or shrink the preview on screen, scale its outer container. Call `card.leafer.destroy(true)` when unmounting the component. See the [API reference](../reference/) for card types and fields.
