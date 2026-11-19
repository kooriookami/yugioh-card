import fs from 'node:fs/promises';
import path from 'node:path';
import { useCanvas } from 'leafer-unified';
import skia from 'skia-canvas';
import { japaneseText } from './layout-cases.js';
import { moduleLoader } from './runtime-entry.js';

const args = Object.fromEntries(process.argv.slice(2).map(arg => arg.replace(/^--/, '').split('=')));
const entry = path.resolve(args.root || '.', args.entry || 'packages');
const moduleAt = moduleLoader(entry);
const { CompressText } = await moduleAt('src/compress-text/compress-text');
const { getNodeFontResource } = await moduleAt('src/utils/font-loader');
useCanvas('skia', skia);
getNodeFontResource(path.resolve('src/assets/yugioh-card/yugioh/font'), skia);
const data = { text: japaneseText.repeat(4), fontFamily: 'ygo-jp', fontSize: 38, rtFontSize: 13, width: 1175, sideBearingRatio: 0.5 };
const result = {};
for (const key of ['x', 'color']) {
  const text = new CompressText(data);
  let rebuilt = 0;
  try {
    for (let index = 0; index < 10; index++) {
      const group = text.group;
      text.set({ [key]: key === 'x' ? index + 10 : index % 2 ? '#123456' : '#345678' });
      if (group !== text.group) rebuilt++;
    }
    result[`${key}GroupRebuilds`] = rebuilt;
  } finally { text.destroy(); }
}
{
  const text = new CompressText({ ...data, text: '日'.repeat(1600) });
  let reads = 0;
  text.rubyList = new Proxy(text.rubyList, { get(target, key, receiver) {
    if (typeof key === 'string' && /^\d+$/.test(key)) reads++;
    return Reflect.get(target, key, receiver);
  } });
  const relayoutBody = text.relayoutBody ?? text.updateTextScale;
  try { relayoutBody.call(text); result.layoutRubyIndexReads = reads; }
  finally { text.destroy(); }
}
{
  const text = new CompressText(data);
  let writes = 0;
  const rubyNodeKey = 'createRubyNode' in text ? 'rubyNode' : 'rubyLeaf';
  for (const ruby of text.rubyList) ruby[rubyNodeKey] = new Proxy(ruby[rubyNodeKey], {
    get: (target, key) => Reflect.get(target, key, target),
    set(target, key, value) { writes++; return Reflect.set(target, key, value, target); },
  });
  const findScaleXForHeight = text.findScaleXForHeight ?? text.findHeightScale;
  try { text.height = 270; findScaleXForHeight.call(text); result.heightTrialNodeWrites = writes; }
  finally { text.destroy(); }
}
{
  let calls = 0;
  const original = Intl.Segmenter.prototype.segment;
  Intl.Segmenter.prototype.segment = function (...args) { calls++; return original.apply(this, args); };
  try {
    const text = new CompressText({ text: 'W'.repeat(800), fontFamily: 'ygo-en', fontSize: 38, width: 300 });
    try { result.longWordSegmentations = calls; }
    finally { text.destroy(); }
  } finally { Intl.Segmenter.prototype.segment = original; }
}
if (args.output) await fs.writeFile(args.output, JSON.stringify(result, null, 2));
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
