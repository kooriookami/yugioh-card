import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const makeGates = names => {
  const gates = new Map();
  const reset = () => {
    for (const gate of gates.values()) gate.release();
    for (const name of names) {
      let release;
      const promise = new Promise(resolve => { release = resolve; });
      gates.set(name, { promise, release });
    }
  };
  reset();
  return { gates, reset };
};

export const cardTestFixtures = () => {
  const ready = makeGates(['manifest', 'fonts', 'photo']);
  const exportFixture = makeGates(['manifest']);
  const counts = Object.create(null);
  let retry = false;

  return {
    name: 'controlled-card-resources',
    configureServer(vite) {
      const root = vite.config.root;
      const assetRoot = path.join(root, 'src/assets/yugioh-card');
      const pages = new Map([
        ['/ready-fixture', path.join(import.meta.dirname, 'index.html')],
        ['/export-fixture', path.join(root, 'src/components/__tests__/browser/export.html')],
      ]);

      vite.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://127.0.0.1');
        const page = url.searchParams.has('html-proxy') ? undefined : pages.get(url.pathname);
        if (page) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(await vite.transformIndexHtml(url.pathname, await fs.readFile(page, 'utf8')));
          return;
        }

        if (url.pathname.startsWith('/ready-test/')) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'no-store');
          const fixture = url.searchParams.get('fixture') === 'export' ? exportFixture : ready;
          if (url.pathname === '/ready-test/reset') {
            fixture.reset();
            if (fixture === ready) {
              for (const key of Object.keys(counts)) delete counts[key];
              retry = false;
            }
            res.end('ok');
            return;
          }
          if (url.pathname.startsWith('/ready-test/release/')) {
            const name = url.pathname.split('/').at(-1);
            if (fixture === ready && name === 'retry') retry = true;
            else if (fixture.gates.has(name)) fixture.gates.get(name).release();
            else {
              res.writeHead(400).end('Unknown resource gate');
              return;
            }
            res.end('ok');
            return;
          }
          if (url.pathname === '/ready-test/counts') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(counts));
            return;
          }
        }

        const exportPrefix = '/export-resources/';
        if (url.pathname.startsWith(exportPrefix)) {
          const file = url.pathname.slice(exportPrefix.length);
          if (file.endsWith('font-list.json')) await exportFixture.gates.get('manifest').promise;
          req.url = `/src/assets/yugioh-card/${file}${url.search}`;
          return next();
        }

        const readyPrefix = '/ready-resources/';
        if (!url.pathname.startsWith(readyPrefix)) return next();
        const file = url.pathname.slice(readyPrefix.length);
        counts[file] = (counts[file] || 0) + 1;
        if (file.endsWith('font-list.json')) await ready.gates.get('manifest').promise;
        if (file.endsWith('.woff2')) await ready.gates.get('fonts').promise;
        if (file === 'photo.jpg') await ready.gates.get('photo').promise;
        res.setHeader('Cache-Control', 'no-store');
        if (file === 'yugioh/font/ygo-kr.woff2' || (file === 'retry.jpg' && !retry)) {
          res.writeHead(404).end('Intentional failure');
          return;
        }

        try {
          let target = path.resolve(assetRoot, file);
          if (!target.startsWith(assetRoot + path.sep)) {
            res.writeHead(404).end('Missing fixture asset');
            return;
          }
          if (file.endsWith('.jpg')) target = path.join(root, 'src/assets/image/blue-eyes.jpg');
          const types = { '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };
          res.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
          res.end(await fs.readFile(target));
        } catch {
          res.writeHead(404).end('Missing fixture asset');
        }
      });
    },
  };
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await createServer({
    server: { host: '127.0.0.1', port: 5175, strictPort: true },
    plugins: [cardTestFixtures()],
  });
  await server.listen();
  server.printUrls();
}
