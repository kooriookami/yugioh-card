import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { textCases, updateCases, batchData, classData, textSnapshot, nodeSnapshot } from './layout-cases.js';

const args = Object.fromEntries(process.argv.slice(2).map(arg => arg.replace(/^--/, '').split('=')));
const cases = args.cases ? (await import(pathToFileURL(path.resolve(args.cases)))).textCases : textCases;
const root = path.resolve(args.root || '.');
const entry = path.resolve(root, args.entry || 'packages');
const runtime = args.runtime ? await import(pathToFileURL(path.resolve(args.runtime))) : null;
const { Leafer, useCanvas } = runtime || await import('leafer-unified');
const skia = runtime?.skia || (await import('skia-canvas')).default;
const moduleAt = file => import(pathToFileURL(path.join(entry, file)));
const { CompressText } = await moduleAt('src/compress-text/compress-text.js');
const cards = await moduleAt('index.js');
const { getNodeFontResource } = await moduleAt('src/utils/font-loader.js');
const assets = path.resolve('src/assets/yugioh-card');
useCanvas('skia', skia);
getNodeFontResource(`${assets}/yugioh/font`, skia);
const output = args['resume-classes'] ? JSON.parse(await fs.readFile(args.output, 'utf8')) : { text: [], updates: [], batch: [], classes: [], metrics: {} };
await fs.mkdir(path.dirname(path.resolve(args.output)), { recursive: true });
const checkpoint = () => fs.writeFile(args.output, JSON.stringify(output));
const pixels = async view => {
  const result = await view.export('png', { screenshot: true });
  const image = await skia.loadImage(result.data);
  const canvas = new skia.Canvas(image.width, image.height);
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);
  const data = context.getImageData(0, 0, image.width, image.height).data;
  return { width: image.width, height: image.height, rgba: createHash('sha256').update(data).digest('hex') };
};
const capture = async (text, view, withPixels) => ({ layout: textSnapshot(text), pixels: withPixels ? await pixels(view) : undefined });

const skipText = args['resume-classes'] || args['batch-only'];
for (const [index, data] of (skipText ? [] : cases).entries()) {
  const view = new Leafer({ width: 1400, height: 650 });
  const text = new CompressText({ fontFamily: 'ygo-jp', fontSize: 38, rtFontSize: 13, rtTop: -6, width: 1175, sideBearingRatio: 0.5, ...data });
  view.add(text);
  try { output.text.push(await capture(text, view, args.pixels === '1')); }
  finally { view.destroy(true); }
}
for (const extra of (skipText ? [] : [{}, { gradient: true }, { strokeWidth: 1, rtStrokeWidth: 1 }, { sideBearingRatio: 1 }, { height: 35, autoSmallSize: true, smallFontSize: 12 }])) {
  const view = new Leafer({ width: 1400, height: 650 });
  const text = new CompressText({ text: '[日あー(X)] AV。\n日  日', fontFamily: 'ygo-jp', fontSize: 38, width: 400, sideBearingRatio: 0.5, ...extra });
  view.add(text);
  try {
    const steps = [await capture(text, view, args.pixels === '1')];
    for (const update of updateCases) { text.set(update); steps.push(await capture(text, view, args.pixels === '1')); }
    output.updates.push(steps);
  } finally { view.destroy(true); }
}

const images = args['images-dir']
  ? (await fs.readdir(args['images-dir'])).filter(file => /\.jpg$/i.test(file)).sort().map(file => path.resolve(args['images-dir'], file))
  : ['blue-eyes.jpg', 'leviathan-dragon.jpg', 'blue-eyes-old.jpg'].map(file => path.resolve('src/assets/image', file));
const count = Number(args.batch || 0);
await checkpoint();
if (count && !args['resume-classes']) {
  const card = new cards.YugiohCard({ resourcePath: assets, skia, data: { scale: 1 } });
  const defaults = structuredClone(card.data);
  const timings = { update: [], ready: [], export: [] };
  await card.ready;
  const started = performance.now();
  try {
    for (let index = 0; index < count; index++) {
      const data = batchData(defaults, index, images);
      const start = performance.now(); card.setData(data);
      const updated = performance.now(); await card.ready;
      const settled = performance.now();
      const image = await pixels(card.leafer);
      timings.update.push(updated - start); timings.ready.push(settled - updated); timings.export.push(performance.now() - settled);
      output.batch.push({ name: data.name, pixels: image, nodes: JSON.parse(JSON.stringify(nodeSnapshot(card.leafer))) });
      if ((index + 1) % 25 === 0) process.stdout.write(`Captured ${index + 1}/${count} cards\n`);
    }
    output.metrics.batch = { milliseconds: performance.now() - started, timings, memory: process.memoryUsage(), trackedImages: card._readiness.images.records.size };
  } finally { card.leafer.destroy(true); }
  await checkpoint();
}
output.classes = [];
for (const name of ['YugiohCard', 'YugiohSeries2Card', 'RushDuelCard', 'FieldCenterCard', 'YugiohBackCard']) {
  const Card = cards[name];
  const card = new Card({ resourcePath: assets, skia, data: { scale: 0.15 } });
  const defaults = structuredClone(card.data);
  const samples = [];
  try {
    for (let index = 0; index < 4; index++) {
      card.setData(classData(name, defaults, index, images));
      await card.ready;
      samples.push(await pixels(card.leafer));
    }
    assert.deepEqual(samples[0], samples[3], `${name}: A -> B -> A output`);
    output.classes.push({ name, samples });
  } finally { card.leafer.destroy(true); }
}

await fs.mkdir(path.dirname(path.resolve(args.output)), { recursive: true });
await fs.writeFile(args.output, JSON.stringify(output));
if (args.compare) {
  const before = JSON.parse(await fs.readFile(args.compare, 'utf8'));
  before.batch = before.batch.slice(0, count);
  delete before.metrics;
  const after = { ...output }; delete after.metrics;
  assert.deepEqual(after, before);
  process.stdout.write('Exact layout, node styles and RGBA hashes match the baseline\n');
}
process.stdout.write(`Captured ${output.text.length} text cases, ${output.updates.length * (updateCases.length + 1)} update steps, ${output.batch.length} batch cards and ${output.classes.length} card classes\n`);
