# 静态资源

从与 npm 包版本对应的项目源码中复制整个 `src/assets/yugioh-card` 目录，将副本命名为 `card-assets`。保留目录结构和文件名的大小写，字体清单和字体文件需要一起复制。 [项目资源目录](https://github.com/kooriookami/yugioh-card/tree/master/src/assets/yugioh-card)

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

- **浏览器**将目录放到站点公开的静态资源目录中。使用 Vite 时，路径为 `public/card-assets`，并用 `import.meta.env.BASE_URL` 拼接资源 URL。
- **Node.js**将 `resourcePath` 设成本地绝对目录路径。可以用 `fileURLToPath(new URL('./card-assets', import.meta.url))` 根据脚本位置解析。
- **卡图**用单独的 `artwork` 字段指定。浏览器接受图片 URL，Node.js 示例使用本地绝对文件路径。跨域图片需要服务器允许 CORS 才能导出 PNG。

`resourcePath` 指向包含 `yugioh/` 等子目录的上一级。渲染失败时，先检查错误中的资源地址，再确认目录层级和包版本。
