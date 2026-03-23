import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
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
    build: buildConfigMap[buildTarget],
  };
});
