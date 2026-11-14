import http from 'http';
import { fileURLToPath } from 'node:url';
import { YugiohCard } from 'yugioh-card';
import skia from 'skia-canvas';
import yugiohDemo from '@/assets/demo/yugioh-demo';

const resourcePath = fileURLToPath(new URL('./assets/yugioh-card', import.meta.url));
const imagePath = fileURLToPath(new URL('./assets/image/blue-eyes.jpg', import.meta.url));

if (global.__server__) {
  global.__server__.close();
}

global.__server__ = http.createServer(async (req, res) => {
  let card;
  try {
    card = new YugiohCard({
      data: {
        ...yugiohDemo,
        // Vite 的图片 import 返回浏览器 URL，Node 渲染需要本地文件路径。
        image: imagePath,
      },
      resourcePath,
      skia: skia,
    });
    await card.ready;
    const result = await card.leafer.export('png', {
      screenshot: true,
    });
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<img src="${result.data}" />`);
  } catch (error) {
    console.error(error);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('卡片渲染失败');
  } finally {
    card?.leafer.destroy(true);
  }
});

global.__server__.listen(Number(process.env.PORT ?? 3000), () => {
  const { port } = global.__server__.address();
  console.log(`server is running at http://localhost:${port}`);
});
