import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { createServer } from 'vite';

export const layoutTestFixtures = () => {
  const reports = Object.create(null);
  return {
    name: 'layout-equivalence',
    configureServer(vite) {
      const directory = path.join(vite.config.root, 'node_modules/.cache/layout-perf');
      vite.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        if (!['/layout-report', '/layout-error', '/layout-image'].includes(url.pathname)) return next();
        const mode = url.searchParams.get('mode');
        const run = url.searchParams.get('run');
        const breaking = run === 'breaking';
        const refactor = run === 'refactor';
        const key = breaking || refactor ? `${run}-${mode}` : mode;
        if (req.method === 'POST') {
          if (!/^[a-z-]+$/.test(mode || '')) {
            res.writeHead(400).end();
            return;
          }
          const chunks = [];
          for await (const part of req) chunks.push(part);
          const body = Buffer.concat(chunks).toString('utf8');
          await fs.mkdir(directory, { recursive: true });
          if (url.pathname === '/layout-image') {
            const label = url.searchParams.get('label');
            if (!/^[\w-]+$/.test(label || '')) {
              res.writeHead(400).end();
              return;
            }
            await fs.writeFile(path.join(directory, `browser-${key}-${label}.png`), Buffer.from(body.slice(body.indexOf(',') + 1), 'base64'));
            res.end('{}');
            return;
          }

          const output = JSON.parse(body);
          if (url.pathname === '/layout-error') {
            reports[key] = { ok: false, ...output };
          } else {
            await fs.writeFile(path.join(directory, `browser-${key}.json`), JSON.stringify(output));
            try {
              if (mode !== 'baseline' && mode !== 'preview') {
                let target = 'baseline';
                if (breaking || refactor) target = `${run}-${mode === 'package' ? 'source' : 'baseline'}`;
                const baseline = JSON.parse(await fs.readFile(path.join(directory, `browser-${target}.json`), 'utf8'));
                if (!breaking || mode === 'package') assert.deepEqual(output, baseline);
                else {
                  output.differences = Object.fromEntries(['text', 'updates', 'batch', 'classes'].map(name => {
                    const a = name === 'updates' ? baseline[name].flat() : baseline[name];
                    const b = name === 'updates' ? output[name].flat() : output[name];
                    return [name, b.flatMap((item, index) => isDeepStrictEqual(item, a[index]) ? [] : [index])];
                  }));
                }
              }
              reports[key] = {
                ok: true,
                text: output.text.length,
                updates: output.updates.reduce((sum, list) => sum + list.length, 0),
                batch: output.batch.length,
                classes: output.classes.length,
                differences: output.differences,
              };
            } catch (error) {
              // 完整快照留在文件中，界面显示便于定位的短错误。
              reports[key] = { ok: false, error: error.message.slice(0, 3000) };
            }
          }
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(req.method === 'POST' ? reports[key] : reports));
      });
    },
  };
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await createServer({
    cacheDir: 'node_modules/.cache/layout-perf/vite',
    // 同名 tgz 更新后重新打包依赖，避免复用浏览器缓存。
    optimizeDeps: { force: true },
    server: { host: '127.0.0.1', port: 5182, strictPort: true, hmr: false },
    plugins: [layoutTestFixtures()],
  });
  await server.listen();
  server.printUrls();
}
