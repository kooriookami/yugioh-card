import path from 'node:path';
import fs from 'node:fs/promises';
import { createServer } from 'vite';

const root = process.cwd();
const gates = new Map();
const counts = {};
let retry = false;
const reset = () => {
  for (const gate of gates.values()) gate.release();
  for (const key of Object.keys(counts)) delete counts[key];
  retry = false;
  for (const name of ['manifest', 'fonts', 'photo']) {
    let release;
    const promise = new Promise(resolve => { release = resolve; });
    gates.set(name, { promise, release });
  }
};
reset();
const server = await createServer({
  root,
  server: { host: '127.0.0.1', port: 5175, strictPort: true },
  plugins: [{
    name: 'controlled-card-resources',
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://127.0.0.1');
        if (url.pathname.startsWith('/ready-test/')) res.setHeader('Access-Control-Allow-Origin', '*');
        if (url.pathname === '/ready-test/reset') {
          reset();
          res.end('ok');
          return;
        }
        if (url.pathname === '/ready-fixture') {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(await vite.transformIndexHtml('/ready-fixture', await fs.readFile(path.join(import.meta.dirname, 'index.html'), 'utf8')));
          return;
        }
        if (url.pathname === '/export-fixture') {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(await vite.transformIndexHtml('/export-fixture', await fs.readFile(path.join(root, 'src/components/__tests__/browser/export.html'), 'utf8')));
          return;
        }
        if (url.pathname.startsWith('/ready-test/release/')) {
          const name = url.pathname.split('/').at(-1);
          if (name === 'retry') retry = true;
          else gates.get(name).release();
          res.end('ok');
          return;
        }
        if (url.pathname === '/ready-test/counts') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(counts));
          return;
        }
        if (/^\/src\/assets\/yugioh-card\/.+\/font\/font-list\.json$/.test(url.pathname)) {
          await gates.get('manifest').promise;
          return next();
        }
        if (!url.pathname.startsWith('/ready-resources/')) return next();
        const file = url.pathname.slice('/ready-resources/'.length);
        counts[file] = (counts[file] || 0) + 1;
        if (file.endsWith('font-list.json')) await gates.get('manifest').promise;
        if (file.endsWith('.woff2')) await gates.get('fonts').promise;
        if (file === 'photo.jpg') await gates.get('photo').promise;
        if (file === 'yugioh/font/ygo-kr.woff2' || (file === 'retry.jpg' && !retry)) {
          res.writeHead(404);
          res.end('Intentional failure');
          return;
        }
        try {
          const target = file.endsWith('.jpg') ? path.join(root, 'src/assets/image/blue-eyes.jpg') : path.join(root, 'src/assets/yugioh-card', file);
          const types = { '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };
          res.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
          res.setHeader('Cache-Control', 'no-store');
          res.end(await fs.readFile(target));
        } catch (error) {
          res.writeHead(404);
          res.end(error.message);
        }
      });
    },
  }],
});
await server.listen();
server.printUrls();
