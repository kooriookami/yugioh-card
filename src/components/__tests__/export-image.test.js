import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse, compileScript } from 'vue/compiler-sfc';

// 从组件 AST 取得实际处理函数，保留原逻辑，仅替换画布和消息接口。
const { descriptor } = parse(fs.readFileSync(new URL('../YugiohCard.vue', import.meta.url), 'utf8'));
const ast = compileScript(descriptor, { id: 'export-image-test' }).scriptSetupAst;
const declaration = ast.flatMap(node => node.declarations || []).find(node => node.id?.name === 'exportImage');
const unmount = ast.find(node => node.expression?.callee?.name === 'onBeforeUnmount').expression.arguments[0];
const sourceFor = node => `(${descriptor.scriptSetup.content.slice(node.start, node.end)})`;
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const fixture = () => {
  const ready = deferred(), encoding = deferred(), started = deferred();
  const calls = [], messages = [];
  let destroyed = 0, disconnected = 0;
  const card = {
    ready: ready.promise,
    leafer: {
      destroyed: false,
      destroy() { destroyed++; },
      export(...args) { calls.push(args); started.resolve(); return encoding.promise; },
    },
  };
  const cardLeaf = { value: card };
  const context = {
    cardLeaf,
    devicePixelRatio: 2,
    ElMessage: { error: message => messages.push(message) },
    resizeObserver: { disconnect() { disconnected++; } },
  };
  return {
    card, cardLeaf, ready, encoding, started, calls, messages,
    exportImage: vm.runInNewContext(sourceFor(declaration.init), context),
    unmount: vm.runInNewContext(sourceFor(unmount), context),
    get destroyed() { return destroyed; },
    get disconnected() { return disconnected; },
  };
};

for (const invalidation of ['replaced', 'destroyed']) {
  test(`a ${invalidation} card is not exported after readiness succeeds`, async () => {
    const state = fixture();
    const task = state.exportImage();
    if (invalidation === 'replaced') state.cardLeaf.value = {};
    else state.card.leafer.destroyed = true;
    state.ready.resolve();
    await task;
    assert.equal(state.calls.length, 0);
    assert.deepEqual(state.messages, []);
  });

  for (const stage of ['ready', 'encoding']) {
    test(`a ${invalidation} card does not show an error when ${stage} rejects`, async () => {
      const state = fixture();
      const task = state.exportImage();
      if (stage === 'encoding') {
        state.ready.resolve();
        await state.started.promise;
      }
      if (invalidation === 'replaced') state.cardLeaf.value = {};
      else state.card.leafer.destroyed = true;
      state[stage].reject(new Error('Old card was stopped'));
      await task;
      assert.equal(state.calls.length, stage === 'encoding' ? 1 : 0);
      assert.deepEqual(state.messages, []);
    });
  }
}

test('unmount invalidates the card immediately while asynchronous destruction is pending', async () => {
  const state = fixture();
  const task = state.exportImage();
  state.unmount();
  assert.equal(state.destroyed, 1);
  assert.equal(state.disconnected, 1);
  assert.equal(state.cardLeaf.value, null);
  assert.equal(state.card.leafer.destroyed, false);
  state.ready.reject(new Error('Loading failed during navigation'));
  await task;
  assert.equal(state.calls.length, 0);
  assert.deepEqual(state.messages, []);
});

for (const stage of ['ready', 'encoding']) {
  test(`an active card still reports a real ${stage} failure`, async () => {
    const state = fixture();
    const task = state.exportImage();
    if (stage === 'encoding') {
      state.ready.resolve();
      await state.started.promise;
    }
    state[stage].reject(new Error('Required resource or export failed'));
    await task;
    assert.deepEqual(state.messages, ['导出失败：Required resource or export failed']);
  });
}

test('an active card exports with the expected screenshot options', async () => {
  const state = fixture();
  const task = state.exportImage();
  state.ready.resolve();
  await state.started.promise;
  state.encoding.resolve();
  await task;
  assert.equal(state.calls.length, 1);
  assert.equal(state.calls[0][0], '卡片.png');
  assert.equal(state.calls[0][1].screenshot, true);
  assert.equal(state.calls[0][1].pixelRatio, 2);
  assert.deepEqual(state.messages, []);
});

test('an export request without a current card is ignored', async () => {
  const state = fixture();
  state.cardLeaf.value = null;
  await state.exportImage();
  assert.equal(state.calls.length, 0);
  assert.deepEqual(state.messages, []);
});
