# Static assets

Copy the entire `src/assets/yugioh-card` directory from the project source for your npm package version. Name the copy `card-assets`. Preserve the directory structure and filename casing, including the font manifests alongside the font files. [Project asset directory](https://github.com/kooriookami/yugioh-card/tree/master/src/assets/yugioh-card)

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

- **Browser.** Place the directory among your site's public files. In Vite, copy it to `public/card-assets` and use `import.meta.env.BASE_URL` to construct its URL.
- **Node.js.** Set `resourcePath` to an absolute local directory. Use `fileURLToPath(new URL('./card-assets', import.meta.url))` to resolve it relative to the script.
- **Card artwork.** Set `artwork` to the image URL in a browser or an absolute file path in the Node.js example. Cross-origin image servers must allow CORS for browser PNG export.

Point `resourcePath` to the parent of `yugioh/` and the other card directories. If rendering fails, check the URL or path in the error, then check the directory layout and package version.
