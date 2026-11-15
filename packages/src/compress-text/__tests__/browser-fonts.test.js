import test from 'node:test';
import assert from 'node:assert/strict';
import { useCanvas } from 'leafer-unified';
import skia from 'skia-canvas';

// 使用真实 CompressText 和测量后端，仅控制浏览器字体完成事件。
useCanvas('skia', skia);
const listeners = new Set();
const fonts = {
  ready: Promise.resolve(),
  addEventListener(type, callback) { assert.equal(type, 'loadingdone'); listeners.add(callback); },
  removeEventListener(type, callback) { assert.equal(type, 'loadingdone'); listeners.delete(callback); },
};
globalThis.document = { fonts };
globalThis.window = { document };
const { CompressText } = await import('../compress-text.js');
const flush = () => new Promise(resolve => setImmediate(resolve));
const notify = family => listeners.forEach(callback => callback({ fontfaces: [{ family }] }));

for (const [label, fontFamily, rtFontFamily, completed] of [
  ['body', 'MiXeD Body', 'Other Ruby', 'mixed body'],
  ['annotation', 'Other Body', 'MiXeD Ruby', 'MIXED RUBY'],
  ['quoted fallback list', "'Unused Font', \"MiXeD Body\", serif", 'Other Ruby', '"mixed body"'],
]) {
  test(`standalone ${label} font notifications ignore name casing after initial fonts.ready`, async t => {
    const text = new CompressText({ text: '[Body(ruby)]', fontFamily, rtFontFamily, width: 200, textAlign: 'left' });
    t.after(() => text.destroy());
    await flush();
    let layouts = 0;
    const compress = text.compressText.bind(text);
    text.compressText = () => { layouts++; compress(); };
    notify('unrelated-font');
    await flush();
    assert.equal(layouts, 0);
    notify(completed);
    notify(completed);
    await flush();
    assert.equal(layouts, 1, 'matching notifications in one turn share a real layout');
    assert.ok(text.bounds.width > 0);
    text.destroy();
    notify(completed);
    await flush();
    assert.equal(layouts, 1, 'destroyed text no longer receives notifications');
  });
}
