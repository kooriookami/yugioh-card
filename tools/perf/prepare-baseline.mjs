import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const refactor = process.argv.includes('--refactor');
const commit = refactor ? 'd7f362f5184ac3da1e3ae0ac71f50ac4f53f58d1' : '3cc42ebb2f75836ef66b67caeefcea4164516f03';
const cache = refactor ? 'text-refactor' : 'layout-perf';
const directory = path.resolve('node_modules/.cache', cache, `baseline-${commit.slice(0, 7)}`);
const marker = path.join(directory, '.baseline-commit');
await fs.mkdir(directory, { recursive: true });
let prepared = false;
try { prepared = (await fs.readFile(marker, 'utf8')).trim() === commit; } catch { /* 首次准备。 */ }
if (!prepared) {
  if ((await fs.readdir(directory)).length) throw new Error(`Baseline directory is not empty: ${directory}`);
  const archive = path.join(path.dirname(directory), 'baseline.tar');
  execFileSync('git', ['archive', '--format=tar', `--output=${archive}`, commit, 'packages', 'package.json', 'pnpm-lock.yaml']);
  execFileSync('tar', ['-xf', archive, '-C', directory]);
  await fs.writeFile(marker, `${commit}\n`);
}
await fs.writeFile(path.join(directory, 'runtime.js'), `export { Leafer } from 'leafer-unified';
export * from './packages/index.js';
export { CompressText } from './packages/src/compress-text/compress-text.js';
export { getBrowserFontResource } from './packages/src/utils/font-loader.js';
`);
process.stdout.write(`Prepared baseline ${commit}: ${directory}\n`);
