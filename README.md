# 游戏王卡片 Yugioh Card

一个使用 Canvas 渲染游戏王卡片的工具。

目前有 5 种卡片：

- 游戏王
- 超速决斗
- 游戏王卡背
- 场地中心卡
- 游戏王 2 期

## 在线演示

[在线演示](https://kooriookami.github.io/yugioh-card/)

## 使用说明

```npm i yugioh-card```

```js
  import { YugiohCard } from 'yugioh-card';

  const card = new YugiohCard({
    view: '', // div 容器
    data: {
      ... // 参数见 packages/yugioh-card/src/yugioh-card/index.js => this.defaultData
    },
    resourcePath: 'src/assets/yugioh-card', // 静态资源路径
  });
```

## 示例代码

[示例代码](src/components/YugiohCard.vue)
