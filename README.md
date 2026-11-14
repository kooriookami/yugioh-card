<h1 align="center">🎉 游戏王卡片 - Yugioh Card 🎉</h1>

<div align="center">
  <p>简体中文 | <a href="./README.en.md">English</a></p>
</div>

<p align="center">
  <a href="https://www.npmjs.org/package/yugioh-card">
    <img src="https://img.shields.io/npm/v/yugioh-card.svg">
  </a>
  <a href="https://www.npmjs.org/package/yugioh-card">
    <img src="https://img.shields.io/npm/dt/yugioh-card.svg">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg">
  </a>
</p>

<p align="center">一个使用 Canvas 渲染游戏王卡片的工具</p>

<p align="center">
  <img src="src/assets/image/banner.jpg">
</p>

目前有 5 种卡片：🚀🚀🚀🚀🚀

- 1️⃣ 游戏王
- 2️⃣ 超速决斗
- 3️⃣ 游戏王卡背
- 4️⃣ 场地中心卡
- 5️⃣ 游戏王 2 期

## 🫡 特别感谢

- [LeaferJS](https://www.leaferjs.com/) 提供的强大图形渲染功能
- [白羽幸鳥](https://tieba.baidu.com/home/main?id=tb.1.d6c63ffd.3YV5T6Q9Z7uIeVVhPlo8hg%3Ft%3D1654573649) 提供的高清卡模

## 🚩 在线演示

[在线演示](https://kooriookami.github.io/yugioh-card/)

## ⚡ 快速开始

开发环境要求：Node.js 22.13+（22.x）或 24+，pnpm 12。

`pnpm add yugioh-card`

### 仓库开发

```bash
# Node.js 22.13+（22.x）或 24+
pnpm install
pnpm dev
pnpm build
pnpm build:lib
```

### 浏览器

```js
// 可选 YugiohCard, RushDuelCard, YugiohBackCard, FieldCenterCard, YugiohSeries2Card
import { YugiohCard } from 'yugioh-card';

const card = new YugiohCard({
  view: 'xxx', // div 容器
  data: {
    ..., // 参数见下方 Data 属性
  },
  resourcePath: 'xxx', // 静态资源路径，把 src/assets/yugioh-card 文件夹复制到你的项目中或者服务器上
  readyTimeout: 30000, // 可选：等待卡片就绪的超时毫秒数，默认 30000（30 秒）
});

// 导出图片，更多导出参数请参考 https://www.leaferjs.com/ui/guide/basic/export.html
await card.ready;
await card.leafer.export('xxx.png', {
  screenshot: true,
  pixelRatio: devicePixelRatio,
});
```

### Node.js

运行 Node.js 示例前，请先确保本地 Node.js 版本为 22.13+（22.x）或 24+。

`pnpm add skia-canvas@4`

```js
import http from 'http';
import skia from 'skia-canvas';
import { YugiohCard } from 'yugioh-card';

http.createServer(async (req, res) => {
  let card;
  try {
    card = new YugiohCard({
      data: {
        ..., // 参数见下方 Data 属性
      },
      resourcePath: 'xxx', // 本地静态资源目录的绝对路径
      readyTimeout: 30000, // 可选：等待卡片就绪的超时毫秒数，默认 30000（30 秒）
      skia: skia,
    });
    await card.ready;
    const result = await card.leafer.export('png', { screenshot: true });
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<img src="${result.data}" />`);
  } catch (error) {
    console.error(error);
    res.writeHead(500);
    res.end('Card rendering failed');
  } finally {
    card?.leafer.destroy(true);
  }
}).listen(3000, () => {
    console.log('server is running at http://localhost:3000');
});
```

Node 环境的 `data.image` 也需要使用本地绝对路径或完整的 HTTP(S) 地址；Vite 图片 `import` 返回的 `/src/...` 浏览器地址不能直接用于 Node 渲染。

### 等待卡片就绪

全部五种卡片都提供只读的 `card.ready: Promise<void>`。构造和 `setData()` 会立即更新预览；浏览器字体未加载时先显示 fallback 字体。需要最终文字尺寸或导出时，等待本卡必需的字体、图片、最终排版和渲染全部成功：

```js
card.setData({ name: '青眼白龙' });
await card.ready;
// 此时可以读取最终边界，或调用 card.leafer.export()
```

同一 pending 周期内的更新共用一个 Promise，等待最新画面稳定；成功或失败后的下一次 `setData()` 建立新 Promise，因此每次更新后都应重新读取 `ready`。它不锁定数据快照；任意直接修改 Leafer 节点不在此接口的跟踪范围内。

必需资源失败会拒绝 `ready`，预览仍保留；捕获错误后可调用 `setData()` 重试。未使用的预加载字体失败不会使本卡失败。构造参数 `readyTimeout` 可设置每轮等待的超时毫秒数（默认 `30000`，必须为正有限数）。错误的 `code` 包括 `RESOURCE_FAILED`、`READY_TIMEOUT` 和 `CARD_DESTROYED`；资源错误还提供 `resourceType`、`resource` 和 `cause`。Node 原有的同步字体注册错误仍会同步抛出。

`card.leafer.destroy()` 会拒绝尚未完成的等待并清理本卡监听。Leafer 的资源队列是全局的，其他卡片或本卡未使用的预加载资源可能延迟完成通知。`ready` 不保证后续的导出编码、跨域画布读取或文件写入成功，仍须处理 `export()` 的错误。

## 🔎 示例代码

[示例代码](src/components/YugiohCard.vue)

## 📖 Data 属性

### 游戏王

|         属性名         |    说明     |   类型    |                                                         可选值                                                         |                   备注                    |        默认值        |
|:-------------------:|:---------:|:-------:|:-------------------------------------------------------------------------------------------------------------------:|:---------------------------------------:|:-----------------:|
|      language       |    语言     |  enum   |                                     'sc' / 'tc' / 'jp' / 'kr' / 'en' / 'astral'                                     |    简体中文 / 繁体中文 / 日文 / 韩文 / 英文 / 星光界文    |       'sc'        |
|        font         |    字体     |  enum   |                                             '' / 'custom1' / 'custom2'                                              |            默认 / 自定义一 / 自定义二             |        ''         |
|        name         |    卡名     | string  |                                                          —                                                          |                    —                    |        ''         |
|        color        |   卡名颜色    | string  |                                                          —                                                          |                    —                    |        ''         |
|        align        |   卡名对齐    |  enum   |                                             'left' / 'center' / 'right'                                             |             左对齐 / 居中 / 右对齐              |      'left'       |
|      gradient       |  卡名是否渐变色  | boolean |                                                          —                                                          |                    —                    |       false       |
|   gradientColor1    |   渐变色 1   | string  |                                                          —                                                          |                    —                    |     '#999999'     |
|   gradientColor2    |   渐变色 2   | string  |                                                          —                                                          |                    —                    |     '#ffffff'     |
|        type         |    类型     |  enum   |                                      'monster' / 'spell' / 'trap' / 'pendulum'                                      |            怪兽 / 魔法 / 陷阱 / 灵摆            |     'monster'     |
|      attribute      |    属性     |  enum   |                       'dark' / 'light' / 'earth' / 'water' / 'fire' / 'wind' / 'divine' / ''                        |      暗 / 光 / 地 / 水 / 炎 / 风 / 神 / 无      |      'dark'       |
|        icon         |   魔陷图标    |  enum   |                       'equip' / 'field' / 'quick-play' / 'ritual' / 'continuous' / 'counter'                        |       装备 / 场地 / 速攻 / 仪式 / 永续 / 反击       |        ''         |
|        image        |   中间卡图    | string  |                                                          —                                                          |                    —                    |        ''         |
|      cardType       |   卡片类型    |  enum   |                  'normal' / 'effect' / 'ritual' / 'fusion' / 'synchro' / 'xyz' / 'link' / 'token'                   | 通常 / 效果 / 仪式 / 融合 / 同调 / 超量 / 连接 / 衍生物  |     'normal'      |
|    pendulumType     |   灵摆类型    |  enum   | 'normal-pendulum' / 'effect-pendulum' / 'ritual-pendulum' / 'fusion-pendulum' / 'synchro-pendulum' / 'xyz-pendulum' | 通常灵摆 / 效果灵摆 / 仪式灵摆 / 融合灵摆 / 同调灵摆 / 超量灵摆 | 'normal-pendulum' |
|        level        |    星级     | number  |                                                          —                                                          |                    —                    |         0         |
|        rank         |    阶级     | number  |                                                          —                                                          |                    —                    |         0         |
|    pendulumScale    |   灵摆刻度    | number  |                                                          —                                                          |                    —                    |         0         |
| pendulumDescription |   灵摆效果    | string  |                                                          —                                                          |                    —                    |        ''         |
|     monsterType     |   怪兽类型    | string  |                                                          —                                                          |                    —                    |        ''         |
|       atkBar        |    攻守条    | boolean |                                                          —                                                          |                    —                    |       true        |
|         atk         |    攻击力    | number  |                                                          —                                                          |                ?：-1，∞：-2                |         0         |
|         def         |    防御力    | number  |                                                          —                                                          |                ?：-1，∞：-2                |         0         |
|      arrowList      |   连接箭头    |  array  |                                              [1, 2, 3, 4, 5, 6, 7, 8]                                               |      [上, 右上, 右, 右下, 下, 左下, 左, 左上]       |        []         |
|     description     |   效果描述    | string  |                                                          —                                                          |                    —                    |        ''         |
|  firstLineCompress  |  是否首行压缩   | boolean |                                                          —                                                          |                    —                    |       false       |
|  descriptionAlign   | 是否效果描述居中  | boolean |                                                          —                                                          |                    —                    |       false       |
|   descriptionZoom   |  效果描述缩放   | number  |                                                          —                                                          |                    —                    |         1         |
|  descriptionWeight  |  效果描述字重   | number  |                                                          —                                                          |                    —                    |         0         |
|       package       |    卡包     | string  |                                                          —                                                          |                    —                    |        ''         |
|      password       |   卡片密码    | string  |                                                          —                                                          |                    —                    |        ''         |
|      copyright      |    版权     |  enum   |                                                 'sc' / 'jp' / 'en'                                                  |             简体中文 / 日文 / 英文              |        ''         |
|        laser        |    角标     |  enum   |                                      'laser1' / 'laser2' / 'laser3' / 'laser4'                                      |          样式一 / 样式二 / 样式三 / 样式四          |        ''         |
|        rare         |    罕贵     |  enum   |                                 'dt' / 'ur' / 'gr' / 'hr' / 'ser' / 'gser' / 'pser'                                 |  DT / UR / GR / HR / SER / GSER / PSER  |        ''         |
|      twentieth      | 是否是 20 周年 | boolean |                                                          —                                                          |                    —                    |       false       |
|       radius        |   是否是圆角   | boolean |                                                          —                                                          |                    —                    |       true        |
|        scale        |   卡片缩放    | number  |                                                          —                                                          |                    —                    |         1         |

### 超速决斗

|        属性名        |    说明    |   类型    |                                  可选值                                   |              备注               |    默认值    |
|:-----------------:|:--------:|:-------:|:----------------------------------------------------------------------:|:-----------------------------:|:---------:|
|     language      |    语言    |  enum   |                              'sc' / 'jp'                               |           简体中文 / 日文           |   'sc'    |
|       name        |    卡名    | string  |                                   —                                    |               —               |    ''     |
|       color       |   卡名颜色   | string  |                                   —                                    |               —               |    ''     |
|       type        |    类型    |  enum   |                      'monster' / 'spell' / 'trap'                      |         怪兽 / 魔法 / 陷阱          | 'monster' |
|     attribute     |    属性    |  enum   | 'dark' / 'light' / 'earth' / 'water' / 'fire' / 'wind' / 'divine' / '' | 暗 / 光 / 地 / 水 / 炎 / 风 / 神 / 无 |  'dark'   |
|       icon        |   魔陷图标   |  enum   | 'equip' / 'field' / 'quick-play' / 'ritual' / 'continuous' / 'counter' |  装备 / 场地 / 速攻 / 仪式 / 永续 / 反击  |    ''     |
|       image       |   中间卡图   | string  |                                   —                                    |               —               |    ''     |
|     cardType      |   卡片类型   |  enum   |               'normal' / 'effect' / 'ritual' / 'fusion'                |       通常 / 效果 / 仪式 / 融合       | 'normal'  |
|       level       |    星级    | number  |                                   —                                    |               —               |     0     |
|    monsterType    |   怪兽类型   | string  |                                   —                                    |               —               |    ''     |
|    maximumAtk     |  极限攻击力   | number  |                                   —                                    |               —               |     0     |
|        atk        |   攻击力    | number  |                                   —                                    |             ?：-1              |     0     |
|        def        |   防御力    | number  |                                   —                                    |             ?：-1              |     0     |
|    description    |   效果描述   | string  |                                   —                                    |               —               |    ''     |
| firstLineCompress |  是否首行压缩  | boolean |                                   —                                    |               —               |   false   |
| descriptionAlign  | 是否效果描述居中 | boolean |                                   —                                    |               —               |   false   |
|  descriptionZoom  |  效果描述缩放  | number  |                                   —                                    |               —               |     1     |
| descriptionWeight |  效果描述字重  | number  |                                   —                                    |               —               |     0     |
|      package      |    卡包    | string  |                                   —                                    |               —               |    ''     |
|     password      |   卡片密码   | string  |                                   —                                    |               —               |    ''     |
|      legend       |  是否是传说   | boolean |                                   —                                    |               —               |   false   |
|       laser       |    角标    |  enum   |               'laser1' / 'laser2' / 'laser3' / 'laser4'                |     样式一 / 样式二 / 样式三 / 样式四     |    ''     |
|       rare        |    罕贵    |  enum   |                          'sr' / 'rr' / 'pser'                          |        SR / RR / PSER         |    ''     |
|      radius       |  是否是圆角   | boolean |                                   —                                    |               —               |   true    |
|       scale       |   卡片缩放   | number  |                                   —                                    |               —               |     1     |

### 游戏王卡背

|   属性名    |   说明    |   类型    |                           可选值                           |          备注          |   默认值    |
|:--------:|:-------:|:-------:|:-------------------------------------------------------:|:--------------------:|:--------:|
|   type   |  卡背类型   |  enum   | 'normal' / 'tormentor' / 'sky-dragon' / 'winged-dragon' | 通常 / 巨神兵 / 天空龙 / 翼神龙 | 'normal' |
|   logo   |   标志    |  enum   |                  'ocg' / 'tcg' / 'rd'                   |    OCG / TCG / RD    |  'ocg'   |
|  konami  | 是否有 K 标 | boolean |                            —                            |          —           |   true   |
| register | 是否有 R 标 | boolean |                            —                            |          —           |   true   |
|  radius  |  是否是圆角  | boolean |                            —                            |          —           |   true   |
|  scale   |  卡片缩放   | number  |                            —                            |          —           |    1     |

### 场地中心卡

|   属性名    |  说明   |   类型    | 可选值 | 备注 |  默认值  |
|:--------:|:-----:|:-------:|:---:|:--:|:-----:|
|  image   | 场地图片  | string  |  —  | —  |  ''   |
| cardBack | 是否是卡背 | boolean |  —  | —  | false |
|  radius  | 是否是圆角 | boolean |  —  | —  | true  |
|  scale   | 卡片缩放  | number  |  —  | —  |   1   |

### 游戏王 2 期

|        属性名        |    说明    |   类型    |                                           可选值                                            |                 备注                  |    默认值    |
|:-----------------:|:--------:|:-------:|:----------------------------------------------------------------------------------------:|:-----------------------------------:|:---------:|
|     language      |    语言    |  enum   |                                           'jp'                                           |                 日文                  |   'jp'    |
|       font        |    字体    |  enum   |                                '' / 'custom1' / 'custom2'                                |          默认 / 自定义一 / 自定义二           |    ''     |
|       name        |    卡名    | string  |                                            —                                             |                  —                  |    ''     |
|       color       |   卡名颜色   | string  |                                            —                                             |                  —                  |    ''     |
|       align       |   卡名对齐   |  enum   |                               'left' / 'center' / 'right'                                |           左对齐 / 居中 / 右对齐            |  'left'   |
|     gradient      | 卡名是否渐变色  | boolean |                                            —                                             |                  —                  |   false   |
|  gradientColor1   |  渐变色 1   | string  |                                            —                                             |                  —                  | '#999999' |
|  gradientColor2   |  渐变色 2   | string  |                                            —                                             |                  —                  | '#ffffff' |
|       type        |    类型    |  enum   |                               'monster' / 'spell' / 'trap'                               |            怪兽 / 魔法 / 陷阱             | 'monster' |
|     attribute     |    属性    |  enum   |          'dark' / 'light' / 'earth' / 'water' / 'fire' / 'wind' / 'divine' / ''          |    暗 / 光 / 地 / 水 / 炎 / 风 / 神 / 无    |  'dark'   |
|       icon        |   魔陷图标   |  enum   |          'equip' / 'field' / 'quick-play' / 'ritual' / 'continuous' / 'counter'          |     装备 / 场地 / 速攻 / 仪式 / 永续 / 反击     |    ''     |
|       image       |   中间卡图   | string  |                                            —                                             |                  —                  |    ''     |
|     cardType      |   卡片类型   |  enum   | 'normal' / 'effect' / 'ritual' / 'fusion' / 'tormentor' / 'sky-dragon' / 'winged-dragon' | 通常 / 效果 / 仪式 / 融合 / 巨神兵 / 天空龙 / 翼神龙 | 'normal'  |
|       level       |    星级    | number  |                                            —                                             |                  —                  |     0     |
|    monsterType    |   怪兽类型   | string  |                                            —                                             |                  —                  |    ''     |
|        atk        |   攻击力    | number  |                                            —                                             |           ????：-1，X000：-2           |     0     |
|        def        |   防御力    | number  |                                            —                                             |           ????：-1，X000：-2           |     0     |
|    description    |   效果描述   | string  |                                            —                                             |                  —                  |    ''     |
| firstLineCompress |  是否首行压缩  | boolean |                                            —                                             |                  —                  |   false   |
| descriptionAlign  | 是否效果描述居中 | boolean |                                            —                                             |                  —                  |   false   |
|  descriptionZoom  |  效果描述缩放  | number  |                                            —                                             |                  —                  |     1     |
| descriptionWeight |  效果描述字重  | number  |                                            —                                             |                  —                  |     0     |
|      package      |    卡包    | string  |                                            —                                             |                  —                  |    ''     |
|     password      |   卡片密码   | string  |                                            —                                             |                  —                  |    ''     |
|     copyright     |    版权    |  enum   |                                           'jp'                                           |                 日文                  |    ''     |
|       laser       |    角标    |  enum   |                        'laser1' / 'laser2' / 'laser3' / 'laser4'                         |        样式一 / 样式二 / 样式三 / 样式四        |    ''     |
|      radius       |  是否是圆角   | boolean |                                            —                                             |                  —                  |   true    |
|       scale       |   卡片缩放   | number  |                                            —                                             |                  —                  |     1     |
