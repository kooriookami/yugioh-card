// 固定与当前渲染器配套的静态资源版本。
export const resourcePath = import.meta.env.PROD
  ? 'https://raw.githubusercontent.com/kooriookami/yugioh-card/d7f362f5184ac3da1e3ae0ac71f50ac4f53f58d1/src/assets/yugioh-card'
  : '/src/assets/yugioh-card';
