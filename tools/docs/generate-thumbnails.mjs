import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import skia from 'skia-canvas';
import * as constructors from '../../packages/index.ts';
import { cardExamples, cardTypes } from '../../src/assets/demo/examples.js';

const resourcePath = fileURLToPath(new URL('../../src/assets/yugioh-card', import.meta.url));
const output = new URL('../../docs/public/card-previews/', import.meta.url);

const defaultExamples = cardExamples.filter(example => example.id === example.type);

await mkdir(output, { recursive: true });
for (const { id, type, data } of defaultExamples) {
  const Card = constructors[cardTypes[type]];
  const cardData = { ...data };
  if (cardData.artwork) cardData.artwork = fileURLToPath(cardData.artwork);
  const card = new Card({ resourcePath, skia, data: cardData });

  try {
    await card.ready;
    const { data: image } = await card.leafer.export('webp', {
      screenshot: true,
      blob: true,
      pixelRatio: 0.25,
      quality: 0.86,
    });
    if (!Buffer.isBuffer(image)) throw new Error(`Could not export thumbnail ${id}`);
    await writeFile(new URL(`${id}.webp`, output), image);
  } finally {
    card.leafer.destroy(true);
  }
}
