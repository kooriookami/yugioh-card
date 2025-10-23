import http from 'http';
import { YugiohCard } from 'yugioh-card';
import yugiohDemo from '@/assets/demo/yugioh-demo';

http.createServer((req, res) => {
  const card = new YugiohCard({
    data: yugiohDemo,
    resourcePath: 'E:/project/yugioh-card/src/assets/yugioh-card', // 静态资源路径，把 src/assets/yugioh-card 文件夹复制到你的项目中或者服务器上
  });
  card.leafer.export('png', {
    screenshot: true,
  }).then(function (result) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(`<img src="${result.data}" />`);
    res.end();
  });
}).listen(3000, function () {
  console.log('server is running at http://localhost:3000');
});
