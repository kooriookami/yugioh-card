import path from 'path';
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
          obj.module = 'index.js';
          jsonfile.writeFile(file, obj, { spaces: 2, EOL: '\r\n' });
        }
      });
    },
  };
}

const buildLib = {
  lib: {
    entry: path.resolve(__dirname, 'packages/yugioh-card'),
    name: 'YugiohCard',
    formats: ['es'],
    fileName: () => 'index.js',
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

const buildWebsite = {
  outDir: 'docs',
};

export default defineConfig({
  base: './',
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'], // 扩展了.vue后缀
  },
  build: process.argv.includes('lib') ? buildLib : buildWebsite,
});
