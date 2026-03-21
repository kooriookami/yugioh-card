# 项目指南

## 代码风格

- 遵循 [eslint.config.js](../eslint.config.js) 中现有的 JavaScript 与 Vue 风格：使用 ES modules、分号、单引号，以及按分组排序的 import。
- 变更范围应严格限制在当前任务涉及的区域。不要手动修改 [docs/](../docs/) 中的生成产物，也不要手动编辑 `dist/` 中的发布文件。
- 保持当前的职责拆分：库源码位于 [packages/src/](../packages/src/)，演示站点位于 [src/](../src/)。

## 架构

- 这个仓库主要包含两个工作面：
  - 可发布的卡片渲染库，位于 [packages/src/](../packages/src/)
  - Vue 演示应用与备用 playground，位于 [src/](../src/) 和 [play/](../play/)
- 各卡片类都继承自 [packages/src/card/index.js](../packages/src/card/index.js) 中的共享基类。可复用的渲染逻辑或环境适配逻辑应优先放在该基类或 [packages/src/utils/index.js](../packages/src/utils/index.js)，不要在不同卡片类型之间重复实现。
- 对外导出统一集中在 [packages/index.js](../packages/index.js)。新增库入口或重命名导出时，必须同步更新这里。
- 构建模式有明确区别：
  - `pnpm build` 会把网站构建到 [docs/](../docs/)
  - `pnpm build:lib` 会把 npm 库构建到 `dist/`
  - Vite 会在 [vite.config.js](../vite.config.js) 中根据 mode 切换行为

## 构建与验证

- 使用 Node 20+ 和 pnpm。
- 使用 `pnpm install` 安装依赖。
- 常用命令：
  - `pnpm dev`：启动演示站点
  - `pnpm play`：启动 [play/index.html](../play/index.html) 对应的 playground
  - `pnpm dev:node`：启动 [src/server.js](../src/server.js) 中的 Node 渲染示例
  - `pnpm build`：在修改演示站点后执行
  - `pnpm build:lib`：在修改库代码或打包配置后执行
  - `pnpm test`：运行 `packages/src/compress-text/__tests__/` 下的 Node 原生回归测试
  - `pnpm lint` 或 `pnpm lint-fix`：执行风格检查与修复
- 选择与改动范围匹配的验证命令，不要每次都默认跑完整构建。

## 约定

- 将 [README.md](../README.md) 和 [README.en.md](../README.en.md) 视为主要使用文档。引用它们即可，不要在说明文件里重复嵌入 API 细节。
- [src/assets/demo/](../src/assets/demo/) 下的演示数据是卡片数据结构和 UI 示例的标准参考。
- 资源加载依赖运行环境：
  - 浏览器环境下，`resourcePath` 应指向复制后的 [src/assets/yugioh-card/](../src/assets/yugioh-card/) 静态资源目录
  - Node 环境下，应传入绝对资源路径和 `skia-canvas` 实例，参考 [src/server.js](../src/server.js)
- 各卡片类型使用的字体目录映射注册在 [packages/src/card/index.js](../packages/src/card/index.js)。如果新增卡片家族或调整字体目录，需要同步更新映射。
- 浏览器中的文本渲染会在字体加载完成后触发重绘。修改 [packages/src/compress-text/](../packages/src/compress-text/) 或 [packages/src/utils/index.js](../packages/src/utils/index.js) 中的文本布局、压缩逻辑或初始渲染时，要考虑这类异步重绘行为。
- 新增卡片类型、语言或样式变体时，要同步更新 [packages/src/](../packages/src/) 中对应模块目录，确保它已从 [packages/index.js](../packages/index.js) 导出，并保持演示用法同步更新。
