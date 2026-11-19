# 项目开发约定

## 代码与目录

- 遵循 [eslint.config.js](eslint.config.js)：ES modules、分号、单引号、LF 换行和现有 import 分组。
- 修改范围围绕当前任务。`docs/` 和 `dist/` 是构建产物，只通过构建命令生成。
- TypeScript 发布库位于 [packages/src/](packages/src/)，Vue 演示应用位于 [src/](src/)，备用 playground 位于 [play/](play/)。
- 五种卡片继承 [Card 基类](packages/src/card/index.ts)。共享资源、排版与环境适配逻辑集中在公共模块，避免在卡片类之间重复实现。
- 对外入口集中在 [packages/index.ts](packages/index.ts)。新增或重命名导出、卡片类型、语言和样式时，同步入口、类型、资源映射和示例。
- [演示数据](src/assets/demo/) 是卡片数据结构和界面的标准参考。

## 环境与验证

- 使用 [package.json](package.json) 声明的 Node.js 版本（`^22.13.0 || >=24.0.0`）和 pnpm；依赖安装使用 `pnpm install`。
- `pnpm dev`：启动演示应用；`pnpm play`：打开 playground；`pnpm dev:node`：运行 Node 渲染示例。
- `pnpm typecheck`：按 [库配置](packages/tsconfig.json) 严格检查 TypeScript 源码。
- `pnpm test`：通过 Node 的类型擦除运行源码回归，包含文字布局、字体与图片资源、真实 Skia 渲染和演示组件状态。使用 Node 22 运行直接导入源码的性能命令时，可传入 `--experimental-strip-types`。
- 对修改的 JavaScript、Vue 文件执行 `pnpm exec eslint <文件>`；测试围绕可观察行为和必要的真实引擎边界。
- 修改库后执行 `pnpm build:lib`，通过类型检查并生成 `dist/` 中的 ESM JavaScript 和 `.d.ts`；修改演示应用后执行网站构建。常规 `pnpm build` 输出到 `docs/`，本地验证可用 `pnpm build --outDir node_modules/.cache/website-build`。
- 涉及发布包兼容性时，将 `dist` 打成 `.tgz` 安装到独立消费项目，验证浏览器与 Node 实际导入和使用的都是发布产物。
- 字体加载和绘制时序的浏览器验证方式见 [设计文档](design/card-ready.md#12-本次实现的决策与落点)。使用可控的资源信号，配合真实 FontFace、测量和 PNG 导出验证。

## 资源、排版与就绪状态

- 浏览器的 `resourcePath` 指向可访问的静态资源目录；Node 使用本地绝对路径和 `skia-canvas`，参考 [Node 示例](src/server.js)。字体目录映射由 Card 基类维护。
- 构造和 `setData()` 同步提供预览；浏览器字体未完成时使用 fallback。`card.ready` 等待本卡必需字体、图片、最终排版和一次实际绘制成功。
- pending 期间更新共用一个 Promise，并跟随最新依赖；完成或失败后的下一次更新建立新 Promise。使用者每次更新后重新读取 `ready`。
- 字体加载后使测量失效，再统一重排依赖位置。已缓存字体的普通更新保留同步路径；独立 `CompressText` 继续响应相关字体加载通知。
- 字体资源依赖匹配和浏览器加载通知比较忽略大小写，资源清单中的名称与文件路径保留原始大小写。
- 已知必需资源失败优先拒绝，并保留资源地址与原始原因；显式新周期允许重试。同步绘制错误保持同步抛出，未读取 `ready` 的旧调用方不能产生未处理拒绝。
- 首次构造失败时清理订阅、图片引用和 Leafer；后续更新失败保留可恢复的实例。销毁只释放本卡引用，迟到回调不能重绘或覆盖当前状态。
- 演示应用的加载提示跟随当前实例及当前 `ready`；切换、卸载和新周期后忽略旧任务，实际加载或导出错误仍可观察。
- Leafer 的资源队列是全局的，其他资源仍可能延迟本卡的视图完成。`ready` 不锁定数据快照，也不保证后续导出编码、跨域或文件写入成功。

## 文档

- [中文 README](README.md) 与 [英文 README](README.en.md) 用于项目简介。公开接口变更同步类型声明和示例，详细用法与升级说明在独立文档维护。
- 完整的 `ready` 语义、引擎边界、设计理由和验收场景集中在 [design/card-ready.md](design/card-ready.md)。这里保留开发约束，详细设计在该文档维护。
