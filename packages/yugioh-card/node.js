import http from 'http';
import { Leafer, Rect, useCanvas } from 'leafer-unified';
import skia from 'skia-canvas';

useCanvas('skia', skia); // must

http.createServer(function (req, res) {

  const leafer = new Leafer({ width: 800, height: 600 });
  leafer.add(Rect.one({ fill: '#32cd79' }, 100, 100));

  leafer.export('jpg').then(function (result) {
    console.log(result);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(`<img src="${result.data}" />`);
    res.end();
  });

}).listen(3000, function () {
  console.log('server is running at http://localhost:3000');
});
