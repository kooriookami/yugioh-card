import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { useCanvas } from 'leafer-unified';
import skia from 'skia-canvas';
import { batchData } from './layout-cases.js';
import { moduleLoader } from './runtime-entry.js';

const args = Object.fromEntries(process.argv.slice(2).map(arg => arg.replace(/^--/, '').split('=')));
const entry = path.resolve(args.root || '.', args.entry || 'packages');
const { YugiohCard } = await moduleLoader(entry)('index');
const assets = path.resolve('src/assets/yugioh-card');
const images = args['images-dir']
  ? (await fs.readdir(args['images-dir'])).filter(file => /\.jpg$/i.test(file)).sort().map(file => path.resolve(args['images-dir'], file))
  : ['blue-eyes.jpg', 'leviathan-dragon.jpg', 'blue-eyes-old.jpg'].map(file => path.resolve('src/assets/image', file));
const count = Number(args.batch || 100);
const rounds = Number(args.rounds || 1);
const saveDirectory = args['save-dir'] && path.resolve(args['save-dir']);
if (saveDirectory) await fs.mkdir(saveDirectory, { recursive: true });
useCanvas('skia', skia);
const stats = times => {
  const sorted = [...times].sort((a, b) => a - b);
  return { totalMs: times.reduce((sum, value) => sum + value, 0), medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.floor((sorted.length - 1) * 0.95)] };
};
const output = { count, rounds: [], includesSaving: Boolean(saveDirectory), gcBetweenRounds: Boolean(global.gc) };
for (let round = 0; round < rounds; round++) {
  const before = process.memoryUsage();
  const card = new YugiohCard({ resourcePath: assets, skia });
  await card.ready;
  const defaults = structuredClone(card.data);
  const timings = { prepare: [], update: [], ready: [], export: [], save: [], complete: [] };
  const memory = [];
  let imageReferences = 0;
  let bytes = 0;
  const started = performance.now();
  try {
    for (let index = 0; index < count; index++) {
      const start = performance.now();
      const data = batchData(defaults, index, images);
      const prepared = performance.now(); card.setData(data);
      const updated = performance.now(); await card.ready;
      const settled = performance.now();
      const { data: buffer } = await card.leafer.export('png', { screenshot: true, blob: true });
      if (!Buffer.isBuffer(buffer)) throw new Error(`PNG export did not return a buffer for card ${index + 1}`);
      const exported = performance.now();
      bytes += buffer.length;
      if (saveDirectory) await fs.writeFile(path.join(saveDirectory, `${String(index).padStart(3, '0')}.png`), buffer);
      const saved = performance.now();
      timings.prepare.push(prepared - start); timings.update.push(updated - prepared); timings.ready.push(settled - updated);
      timings.export.push(exported - settled); timings.save.push(saved - exported); timings.complete.push(saved - start);
      imageReferences = Math.max(imageReferences, card._readiness.images.records.size);
      if ((index + 1) % 25 === 0) memory.push({ card: index + 1, ...process.memoryUsage() });
    }
  } finally { card.leafer.destroy(true); }
  const milliseconds = performance.now() - started;
  await new Promise(setImmediate);
  const afterDestroy = process.memoryUsage();
  // 仅用于释放后的诊断，不属于逐张处理和吞吐计时。
  global.gc?.();
  const result = { milliseconds, bytes, timings: Object.fromEntries(Object.entries(timings).map(([name, times]) => [name, stats(times)])), imageReferences, remainingImages: card._readiness.images.records.size, before, memory, afterDestroy, afterGc: global.gc ? process.memoryUsage() : undefined };
  output.rounds.push(result);
  process.stdout.write(`Round ${round + 1}/${rounds}: ${milliseconds.toFixed(1)} ms, images ${imageReferences}, released ${result.remainingImages === 0}\n`);
}
if (args.output) await fs.writeFile(args.output, JSON.stringify(output, null, 2));
