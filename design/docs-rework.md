# Yugioh Card 2.0 文档重构草案

文档站采用 **VitePress 2.0 默认主题**，当前固定到 `2.0.0-alpha.21`。现有站点首页改为项目简介，提供「快速开始」和「在线试用」两个入口。卡片编辑器迁到同站的 Playground，五种卡片各有独立参数页。 [VitePress 2.0 发布记录](https://github.com/vuejs/vitepress/releases/tag/v2.0.0-alpha.21)

## 1. 导航与三语内容

简体中文放在站点根路径，英文用 `/en/`，日文用 `/ja/`。三语镜像同一套路由，切换语言时优先留在当前页面。顶栏用 `themeConfig.socialLinks` 配置项目的 GitHub 图标，文档页用 `editLink` 指向对应的 Markdown 源文件。 [项目 GitHub 仓库](https://github.com/kooriookami/yugioh-card) · [VitePress 国际化](https://vitepress.dev/guide/i18n) · [GitHub 导航配置](https://vitepress.dev/reference/default-theme-config#sociallinks) · [页面编辑链接](https://vitepress.dev/reference/default-theme-edit-link)

| 栏目 | 内容 |
| --- | --- |
| 首页 | 项目用途、五种卡片、快速开始、在线试用 |
| 使用指南 | 安装、静态资源与 `resourcePath`、浏览器渲染、Node.js 渲染与批量导出 |
| API 参考 | 公共构造选项、`setData()`、`ready`、导出与销毁，以及五种卡片的参数页 |
| Playground | 选择卡片和示例、编辑 JSON、实时预览、导出 PNG |
| 升级指南 | 1.x 到 2.0 的字段迁移、资源更新与导出流程 |

安装页应让用户从空项目跑通。浏览器示例用 `yugioh-card` 和可访问的资源 URL，Node.js 示例加装 `skia-canvas` 并使用本地绝对资源路径。两端都演示 `await card.ready` 后导出。批量导出示例展示如何复用实例，依次更新数据、等待当前卡片、写入 PNG。

三语文档使用相同的 API 名称和枚举，只翻译标签和说明。术语以简中 OCG、英文 TCG、日文 OCG 为参考，例如 `rank` 用「阶级 / Rank / ランク」，`pendulumScale` 用「灵摆刻度 / Pendulum Scale / ペンデュラムスケール」。文档语言和卡片的 `language` 独立配置，例如在英文文档中也能展示日文的第 2 期卡片。 [简中官方卡片数据库](https://db.yugioh-card-cn.com/card_search.action.html) · [英文 TCG 数据库](https://www.db.yugioh-card.com/yugiohdb/card_search.action?request_locale=en) · [日文 OCG 数据库](https://www.db.yugioh-card.com/yugiohdb/card_search.action?request_locale=ja) · [日文 Rush Duel 数据库](https://www.db.yugioh-card.com/rushdb/?request_locale=ja)

## 2. 五种卡片的参数页

| 页面 | 重点示例 |
| --- | --- |
| 游戏王 `YugiohCard` | 普通怪兽、灵摆、连接，展示 `pendulumEffect` 和 `linkArrows` 的效果 |
| 超速决斗 `RushDuelCard` | `maximumAtk`、LEGEND 标记、日文与简中样式 |
| 游戏王卡背 `YugiohBackCard` | 卡背样式、游戏标志和显示开关 |
| 场地中心卡 `FieldCenterCard` | 卡图、圆角与背面切换 |
| 游戏王第 2 期 `YugiohSeries2Card` | 日文注音、旧版卡框与卡片文本 |

每页按「卡片预览 → 可复制示例 → 参数表」组织。参数表列出类型、默认值、可选值和生效条件。比如 `linkArrows` 给出八个位置的对应关系，并说明有效方向去重后如何得到 LINK 数值。通用构造选项集中写在公共 API 页。

五页共用一个预览组件。每页展示该卡片的默认 Demo，首屏使用同一份数据生成的静态缩略图，进入视口后在浏览器加载 Leafer 并绘制 Canvas，离开页面时释放实例。VitePress 构建时需要将依赖 DOM 的编辑器和渲染器放在客户端动态加载的边界内。 [VitePress SSR 兼容指南](https://vitepress.dev/guide/ssr-compat)

## 3. Playground 的样式与交互

桌面采用**左预览、右编辑**的布局。左侧用暖灰画布和低对比度网格衬托卡片，预览下方提供「适应窗口 / 原始大小」。右侧顶部是卡片类型和示例选择器，下方是 JSON 编辑器，底部放「复制 JSON」「重置示例」和主按钮「导出 PNG」。深色模式跟随文档主题，窄屏改为预览在上、编辑器在下。

迁移时复用现有 Demo 的五种示例数据、实时更新、加载状态和 PNG 导出。JSON 输入有误时保留上一次有效预览，在编辑器旁显示错误。导出等待当前渲染周期的 `ready`，预览缩放只改变屏幕上的显示尺寸。公开 `/playground/` 面向卡片使用者，现有 [CompressText 调试页](../play/Play.vue) 供开发时检查排版。

## 4. 1.x → 2.0 迁移

以已发布的 **1.9.2** 和 2.0 发布包为对照。文档开头给出一份完整的前后示例，再按五种卡片列出字段改名、值转换与渲染行为变化。 [yugioh-card 1.9.2](https://www.npmjs.com/package/yugioh-card/v/1.9.2)

| 1.x | 2.0 |
| --- | --- |
| `description`、`image`、`scale` | 对应 `cardText`、`artwork`、`renderScale`，按卡片类型查适用字段 |
| `firstLineCompress` | `true` 转为 `compressCardTextSegments: [1]`，`false` 转为 `[]`。段号从 1 开始 |
| `descriptionAlign` | `true` 转为 `cardTextAlign: 'center'`，`false` 转为 `'justify'` |
| `arrowList` | 改为 `linkArrows`，箭头与 LINK 数值共用这份数据 |

最后给一份升级检查清单，覆盖旧 JSON、`resourcePath` 与新版字体、每次 `setData()` 后重新读取 `ready`，以及重新导出代表性卡片确认排版。

## 5. 构建、发布与验收

目前 `pnpm build` 会向 `docs/` 写入 Demo 产物。实施时先调整这个入口，再把 `docs/` 用作文档源码。VitePress 产物写入 `docs/.vitepress/dist`，通过 GitHub Actions 发布到现有 GitHub Pages 地址，配置 `base: '/yugioh-card/'`。Playground 和文档预览共用随同一次构建发布的卡模与字体，浏览器按需加载。 [VitePress 的 GitHub Pages 部署说明](https://vitepress.dev/guide/deploy#github-pages)

发布前验收三语页面、语言切换、子路径直达与刷新，以及五种卡片的实时预览和 PNG 导出。用**相同的 2.0 示例数据**对照迁移前后的 Demo，检查卡片画面和导出尺寸。额外建议开启 VitePress 本地搜索，发布前分别用 `cardText`、`连接标记`、`ペンデュラム` 验证三语检索。 [VitePress 本地搜索](https://vitepress.dev/reference/default-theme-search#local-search)
