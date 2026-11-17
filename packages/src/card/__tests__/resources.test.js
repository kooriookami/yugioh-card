import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Text, Rect, useCanvas } from 'leafer-unified';
import skia from 'skia-canvas';
import { collectFonts, collectResources } from '../resources.js';

useCanvas('skia', skia);

test('combined resource discovery preserves visible fonts, image paints and all referring targets', () => {
  const root = new Group();
  const hidden = new Group({ visible: false });
  const text = new Text({ text: 'A', fontFamily: '"MiXeD", serif' });
  const first = new Rect({ fill: { type: 'image', url: 'resource-test:shared' }, stroke: { type: 'image', url: 'resource-test:stroke' } });
  const second = new Rect({ fill: [{ type: 'image', url: 'resource-test:shared' }, { type: 'image', url: 'resource-test:disabled', visible: false }] });
  const status = new Rect({ fill: { type: 'image', url: 'resource-test:status' } });
  hidden.add(new Text({ text: 'hidden', fontFamily: 'ignored' }));
  hidden.add(new Rect({ fill: { type: 'image', url: 'resource-test:hidden' } }));
  root.addMany(text, first, second, hidden, status, new Text({ text: 'transparent', fontFamily: 'ignored', opacity: 0 }));
  try {
    const card = { leafer: root, imageStatusLeaf: status };
    const result = collectResources(card);
    assert.deepEqual(result.fonts, collectFonts(card));
    assert.deepEqual([...result.fonts], ['MiXeD', 'serif']);
    assert.deepEqual([...result.images.keys()], ['resource-test:shared', 'resource-test:stroke']);
    assert.deepEqual(result.images.get('resource-test:shared').targets, [{ node: first, attr: 'fill' }, { node: second, attr: 'fill' }]);
    assert.deepEqual(result.images.get('resource-test:stroke').targets, [{ node: first, attr: 'stroke' }]);
  } finally { root.destroy(); }
});
