import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import skia from 'skia-canvas';
import { YugiohCard } from 'yugioh-card';

const resourcePath = fileURLToPath(new URL('./card-assets', import.meta.url));
const outputDir = new URL('./output/', import.meta.url);
await mkdir(outputDir, { recursive: true });

const card = new YugiohCard({
  skia,
  resourcePath,
  data: {
    language: 'en',
    attribute: 'light',
    level: 8,
    monsterTypeLine: 'Dragon / Normal',
    cardText: 'A dragon drawn on Canvas.',
    def: 2500,
  },
});

const cards = [
  { name: 'Demo Dragon A', atk: 3000 },
  { name: 'Demo Dragon B', atk: 2600 },
];

try {
  for (const [index, data] of cards.entries()) {
    card.setData(data);
    await card.ready;
    const { data: png } = await card.leafer.export('png', { screenshot: true, blob: true });
    await writeFile(new URL(`card-${index + 1}.png`, outputDir), png);
  }
} finally {
  card.leafer.destroy(true);
}
