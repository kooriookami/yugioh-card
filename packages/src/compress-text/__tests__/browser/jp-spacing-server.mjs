import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

export const jpSpacingTestFixtures = () => {
  let release;
  let gate;
  const reports = Object.create(null);
  const reset = () => {
    release?.();
    gate = new Promise(resolve => { release = resolve; });
  };
  reset();

  return {
    name: 'jp-spacing-verification',
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        if (url.pathname === '/jp-test-reset') {
          reset();
          res.end('reset');
          return;
        }
        if (url.pathname === '/jp-test-release') {
          release();
          res.end('released');
          return;
        }
        if (url.pathname === '/jp-test-report') {
          if (req.method === 'POST') {
            let body = '';
            for await (const chunk of req) body += chunk;
            reports[url.searchParams.get('mode') || 'source'] = JSON.parse(body);
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(reports));
          return;
        }
        const prefix = '/jp-resources/';
        if (url.pathname.startsWith(prefix)) {
          if (url.pathname.endsWith('/font/ygo-jp.woff2')) await gate;
          const file = url.pathname.slice(prefix.length);
          req.url = `/src/assets/yugioh-card/${file}${url.search}`;
        }
        next();
      });
    },
  };
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await createServer({
    server: { host: '127.0.0.1', port: 5178, strictPort: true },
    plugins: [jpSpacingTestFixtures()],
  });
  await server.listen();
  server.printUrls();
  console.log('/packages/src/compress-text/__tests__/browser/jp-spacing.html');
}
