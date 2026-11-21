import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vite';
import { cardTestFixtures } from '../packages/src/card/__tests__/browser/server.mjs';
import { jpSpacingTestFixtures } from '../packages/src/compress-text/__tests__/browser/jp-spacing-server.mjs';
import { layoutTestFixtures } from '../tools/perf/browser-server.mjs';
import projectConfig from '../vite.config.js';

export default defineConfig(environment => mergeConfig(projectConfig(environment), {
  root: fileURLToPath(new URL('../', import.meta.url)),
  cacheDir: 'node_modules/.cache/test-pages/vite',
  resolve: { dedupe: ['vue'] },
  optimizeDeps: {
    entries: ['play/index.html', '**/__tests__/browser/*.html', 'tools/perf/browser.html'],
    force: true,
  },
  server: { host: '127.0.0.1', port: 5175, open: '/test-pages/' },
  plugins: [
    cardTestFixtures(),
    jpSpacingTestFixtures(),
    layoutTestFixtures(),
    {
      name: 'test-page-entry',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url !== '/') return next();
          res.writeHead(302, { Location: '/test-pages/' }).end();
        });
      },
    },
  ],
}));
