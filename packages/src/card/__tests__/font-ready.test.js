import test from 'node:test';
import assert from 'node:assert/strict';
import 'leafer-unified';
import 'lodash-unified';

// 使用 Node 的渲染依赖运行浏览器生命周期测试，不创建实际画布。
const nodeProcess = globalThis.process;
let Card;
let YugiohCard;
try {
  globalThis.process = undefined;
  ({ Card } = await import('../index.js'));
  ({ YugiohCard } = await import('../../yugioh-card/index.js'));
} finally {
  globalThis.process = nodeProcess;
}

test('browser cards draw once after fonts settle, including cached fonts and failed manifests', async t => {
  for (const Parent of [Card, YugiohCard]) {
    class PreviewCard extends Parent {
      get tag() { return 'YugiohCard'; }
      initLeafer() { this.leafer = { destroyed: false }; }
      draw() { this.draws = (this.draws ?? 0) + 1; }
    }
    let finishManifest;
    const fetchMock = t.mock.method(globalThis, 'fetch', () => new Promise(resolve => { finishManifest = resolve; }));
    const card = new PreviewCard({ resourcePath: `/pending-${Parent.name}` });
    if (Parent === Card) card.setData();
    const firstReady = card.ready;
    card.setData({ name: 'first' });
    card.setData({ name: 'latest' });
    assert.equal(card.draws, undefined);
    finishManifest({ ok: true, json: async () => [] });
    await Promise.all([firstReady, card.ready]);
    assert.equal(card.draws, 1);
    assert.equal(card.data.name, 'latest');
    await card.setData({ name: 'updated' });
    assert.equal(card.draws, 2);
    const cached = new PreviewCard({ resourcePath: `/pending-${Parent.name}` });
    if (Parent === Card) cached.setData();
    await cached.ready;
    assert.equal(cached.draws, 1);
    assert.equal(fetchMock.mock.callCount(), 1);
    fetchMock.mock.restore();

    const failedFetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
    const warning = t.mock.method(console, 'warn', () => {});
    const fallback = new PreviewCard({ resourcePath: `/failed-${Parent.name}` });
    if (Parent === Card) fallback.setData();
    await fallback.ready;
    assert.equal(fallback.draws, 1);
    assert.equal(warning.mock.callCount(), 1);
    warning.mock.restore();
    failedFetch.mock.restore();

    const pendingFetch = t.mock.method(globalThis, 'fetch', () => new Promise(resolve => { finishManifest = resolve; }));
    const destroyed = new PreviewCard({ resourcePath: `/destroyed-${Parent.name}` });
    if (Parent === Card) destroyed.setData();
    destroyed.leafer = { destroyed: true };
    finishManifest({ ok: true, json: async () => [] });
    await destroyed.ready;
    assert.equal(destroyed.draws, undefined);
    pendingFetch.mock.restore();
  }
});
