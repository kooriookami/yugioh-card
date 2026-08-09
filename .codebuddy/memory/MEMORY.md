# yugioh-card 项目记忆

## 项目概况
- 游戏王卡片 Canvas 渲染工具，Vue 3 + Vite + Element Plus + Leafer 引擎
- 包管理器: pnpm，Node.js >= 22
- 纯前端 JS 项目，不需要 conda 环境

## 启动方式
```bash
pnpm install
pnpm dev    # 开发服务器 http://localhost:5173
```

## 字体系统
- 字体文件放在 `src/assets/yugioh-card/{yugioh|rush-duel}/font/`
- 通过 `font-list.json` 注册，JS FontFace API 动态加载
- 替换字体：直接覆盖 .woff2 文件，保持文件名不变即可

## 界面优化 (2026-08-04)
- 将 YugiohCard.vue 从纯 JSON 编辑器改为可视化表单（标签在上、平铺式布局）
- 参考 ygo.ygosgs.com 设计，字段顺序：语言→卡名→颜色→字体→对齐→类型→属性→卡类→星级→种族→ATK/DEF→效果描述→高级
- 四种中文字体：细隶书简(ygo-xlsj)、细隶书繁(ygo-xlsf)、华康隶书(ygo-hklsw7)、楷体(ygo-kt)
- 字体简繁联动：选简体隶书→自动切换简中；选繁体隶书→自动切换繁中
- 修复 Card.setData 中 reactive proxy 导致 get style() 返回空对象的 bug
- 添加图片上传（本地文件+URL输入）、link怪兽连接箭头选择器、卡背/场地卡特殊参数
- 移除无效的 frame（出框）开关、冗余 custom1/custom2 字体选项
