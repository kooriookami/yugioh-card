![img.png](https://github.com/pf666nb/My-LeetCode/blob/main/img.png)
[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&pause=1000&width=435&lines=%E4%B8%80%E4%B8%AA%E4%BD%BF%E7%94%A8+Canvas+%E6%B8%B2%E6%9F%93%E6%B8%B8%E6%88%8F%E7%8E%8B%E5%8D%A1%E7%89%87%E7%9A%84%E5%B7%A5%E5%85%B7%E3%80%82)](https://git.io/typing-svg)</p>
![Static Badge](https://img.shields.io/badge/release-0.0.1-blue)
![Static Badge](https://img.shields.io/badge/start-3-yellow)
目前有 5 种卡片：🌹🌹🌹🌹🌹

1️⃣ 游戏王 </p>
2️⃣ 超速决斗 </p>
3️⃣ 游戏王卡背 </p>
4️⃣ 场地中心卡 </p>
5️⃣ 游戏王 2 期 </p>

## 🚩在线演示

[在线演示](https://kooriookami.github.io/yugioh-card/)

## ⚡快速开始

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

## ⚠️参数事项

### 游戏王卡片

|         属性名         |    说明     |   类型    |                                                         可选值                                                         |                   备注                    |        默认值        |
|:-------------------:|:---------:|:-------:|:-------------------------------------------------------------------------------------------------------------------:|:---------------------------------------:|:-----------------:|
|      language       |    语言     |  enum   |                                     'sc' / 'tc' / 'jp' / 'kr' / 'en' / 'astral'                                     |    简体中文 / 繁体中文 / 日文 / 韩文 / 英文 / 星光界文    |       'sc'        |
|        font         |    字体     |  enum   |                                             '' / 'custom1' / 'custom2'                                              |          默认 / 华康隶书体 / 文鼎中粗隶简繁           |        ''         |
|        name         |    卡名     | string  |                                                          —                                                          |                    —                    |        ''         |
|        color        |   卡名颜色    | string  |                                                          —                                                          |                    —                    |        ''         |
|        align        |   卡名对齐    |  enum   |                                             'left' / 'center' / 'right'                                             |             左对齐 / 居中 / 右对齐              |      'left'       |
|      gradient       |  卡名是否渐变色  | boolean |                                                          —                                                          |                    —                    |       false       |
|   gradientColor1    |   渐变色 1   | string  |                                                          —                                                          |                    —                    |     '#999999'     |
|   gradientColor2    |   渐变色 2   | string  |                                                          —                                                          |                    —                    |     '#ffffff'     |
|   gradientPreset    |   渐变色预设   |  enum   |                          'silver' / 'gold' / 'red' / 'white' / 'black' / 'blue' / 'green'                           |    银字 / 金字 / 红字 / 白字 / 黑字 / 蓝字 / 绿字     |     'silver'      |
|        type         |    类型     |  enum   |                                      'monster' / 'spell' / 'trap' / 'pendulum'                                      |            怪兽 / 魔法 / 陷阱 / 灵摆            |     'monster'     |
|      attribute      |    属性     |  enum   |                       'dark' / 'light' / 'earth' / 'water' / 'fire' / 'wind' / 'divine' / ''                        |      暗 / 光 / 地 / 水 / 炎 / 风 / 神 / 无      |      'dark'       |
|        icon         |   魔陷图标    |  enum   |                       'equip' / 'filed' / 'quick-play' / 'ritual' / 'continuous' / 'counter'                        |       装备 / 场地 / 速攻 / 仪式 / 永续 / 反击       |        ''         |
|        image        |   中间卡图    | string  |                                                          —                                                          |                    —                    |        ''         |
|      cardType       |   卡片类型    |  enum   |                  'normal' / 'effect' / 'ritual' / 'fusion' / 'synchro' / 'xyz' / 'link' / 'token'                   | 通常 / 效果 / 仪式 / 融合 / 同调 / 超量 / 连接 / 衍生物  |     'normal'      |
|    pendulumType     |   灵摆类型    |  enum   | 'normal-pendulum' / 'effect-pendulum' / 'ritual-pendulum' / 'fusion-pendulum' / 'synchro-pendulum' / 'xyz-pendulum' | 通常灵摆 / 效果灵摆 / 仪式灵摆 / 融合灵摆 / 同调灵摆 / 超量灵摆 | 'normal-pendulum' |
|        level        |    等级     | number  |                                                          —                                                          |                    —                    |         0         |
|        rank         |    阶级     | number  |                                                          —                                                          |                    —                    |         0         |
|    pendulumScale    |   灵摆刻度    | number  |                                                          —                                                          |                    —                    |         0         |
| pendulumDescription |   灵摆效果    | string  |                                                          —                                                          |                    —                    |        ''         |
|     monsterType     |   怪兽类型    | string  |                                                          —                                                          |                    —                    |        ''         |
|         atk         |    攻击力    | number  |                                                          —                                                          |                    —                    |         0         |
|         def         |    防御力    | number  |                                                          —                                                          |                    —                    |         0         |
|      arrowList      |   连接箭头    |  array  |                                              [1, 2, 3, 4, 5, 6, 7, 8]                                               |      [上, 右上, 右, 右下, 下, 左下, 左, 左上]       |        []         |
|     description     |   效果描述    | string  |                                                          —                                                          |                    —                    |        ''         |
|  firstLineCompress  |  是否首行压缩   | boolean |                                                          —                                                          |                    —                    |       false       |
|  descriptionAlign   | 是否效果描述居中  | boolean |                                                          —                                                          |                    —                    |       false       |
|   descriptionZoom   |  效果描述缩放   | number  |                                                          —                                                          |                    —                    |         1         |
|  descriptionWeight  |  效果描述字重   | number  |                                                          —                                                          |                    —                    |         0         |
|       package       |    卡包     | string  |                                                          —                                                          |                    —                    |         ''         |
|      password       |   卡片密码    | string  |                                                          —                                                          |                    —                    |         ''         |
|      copyright      |    版权     |  enum   |                                                 'sc' / 'jp' / 'en'                                                  |             简体中文 / 日文 / 英文              |         ''         |
|        laser        |    角标     |  enum   |                                      'laser1' / 'laser2' / 'laser3' / 'laser4'                                      |          样式一 / 样式二 / 样式三 / 样式四          |         ''         |
|        rare         |    罕贵     |  enum   |                                 'dt' / 'ur' / 'gr' / 'hr' / 'ser' / 'gser' / 'pser'                                 |  DT / UR / GR / HR / SER / GSER / PSER  |        ''         |
|      twentieth      | 是否是 20 周年 | boolean |                                                          —                                                          |                    —                    |         false         |
|       radius        |   是否是圆角   | boolean |                                                          —                                                          |                    —                    |         true         |
|        scale        |   卡片缩放    | number  |                                                          —                                                          |                    —                    |         1         |

## TODO

## 🔎示例代码

[示例代码](src/components/YugiohCard.vue)
