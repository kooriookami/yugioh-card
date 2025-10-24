import path from 'path';
import builtinModules from 'module';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import copy from 'rollup-plugin-copy';
import jsonfile from 'jsonfile';

function editPackageJson() {
  return {
    name: 'edit-package-json',
    closeBundle() {
      const file = 'dist/package.json';
      jsonfile.readFile(file, (err, obj) => {
        if (!err) {
          obj.module = undefined;
          obj.exports = {
            browser: {
              import: './browser/index.es.js',
              require: './browser/index.umd.js',
            },
            node: {
              import: './node/index.es.js',
              require: './node/index.cjs.js',
            },
          };
          jsonfile.writeFile(file, obj, { spaces: 2, EOL: '\r\n' });
        }
      });
    },
  };
}

const buildBrowserLib = {
  outDir: 'dist/browser',
  lib: {
    entry: path.resolve(__dirname, 'packages/yugioh-card'),
    name: 'YugiohCard',
    formats: ['es', 'umd'],
    fileName: format => `index.${format}.js`,
  },
  rollupOptions: {
    plugins: [
      copy({
        targets: [
          { src: 'LICENSE', dest: 'dist' },
          { src: 'README.md', dest: 'dist' },
          { src: 'packages/yugioh-card/package.json', dest: 'dist' },
        ],
        hook: 'writeBundle',
      }),
      editPackageJson(),
    ],
  },
};

const buildNodeLib = {
  outDir: 'dist/node',
  lib: {
    entry: path.resolve(__dirname, 'packages/yugioh-card'),
    name: 'YugiohCard',
    formats: ['es', 'cjs'],
    fileName: format => `index.${format}.js`,
  },
  rollupOptions: {
    external: builtinModules.builtinModules,
  },
};

const buildWebsite = {
  outDir: 'docs',
};

const getBuild = () => {
  if (process.argv.includes('browser-lib')) {
    return buildBrowserLib;
  } else if (process.argv.includes('node-lib')) {
    return buildNodeLib;
  }
  return buildWebsite;
};

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'], // 扩展了.vue后缀
    conditions: [process.argv.includes('node-lib') ? 'node' : 'browser'],
  },
  build: getBuild(),
});
