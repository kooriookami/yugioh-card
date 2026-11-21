import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse, compileScript } from 'vue/compiler-sfc';

// 从组件 AST 取得实际处理函数，保留原逻辑，仅替换画布和消息接口。
const { descriptor } = parse(fs.readFileSync(new URL('../YugiohCard.vue', import.meta.url), 'utf8'));
const ast = compileScript(descriptor, { id: 'export-image-test' }).scriptSetupAst;
const declaration = ast.flatMap(node => node.declarations || []).find(node => node.id?.name === 'exportImage');
const setupFunction = name => ast.flatMap(node => node.declarations || []).find(node => node.id?.name === name).init;
const unmount = ast.find(node => node.expression?.callee?.name === 'onBeforeUnmount').expression.arguments[0];
const sourceFor = node => `(${descriptor.scriptSetup.content.slice(node.start, node.end)})`;
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const fixture = () => {
  const ready = deferred(), encoding = deferred(), started = deferred();
  const calls = [];
  let destroyed = 0, disconnected = 0;
  const card = {
    ready: ready.promise,
    leafer: {
      destroyed: false,
      destroy() { destroyed++; },
      export(...args) { calls.push(args); started.resolve(); return encoding.promise; },
    },
  };
  const cardInstance = { value: card };
  const context = {
    cardInstance,
    cardPending: { value: false },
    cardError: { value: '' },
    exporting: { value: false },
    observedReady: null,
    exportRequest: null,
    devicePixelRatio: 2,
    jsonError: { value: '' },
    exportError: { value: '' },
    selectedExample: { value: { id: 'yugioh' } },
    labels: { value: { exportError: '导出失败' } },
    resizeObserver: { disconnect() { disconnected++; } },
  };
  context.cancelExport = vm.runInNewContext(sourceFor(setupFunction('cancelExport')), context);
  return {
    card, cardInstance, ready, encoding, started, calls,
    ...context,
    trackReady: vm.runInNewContext(sourceFor(setupFunction('trackReady')), context),
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
    if (invalidation === 'replaced') state.cardInstance.value = {};
    else state.card.leafer.destroyed = true;
    state.ready.resolve();
    await task;
    assert.equal(state.calls.length, 0);
    assert.equal(state.exportError.value, '');
  });

  for (const stage of ['ready', 'encoding']) {
    test(`a ${invalidation} card does not show an error when ${stage} rejects`, async () => {
      const state = fixture();
      const task = state.exportImage();
      if (stage === 'encoding') {
        state.ready.resolve();
        await state.started.promise;
      }
      if (invalidation === 'replaced') state.cardInstance.value = {};
      else state.card.leafer.destroyed = true;
      state[stage].reject(new Error('Old card was stopped'));
      await task;
      assert.equal(state.calls.length, stage === 'encoding' ? 1 : 0);
      assert.equal(state.exportError.value, '');
    });
  }
}

test('unmount invalidates the card immediately while asynchronous destruction is pending', async () => {
  const state = fixture();
  const task = state.exportImage();
  state.unmount();
  assert.equal(state.destroyed, 1);
  assert.equal(state.disconnected, 1);
  assert.equal(state.cardInstance.value, null);
  assert.equal(state.card.leafer.destroyed, false);
  state.ready.reject(new Error('Loading failed during navigation'));
  await task;
  assert.equal(state.calls.length, 0);
  assert.equal(state.exportError.value, '');
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
    assert.equal(state.exportError.value, '导出失败 · Required resource or export failed');
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
  assert.equal(state.calls[0][0], 'yugioh.png');
  assert.equal(state.calls[0][1].screenshot, true);
  assert.equal(state.calls[0][1].pixelRatio, 2);
  assert.equal(state.exportError.value, '');
});

test('an export request without a current card is ignored', async () => {
  const state = fixture();
  state.cardInstance.value = null;
  await state.exportImage();
  assert.equal(state.calls.length, 0);
  assert.equal(state.exportError.value, '');
});

test('repeated export requests share the active UI operation and restore the button after completion', async () => {
  const state = fixture();
  const first = state.exportImage();
  assert.equal(state.exporting.value, true);
  await state.exportImage();
  state.ready.resolve();
  await state.started.promise;
  assert.equal(state.calls.length, 1);
  assert.equal(state.exporting.value, true);
  state.encoding.resolve();
  await first;
  assert.equal(state.exporting.value, false);
});

test('an old export cannot clear the loading state of a replacement card export', async () => {
  const state = fixture();
  const first = state.exportImage();
  state.cancelExport();
  const next = deferred();
  state.cardInstance.value = { ready: next.promise, leafer: { destroyed: false, export: async () => {} } };
  const second = state.exportImage();
  state.ready.reject(new Error('Old card stopped'));
  await first;
  assert.equal(state.exporting.value, true);
  assert.equal(state.exportError.value, '');
  next.resolve();
  await second;
  assert.equal(state.exporting.value, false);
});

test('card loading reflects ready success and active resource failure, then recovers on a new cycle', async () => {
  const state = fixture();
  const first = state.trackReady();
  assert.equal(state.cardPending.value, true);
  state.ready.reject(new Error('Image is unavailable'));
  await first;
  assert.equal(state.cardPending.value, false);
  assert.equal(state.cardError.value, 'Image is unavailable');
  const next = deferred();
  state.card.ready = next.promise;
  const second = state.trackReady();
  assert.equal(state.cardPending.value, true);
  assert.equal(state.cardError.value, '');
  next.resolve();
  await second;
  assert.equal(state.cardPending.value, false);
  assert.equal(state.cardError.value, '');
});

for (const invalidation of ['replacement card', 'new update cycle']) {
  test(`late readiness cannot overwrite the loading state of a ${invalidation}`, async () => {
    const state = fixture();
    const first = state.trackReady();
    const next = deferred();
    if (invalidation === 'replacement card') state.cardInstance.value = { ready: next.promise, leafer: { destroyed: false } };
    else state.card.ready = next.promise;
    const second = state.trackReady();
    state.ready.reject(new Error('Obsolete resource failed'));
    await first;
    assert.equal(state.cardPending.value, true);
    assert.equal(state.cardError.value, '');
    next.resolve();
    await second;
    assert.equal(state.cardPending.value, false);
  });
}

test('pending updates with the same ready promise retain their current loading state', async () => {
  const state = fixture();
  const first = state.trackReady();
  await state.trackReady();
  assert.equal(state.cardPending.value, true);
  state.ready.resolve();
  await first;
  assert.equal(state.cardPending.value, false);
});

test('unmount clears loading and export states and ignores late resource errors', async () => {
  const state = fixture();
  const loading = state.trackReady();
  const exporting = state.exportImage();
  state.unmount();
  assert.equal(state.cardPending.value, false);
  assert.equal(state.exporting.value, false);
  state.ready.reject(new Error('Late resource error'));
  await Promise.all([loading, exporting]);
  assert.equal(state.cardError.value, '');
  assert.equal(state.exportError.value, '');
});
