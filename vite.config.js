import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import electron from 'vite-plugin-electron/simple';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const packageManifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'packages/package.json'), 'utf8'));
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
    entry: path.resolve(__dirname, 'packages/index.js'),
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

const buildElectron = {
  outDir: 'dist',
};

const buildConfigMap = {
  lib: buildLib,
  website: buildWebsite,
  electron: buildElectron,
};

export default defineConfig(({ mode }) => {
  const buildTarget = mode === 'lib' ? 'lib' : mode === 'electron' ? 'electron' : 'website';
  const isLib = buildTarget === 'lib';

  return {
    base: './',
    publicDir: false,
    plugins: [
      vue(),
      // Electron 插件 + 静态资源拷贝（仅 electron 模式）
      ...(mode === 'electron' ? [
        electron({
          main: {
            entry: 'electron/main.mjs',
          },
          preload: {
            input: 'electron/preload.mjs',
          },
        }),
        viteStaticCopy({
          targets: [
            { src: 'src/assets/yugioh-card/**/*', dest: 'assets' },
          ],
        }),
      ] : []),
      ...(isLib ? [viteStaticCopy({
        targets: [
          { src: 'packages/package.json', dest: '.', rename: { stripBase: 1 } },
          { src: ['LICENSE', 'README.md', 'README.en.md'], dest: '.' },
        ],
      }), dts({
        tsconfigPath: path.resolve(__dirname, 'tsconfig.dts.json'),
        include: ['packages/**/*.js'],
        outDir: 'dist',
        entryRoot: 'packages',
        copyDtsFiles: false,
        insertTypesEntry: false,
        skipDiagnostics: false,
      })] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      proxy: {
        '/ygotoken-img': {
          target: 'http://www.ygotoken.com/images',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/ygotoken-img/, ''),
        },
        '/ygotoken-api': {
          target: 'http://www.ygotoken.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/ygotoken-api/, ''),
        },
      },
    },
    build: buildConfigMap[buildTarget],
  };
});
