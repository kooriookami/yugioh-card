import http from 'http';
import path from 'path';
import { YugiohCard } from 'yugioh-card';
import skia from 'skia-canvas';
import yugiohDemo from '@/assets/demo/yugioh-demo';

if (global.__server__) {
  global.__server__.close();
}

global.__server__ = http.createServer((req, res) => {
  const card = new YugiohCard({
    data: yugiohDemo,
    resourcePath: path.resolve('./src/assets/yugioh-card'),
    skia: skia,
  });
  card.leafer.export('png', {
    screenshot: true,
  }).then(result => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(`<img src="${result.data}" />`);
    res.end();
  });
});

global.__server__.listen(3000, () => {
  console.log('server is running at http://localhost:3000');
});
