import fs from 'node:fs/promises';
import path from 'node:path';
import { Canvas, loadImage } from 'skia-canvas';

const directory = path.resolve('node_modules/.cache/layout-perf/batch-images');
await fs.mkdir(directory, { recursive: true });
const sources = await Promise.all(['blue-eyes.jpg', 'leviathan-dragon.jpg', 'blue-eyes-old.jpg'].map(file => loadImage(path.resolve('src/assets/image', file))));
const browserDirectory = path.resolve('node_modules/.cache/layout-perf/browser-images');
await fs.mkdir(browserDirectory, { recursive: true });
// 固定解码后的像素，避免浏览器根据首次绘制尺寸选择不同 JPEG 降采样缓存。
for (const [index, image] of sources.entries()) {
  const canvas = new Canvas(image.width, image.height);
  canvas.getContext('2d').drawImage(image, 0, 0);
  await fs.writeFile(path.join(browserDirectory, `${index}.png`), await canvas.toBuffer('png'));
}
for (let index = 0; index < 100; index++) {
  const file = path.join(directory, `${String(index).padStart(3, '0')}.jpg`);
  try { await fs.access(file); continue; } catch { /* 只生成缺少的固定样本。 */ }
  const width = [800, 1200, 1600][index % 3], height = width * 1.25;
  const canvas = new Canvas(width, height), context = canvas.getContext('2d');
  context.drawImage(sources[index % sources.length], 0, 0, width, height);
  context.fillStyle = `rgb(${index},${index * 2},${255 - index})`;
  context.fillRect(0, 0, 12, 12);
  await fs.writeFile(file, await canvas.toBuffer('jpg'));
}
process.stdout.write(`Prepared 100 independent image files: ${directory}\n`);
