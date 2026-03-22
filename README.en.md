<h1 align="center">🎉 Yu-Gi-Oh! Card - Yugioh Card 🎉</h1>

<div align="center">
  <p><a href="./README.md">简体中文</a> | English</p>
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

<p align="center">A tool for rendering Yu-Gi-Oh! cards using Canvas</p>

<p align="center">
  <img src="src/assets/image/banner.jpg">
</p>

Currently there are 5 types of cards: 🚀🚀🚀🚀🚀

- 1️⃣ Yu-Gi-Oh!
- 2️⃣ Rush Duel
- 3️⃣ Yu-Gi-Oh! Card Back
- 4️⃣ Field Center Card
- 5️⃣ Yu-Gi-Oh! Series 2

## 🫡 Special Thanks

- [LeaferJS](https://www.leaferjs.com/) for the powerful graphics rendering capabilities
- [白羽幸鳥](https://tieba.baidu.com/home/main?id=tb.1.d6c63ffd.3YV5T6Q9Z7uIeVVhPlo8hg%3Ft%3D1654573649) for providing high-resolution card templates

## 🚩 Online Demo

[Online Demo](https://kooriookami.github.io/yugioh-card/)

## ⚡ Quick Start

Requirements: Node.js 22+ and pnpm.

`pnpm add yugioh-card`

### Workspace Development

```bash
# Node.js 22+
pnpm install
pnpm dev
pnpm build
pnpm build:lib
```

### Browser

```js
// Optional: YugiohCard, RushDuelCard, YugiohBackCard, FieldCenterCard, YugiohSeries2Card
import { YugiohCard } from 'yugioh-card';

const card = new YugiohCard({
  view: 'xxx', // div container
  data: {
    ..., // see Data properties below
  },
  resourcePath: 'xxx', // path to static resources, copy src/assets/yugioh-card folder to your project or server
});

// Export image, for more export options refer to https://www.leaferjs.com/ui/guide/basic/export.html
card.leafer.export('xxx.png', {
  screenshot: true,
  pixelRatio: devicePixelRatio,
});
```

### Node.js

Before running the Node.js example, make sure your local Node.js version is 22 or higher.

`pnpm add skia-canvas@2`

```js
import http from 'http';
import skia from 'skia-canvas';
import { YugiohCard } from 'yugioh-card';

http.createServer((req, res) => {
  const card = new YugiohCard({
    data: {
      ..., // see Data properties below
    },
    resourcePath: 'xxx', // path to static resources, copy src/assets/yugioh-card folder to your project or server
    skia: skia,
  });
  card.leafer.export('png', {
    screenshot: true,
  }).then(result => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(`<img src="${result.data}" />`);
    res.end();
  });
}).listen(3000, () => {
    console.log('server is running at http://localhost:3000');
});
```

## 🔎 Example Code

[Example Code](src/components/YugiohCard.vue)

## 📖 Data Properties

### Yu-Gi-Oh!

|    Property Name    |        Description        |  Type   |                                                       Options                                                       |                                                  Notes                                                  |      Default      |
|:-------------------:|:-------------------------:|:-------:|:-------------------------------------------------------------------------------------------------------------------:|:-------------------------------------------------------------------------------------------------------:|:-----------------:|
|      language       |         Language          |  enum   |                                     'sc' / 'tc' / 'jp' / 'kr' / 'en' / 'astral'                                     |             Simplified Chinese / Traditional Chinese / Japanese / Korean / English / Astral             |       'sc'        |
|        font         |           Font            |  enum   |                                             '' / 'custom1' / 'custom2'                                              |                                      Default / Custom 1 / Custom 2                                      |        ''         |
|        name         |         Card Name         | string  |                                                          —                                                          |                                                    —                                                    |        ''         |
|        color        |      Card Name Color      | string  |                                                          —                                                          |                                                    —                                                    |        ''         |
|        align        |    Card Name Alignment    |  enum   |                                             'left' / 'center' / 'right'                                             |                                          Left / Center / Right                                          |      'left'       |
|      gradient       | Whether Name Has Gradient | boolean |                                                          —                                                          |                                                    —                                                    |       false       |
|   gradientColor1    |     Gradient Color 1      | string  |                                                          —                                                          |                                                    —                                                    |     '#999999'     |
|   gradientColor2    |     Gradient Color 2      | string  |                                                          —                                                          |                                                    —                                                    |     '#ffffff'     |
|        type         |           Type            |  enum   |                                      'monster' / 'spell' / 'trap' / 'pendulum'                                      |                                    Monster / Spell / Trap / Pendulum                                    |     'monster'     |
|      attribute      |         Attribute         |  enum   |                       'dark' / 'light' / 'earth' / 'water' / 'fire' / 'wind' / 'divine' / ''                        |                       Dark / Light / Earth / Water / Fire / Wind / Divine / None                        |      'dark'       |
|        icon         |      Spell/Trap Icon      |  enum   |                       'equip' / 'field' / 'quick-play' / 'ritual' / 'continuous' / 'counter'                        |                       Equip / Field / Quick-Play / Ritual / Continuous / Counter                        |        ''         |
|        image        |       Center Image        | string  |                                                          —                                                          |                                                    —                                                    |        ''         |
|      cardType       |         Card Type         |  enum   |                  'normal' / 'effect' / 'ritual' / 'fusion' / 'synchro' / 'xyz' / 'link' / 'token'                   |                    Normal / Effect / Ritual / Fusion / Synchro / XYZ / Link / Token                     |     'normal'      |
|    pendulumType     |       Pendulum Type       |  enum   | 'normal-pendulum' / 'effect-pendulum' / 'ritual-pendulum' / 'fusion-pendulum' / 'synchro-pendulum' / 'xyz-pendulum' | Normal Pendulum / Effect Pendulum / Ritual Pendulum / Fusion Pendulum / Synchro Pendulum / XYZ Pendulum | 'normal-pendulum' |
|        level        |           Level           | number  |                                                          —                                                          |                                                    —                                                    |         0         |
|        rank         |           Rank            | number  |                                                          —                                                          |                                                    —                                                    |         0         |
|    pendulumScale    |      Pendulum Scale       | number  |                                                          —                                                          |                                                    —                                                    |         0         |
| pendulumDescription |      Pendulum Effect      | string  |                                                          —                                                          |                                                    —                                                    |        ''         |
|     monsterType     |       Monster Type        | string  |                                                          —                                                          |                                                    —                                                    |        ''         |
|       atkBar        |     Show ATK/DEF Bar      | boolean |                                                          —                                                          |                                                    —                                                    |       true        |
|         atk         |            ATK            | number  |                                                          —                                                          |                                               ?：-1, ∞：-2                                                |         0         |
|         def         |            DEF            | number  |                                                          —                                                          |                                               ?：-1, ∞：-2                                                |         0         |
|      arrowList      |        Link Arrows        |  array  |                                                  [1,2,3,4,5,6,7,8]                                                  |               [Top, Top-Right, Right, Bottom-Right, Bottom, Bottom-Left, Left, Top-Left]                |        []         |
|     description     |    Effect Description     | string  |                                                          —                                                          |                                                    —                                                    |        ''         |
|  firstLineCompress  |    Compress First Line    | boolean |                                                          —                                                          |                                                    —                                                    |       false       |
|  descriptionAlign   |    Center Effect Text     | boolean |                                                          —                                                          |                                                    —                                                    |       false       |
|   descriptionZoom   |     Effect Text Zoom      | number  |                                                          —                                                          |                                                    —                                                    |         1         |
|  descriptionWeight  |    Effect Text Weight     | number  |                                                          —                                                          |                                                    —                                                    |         0         |
|       package       |         Card Pack         | string  |                                                          —                                                          |                                                    —                                                    |        ''         |
|      password       |       Card Password       | string  |                                                          —                                                          |                                                    —                                                    |        ''         |
|      copyright      |         Copyright         |  enum   |                                                 'sc' / 'jp' / 'en'                                                  |                                 Simplified Chinese / Japanese / English                                 |        ''         |
|        laser        |        Laser Mark         |  enum   |                                      'laser1' / 'laser2' / 'laser3' / 'laser4'                                      |                                  Style 1 / Style 2 / Style 3 / Style 4                                  |        ''         |
|        rare         |          Rarity           |  enum   |                                 'dt' / 'ur' / 'gr' / 'hr' / 'ser' / 'gser' / 'pser'                                 |                                  DT / UR / GR / HR / SER / GSER / PSER                                  |        ''         |
|      twentieth      |     20th Anniversary      | boolean |                                                          —                                                          |                                                    —                                                    |       false       |
|       radius        |      Rounded Corners      | boolean |                                                          —                                                          |                                                    —                                                    |       true        |
|        scale        |        Card Scale         | number  |                                                          —                                                          |                                                    —                                                    |         1         |

### Rush Duel

|   Property Name   |     Description     |  Type   |                                Options                                 |                           Notes                            |  Default  |
|:-----------------:|:-------------------:|:-------:|:----------------------------------------------------------------------:|:----------------------------------------------------------:|:---------:|
|     language      |      Language       |  enum   |                              'sc' / 'jp'                               |               Simplified Chinese / Japanese                |   'sc'    |
|       name        |      Card Name      | string  |                                   —                                    |                             —                              |    ''     |
|       color       |   Card Name Color   | string  |                                   —                                    |                             —                              |    ''     |
|       type        |        Type         |  enum   |                      'monster' / 'spell' / 'trap'                      |                   Monster / Spell / Trap                   | 'monster' |
|     attribute     |      Attribute      |  enum   | 'dark' / 'light' / 'earth' / 'water' / 'fire' / 'wind' / 'divine' / '' | Dark / Light / Earth / Water / Fire / Wind / Divine / None |  'dark'   |
|       icon        |   Spell/Trap Icon   |  enum   | 'equip' / 'field' / 'quick-play' / 'ritual' / 'continuous' / 'counter' | Equip / Field / Quick-Play / Ritual / Continuous / Counter |    ''     |
|       image       |    Center Image     | string  |                                   —                                    |                             —                              |    ''     |
|     cardType      |      Card Type      |  enum   |               'normal' / 'effect' / 'ritual' / 'fusion'                |             Normal / Effect / Ritual / Fusion              | 'normal'  |
|       level       |        Level        | number  |                                   —                                    |                             —                              |     0     |
|    monsterType    |    Monster Type     | string  |                                   —                                    |                             —                              |    ''     |
|    maximumAtk     |     Maximum ATK     | number  |                                   —                                    |                             —                              |     0     |
|        atk        |         ATK         | number  |                                   —                                    |                            ?：-1                            |     0     |
|        def        |         DEF         | number  |                                   —                                    |                            ?：-1                            |     0     |
|    description    | Effect Description  | string  |                                   —                                    |                             —                              |    ''     |
| firstLineCompress | Compress First Line | boolean |                                   —                                    |                             —                              |   false   |
| descriptionAlign  | Center Effect Text  | boolean |                                   —                                    |                             —                              |   false   |
|  descriptionZoom  |  Effect Text Zoom   | number  |                                   —                                    |                             —                              |     1     |
| descriptionWeight | Effect Text Weight  | number  |                                   —                                    |                             —                              |     0     |
|      package      |      Card Pack      | string  |                                   —                                    |                             —                              |    ''     |
|     password      |    Card Password    | string  |                                   —                                    |                             —                              |    ''     |
|      legend       |      Legendary      | boolean |                                   —                                    |                             —                              |   false   |
|       laser       |     Laser Mark      |  enum   |               'laser1' / 'laser2' / 'laser3' / 'laser4'                |           Style 1 / Style 2 / Style 3 / Style 4            |    ''     |
|       rare        |       Rarity        |  enum   |                          'sr' / 'rr' / 'pser'                          |                       SR / RR / PSER                       |    ''     |
|      radius       |   Rounded Corners   | boolean |                                   —                                    |                             —                              |   true    |
|       scale       |     Card Scale      | number  |                                   —                                    |                             —                              |     1     |

### Yu-Gi-Oh! Card Back

| Property Name |   Description   |  Type   |                         Options                         |                      Notes                      | Default  |
|:-------------:|:---------------:|:-------:|:-------------------------------------------------------:|:-----------------------------------------------:|:--------:|
|     type      | Card Back Type  |  enum   | 'normal' / 'tormentor' / 'sky-dragon' / 'winged-dragon' | Normal / Tormentor / Sky Dragon / Winged Dragon | 'normal' |
|     logo      |      Logo       |  enum   |                  'ocg' / 'tcg' / 'rd'                   |                 OCG / TCG / RD                  |  'ocg'   |
|    konami     |   Show K mark   | boolean |                            —                            |                        —                        |   true   |
|   register    |   Show R mark   | boolean |                            —                            |                        —                        |   true   |
|    radius     | Rounded Corners | boolean |                            —                            |                        —                        |   true   |
|     scale     |   Card Scale    | number  |                            —                            |                        —                        |    1     |

### Field Center Card

| Property Name |   Description   |  Type   | Options | Notes | Default |
|:-------------:|:---------------:|:-------:|:-------:|:-----:|:-------:|
|     image     |   Field Image   | string  |    —    |   —   |   ''    |
|   cardBack    |  Is Card Back   | boolean |    —    |   —   |  false  |
|    radius     | Rounded Corners | boolean |    —    |   —   |  true   |
|     scale     |   Card Scale    | number  |    —    |   —   |    1    |

### Yu-Gi-Oh! Series 2

|   Property Name   |        Description        |  Type   |                                         Options                                          |                                   Notes                                    |  Default  |
|:-----------------:|:-------------------------:|:-------:|:----------------------------------------------------------------------------------------:|:--------------------------------------------------------------------------:|:---------:|
|     language      |         Language          |  enum   |                                           'jp'                                           |                                  Japanese                                  |   'jp'    |
|       font        |           Font            |  enum   |                                '' / 'custom1' / 'custom2'                                |                       Default / Custom 1 / Custom 2                        |    ''     |
|       name        |         Card Name         | string  |                                            —                                             |                                     —                                      |    ''     |
|       color       |      Card Name Color      | string  |                                            —                                             |                                     —                                      |    ''     |
|       align       |    Card Name Alignment    |  enum   |                               'left' / 'center' / 'right'                                |                           Left / Center / Right                            |  'left'   |
|     gradient      | Whether Name Has Gradient | boolean |                                            —                                             |                                     —                                      |   false   |
|  gradientColor1   |     Gradient Color 1      | string  |                                            —                                             |                                     —                                      | '#999999' |
|  gradientColor2   |     Gradient Color 2      | string  |                                            —                                             |                                     —                                      | '#ffffff' |
|       type        |           Type            |  enum   |                               'monster' / 'spell' / 'trap'                               |                           Monster / Spell / Trap                           | 'monster' |
|     attribute     |         Attribute         |  enum   |          'dark' / 'light' / 'earth' / 'water' / 'fire' / 'wind' / 'divine' / ''          |         Dark / Light / Earth / Water / Fire / Wind / Divine / None         |  'dark'   |
|       icon        |      Spell/Trap Icon      |  enum   |          'equip' / 'field' / 'quick-play' / 'ritual' / 'continuous' / 'counter'          |         Equip / Field / Quick-Play / Ritual / Continuous / Counter         |    ''     |
|       image       |       Center Image        | string  |                                            —                                             |                                     —                                      |    ''     |
|     cardType      |         Card Type         |  enum   | 'normal' / 'effect' / 'ritual' / 'fusion' / 'tormentor' / 'sky-dragon' / 'winged-dragon' | Normal / Effect / Ritual / Fusion / Tormentor / Sky Dragon / Winged Dragon | 'normal'  |
|       level       |           Level           | number  |                                            —                                             |                                     —                                      |     0     |
|    monsterType    |       Monster Type        | string  |                                            —                                             |                                     —                                      |    ''     |
|        atk        |            ATK            | number  |                                            —                                             |                              ????：-1, X000：-2                              |     0     |
|        def        |            DEF            | number  |                                            —                                             |                              ????：-1, X000：-2                              |     0     |
|    description    |    Effect Description     | string  |                                            —                                             |                                     —                                      |    ''     |
| firstLineCompress |    Compress First Line    | boolean |                                            —                                             |                                     —                                      |   false   |
| descriptionAlign  |    Center Effect Text     | boolean |                                            —                                             |                                     —                                      |   false   |
|  descriptionZoom  |     Effect Text Zoom      | number  |                                            —                                             |                                     —                                      |     1     |
| descriptionWeight |    Effect Text Weight     | number  |                                            —                                             |                                     —                                      |     0     |
|      package      |         Card Pack         | string  |                                            —                                             |                                     —                                      |    ''     |
|     password      |       Card Password       | string  |                                            —                                             |                                     —                                      |    ''     |
|     copyright     |         Copyright         |  enum   |                                           'jp'                                           |                                  Japanese                                  |    ''     |
|       laser       |        Laser Mark         |  enum   |                        'laser1' / 'laser2' / 'laser3' / 'laser4'                         |                   Style 1 / Style 2 / Style 3 / Style 4                    |    ''     |
|      radius       |      Rounded Corners      | boolean |                                            —                                             |                                     —                                      |   true    |
|       scale       |        Card Scale         | number  |                                            —                                             |                                     —                                      |     1     |
