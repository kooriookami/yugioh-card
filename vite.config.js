import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const packageManifest = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, 'packages/package.json'), 'utf8'));
const publishManifest = {
  ...packageManifest,
  main: './index.js',
  module: './index.js',
  types: './index.d.ts',
  exports: {
    '.': { types: './index.d.ts', import: './index.js' },
    './*': { types: './*.d.ts', import: './*.js' },
  },
};
const packageExternalSet = new Set([
  ...Object.keys(packageManifest.dependencies ?? {}),
  ...Object.keys(packageManifest.peerDependencies ?? {}),
]);

const external = id => Array.from(packageExternalSet).some(name => id === name || id.startsWith(`${name}/`));

const preserveModulesOutput = {
  preserveModules: true,
  preserveModulesRoot: 'packages',
  entryFileNames: '[name].js',
};

const buildLib = {
  outDir: 'dist',
  lib: {
    entry: path.resolve(import.meta.dirname, 'packages/index.ts'),
    formats: ['es'],
  },
  rolldownOptions: {
    treeshake: false,
    external,
    output: preserveModulesOutput,
  },
};

const buildWebsite = {
  outDir: 'docs',
};

const buildConfigMap = {
  lib: buildLib,
  website: buildWebsite,
};

export default defineConfig(({ mode }) => {
  const buildTarget = mode === 'lib' ? 'lib' : 'website';
  const isLib = buildTarget === 'lib';

  return {
    base: './',
    publicDir: false,
    plugins: [
      vue(),
      ...(isLib ? [viteStaticCopy({
        targets: [
          {
            src: 'packages/package.json',
            dest: '.',
            rename: { stripBase: 1 },
            transform: () => JSON.stringify(publishManifest, null, 2) + '\n',
          },
          { src: ['LICENSE', 'README.md', 'README.en.md'], dest: '.' },
        ],
      }), dts({
        processor: 'ts',
        tsconfigPath: path.resolve(import.meta.dirname, 'packages/tsconfig.json'),
        include: ['packages/**/*.ts'],
        outDirs: 'dist',
        entryRoot: 'packages',
        copyDtsFiles: false,
        insertTypesEntry: false,
        skipDiagnostics: false,
        beforeWriteFile: (filePath, content) => {
          const declarations = content.replace(/((?:from\s+|import\s*\()['"]\.{1,2}\/[^'"]+)\.ts(['"])/g, '$1.js$2');
          // 声明引用的 Leafer 和浏览器字体类型需要 DOM 标准库。
          const dom = /['"]@leafer-ui\/interface['"]|\bFontFace(?:Set)?\b/.test(declarations);
          return { filePath, content: dom ? `/// <reference lib="dom" />\n${declarations}` : declarations };
        },
      })] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
    },
    build: buildConfigMap[buildTarget],
  };
});
