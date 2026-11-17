import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const directory = path.resolve('node_modules/.cache/layout-perf');
const reports = {};
const server = await createServer({
  root: process.cwd(),
  cacheDir: `${directory}/vite`,
  server: { host: '127.0.0.1', port: 5182, strictPort: true, hmr: false },
  plugins: [{
    name: 'layout-equivalence',
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        if (!['/layout-report', '/layout-error', '/layout-image'].includes(url.pathname)) { next(); return; }
        const mode = url.searchParams.get('mode');
        if (req.method === 'POST') {
          if (!/^[a-z-]+$/.test(mode || '')) { res.statusCode = 400; res.end(); return; }
          const chunks = []; for await (const part of req) chunks.push(part);
          const body = Buffer.concat(chunks).toString('utf8');
          if (url.pathname === '/layout-image') {
            const label = url.searchParams.get('label');
            if (!/^[\w-]+$/.test(label || '')) { res.statusCode = 400; res.end(); return; }
            await fs.writeFile(`${directory}/browser-${mode}-${label}.png`, Buffer.from(body.slice(body.indexOf(',') + 1), 'base64'));
            res.end('{}'); return;
          }
          const output = JSON.parse(body);
          if (url.pathname === '/layout-error') reports[mode] = { ok: false, ...output };
          else {
            await fs.writeFile(`${directory}/browser-${mode}.json`, JSON.stringify(output));
            try {
              if (mode !== 'baseline') {
                const baseline = JSON.parse(await fs.readFile(`${directory}/browser-baseline.json`, 'utf8'));
                assert.deepEqual(output, baseline);
              }
              reports[mode] = { ok: true, text: output.text.length, updates: output.updates.reduce((sum, list) => sum + list.length, 0), batch: output.batch.length, classes: output.classes.length };
            } catch (error) {
              // 输出完整快照留在文件中，界面只显示便于定位的短错误。
              reports[mode] = { ok: false, error: error.message.slice(0, 3000) };
            }
          }
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(req.method === 'POST' ? reports[mode] : reports));
      });
    },
  }],
});
await server.listen(); server.printUrls();
