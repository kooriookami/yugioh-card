import path from 'node:path';
import { createServer } from 'vite';

let release;
let gate;
const reports = {};
const reset = () => {
  release?.();
  gate = new Promise(resolve => { release = resolve; });
};
reset();
const server = await createServer({
  root: process.cwd(),
  server: { host: '127.0.0.1', port: 5178, strictPort: true },
  plugins: [{
    name: 'jp-spacing-verification',
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        if (url.pathname === '/jp-test-reset') {
          reset(); res.end('reset'); return;
        }
        if (url.pathname === '/jp-test-release') {
          release(); res.end('released'); return;
        }
        if (url.pathname === '/jp-test-report') {
          if (req.method === 'POST') {
            let body = '';
            for await (const chunk of req) body += chunk;
            reports[url.searchParams.get('mode') || 'source'] = JSON.parse(body);
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(reports)); return;
        }
        if (url.pathname.endsWith('/font/ygo-jp.woff2')) await gate;
        next();
      });
    },
  }],
});
await server.listen();
server.printUrls();
console.log(`Verify ${path.basename(process.cwd())}: /packages/src/compress-text/__tests__/browser/jp-spacing.html`);
