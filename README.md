
![img.png](https://github.com/pf666nb/My-LeetCode/blob/main/img.png)
[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&pause=1000&width=435&lines=%E4%B8%80%E4%B8%AA%E4%BD%BF%E7%94%A8+Canvas+%E6%B8%B2%E6%9F%93%E6%B8%B8%E6%88%8F%E7%8E%8B%E5%8D%A1%E7%89%87%E7%9A%84%E5%B7%A5%E5%85%B7%E3%80%82)](https://git.io/typing-svg)</p>
![Static Badge](https://img.shields.io/badge/release-0.0.1-blue)
![Static Badge](https://img.shields.io/badge/start-3-yellow)
目前有 5 种卡片：🌹🌹🌹🌹🌹

 1️⃣  游戏王 </p>
 2️⃣  超速决斗 </p>
 3️⃣  游戏王卡背 </p>
 4️⃣  场地中心卡 </p>
 5️⃣  游戏王 2 期 </p>

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
```例子demo :src/assets/demo/yugioh-demo.js```
```js
export default {
  language: 'sc',  //语言选项
  font: '',  //使用的字体
  name: '青眼白龙', //卡名
  color: '', //
  align: 'left', //对齐位置
  gradient: false, //是否渐变 ---卡名
  gradientColor1: '#999999', //渐变色1
  gradientColor2: '#ffffff', //渐变色2
  gradientPreset: 'silver', // 渐变预设
  type: 'monster', //卡片类型
  attribute: 'light', //卡片属性
  icon: '', //卡片图标
  image: blueEyes, //中心卡图
  cardType: 'normal', //卡类
  pendulumType: 'normal-pendulum', //灵摆卡特有的选项
  level: 8, //等级
  rank: 0, //阶级
  pendulumScale: 0,//灵摆刻度
  pendulumDescription: '', //灵摆效果
  monsterType: '龙族/通常', //怪兽类型
  atk: 3000, //攻击力
  def: 2500, //防御力
  arrowList: [], //link箭头
  description: '以高攻击力著称的传说之龙。任何对手都能将之粉碎，其破坏力不可估量。',
  firstLineCompress: false, //是否首行压缩
  descriptionAlign: false,//是否文本居中
  descriptionZoom: 1,//字号
  descriptionWeight: 0,//字重
  package: 'SD25-SC001',//卡包
  password: '89631139',//卡密
  copyright: '',//版权
  laser: '',//角标
  rare: '',//罕贵程度
  twentieth: false, //是否是20周年
  radius: true, //圆角
  scale: 1, //缩放
};
```
## ⚠️参数事项




|       参数       |  说明  |   类型   |                                                        可选参数                                                        |                                  备注                                   |
|:--------------:|:----:|:------:|:------------------------------------------------------------------------------------------------------------------:|:---------------------------------------------------------------------:|
|  pendulumType  | 灵摆类型 | string | normal-pendulum<br/>effect-pendulum <br/>ritual-pendulum<br/>fusion-pendulum<br/>synchro-pendulum<br/>xyz-pendulum | 通常 / 灵摆 <br/> 效果 / 灵摆<br/>仪式 / 灵摆<br/>融合 / 灵摆<br/>同调 / 灵摆<br/>超量 / 灵摆 |
|    cardType    | 卡片类型 | string |                  normal<br/> effect<br/>ritual<br/>fusion<br/>synchro<br/>xyz<br/>link<br/>token                   |        通常<br/>效果<br/> 仪式<br/>融合 <br/>同调<br/>超量<br/>连接<br/>衍生物         |
|      icon      | 卡片图标 | string |                      equip<br/>filed<br/> quick-play<br/> ritual<br/> continuous<br/> counter                      |                装备<br/>场地<br/>速攻<br/>仪式<br/>  永续<br/>反击                |
|   attribute    |  属性  | string |                      dark  <br/>light<br/>earth<br/>water<br/>fire<br/>wind<br/>divine<br/>""                      |             暗<br/> 光<br/>地<br/>水<br/> 炎<br/>风<br/>神<br/>无             |
|      type      |  卡类  | string |                                      monster<br/>spell<br/>trap<br/>pendulum                                       |                        怪兽<br/>魔法<br/>陷阱<br/>灵摆                        |
| gradientPreset | 预设字体 | string |                           silver<br/>gold<br/>red<br/>white<br/>black<br/>blue<br/>green                           |             银字<br/>金字<br/>红字<br/>白字<br/>黑字<br/>蓝字<br/>绿字              |
|    language    |  语言  | string |                                     sc<br/>tc<br/>jp<br/>kr<br/>en<br/>astral                                      |              简体中文<br/>繁体中文<br/>日文<br/>韩文<br/>英文<br/>星光界文              |

## TODO


## 🔎示例代码

[示例代码](src/components/YugiohCard.vue)
