import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';
import { useCanvas } from 'leafer-unified';
import skia from 'skia-canvas';
import { japaneseText } from './layout-cases.js';

const args = Object.fromEntries(process.argv.slice(2).map(arg => arg.replace(/^--/, '').split('=')));
const root = path.resolve(args.root || '.', args.entry || 'packages');
const { CompressText } = await import(pathToFileURL(path.join(root, 'src/compress-text/compress-text.js')));
const { getNodeFontResource } = await import(pathToFileURL(path.join(root, 'src/utils/font-loader.js')));
useCanvas('skia', skia);
getNodeFontResource(path.resolve('src/assets/yugioh-card/yugioh/font'), skia);
const data = { text: japaneseText.repeat(4), fontFamily: 'ygo-jp', fontSize: 38, rtFontSize: 13, width: 1175, height: 270, sideBearingRatio: 0.5 };
const stats = times => {
  const sorted = [...times].sort((a, b) => a - b);
  return { medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.floor((sorted.length - 1) * 0.95)] };
};
const result = {};
for (const [name, update] of Object.entries({
  unchanged: () => ({}),
  position: i => ({ x: i + 10 }),
  color: i => ({ color: i % 2 ? '#123456' : '#345678' }),
  width: i => ({ width: i % 2 ? 1125 : 1175 }),
  content: i => ({ text: japaneseText.repeat(4) + (i % 2 ? '日' : '月') }),
})) {
  const text = new CompressText(data);
  try {
    for (let index = 0; index < 15; index++) text.set(update(index));
    const times = [];
    for (let index = 0; index < 61; index++) {
      const start = performance.now(); text.set(update(index + 15)); times.push(performance.now() - start);
    }
    result[name] = stats(times);
  } finally { text.destroy(); }
}
for (const [name, text, fontFamily, width] of [['long-native', 'W'.repeat(800), 'ygo-en', 300], ['long-cjk', '日'.repeat(1600), 'ygo-jp', 1175]]) {
  const times = [];
  for (let index = 0; index < 36; index++) {
    const start = performance.now();
    const value = new CompressText({ text, fontFamily, fontSize: 38, width, sideBearingRatio: fontFamily === 'ygo-jp' ? 0.5 : 1 });
    if (index >= 5) times.push(performance.now() - start);
    value.destroy();
  }
  result[name] = stats(times);
}
if (args.output) await fs.writeFile(args.output, JSON.stringify(result, null, 2));
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
