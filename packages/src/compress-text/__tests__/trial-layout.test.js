import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { useCanvas } from 'leafer-unified';
import skia from 'skia-canvas';
import { textSnapshot } from '../../../../tools/perf/layout-cases.js';
import { textCases } from '../../../../tools/perf/breaking-cases.js';
import { getNodeFontResource } from '../../utils/font-loader.ts';
import { CompressText } from '../compress-text.ts';
import { trialLayoutHeight } from '../layout/trial-layout.ts';

useCanvas('skia', skia);
getNodeFontResource(path.resolve('src/assets/yugioh-card/yugioh/font'), skia);

test('numeric trial height exactly matches committed layout without changing scene state', () => {
  for (const data of textCases) {
    const text = new CompressText({ fontFamily: 'ygo-jp', fontSize: 38, width: 1175, sideBearingRatio: 0.5, ...data });
    try {
      for (const scaleX of [1, 0.75, 0.333333333333, 0.01, Number.EPSILON]) {
        const before = textSnapshot(text);
        const height = trialLayoutHeight(text.hardBreakSegments, text.width, text.getLineHeight(), text.segmentScaleX, scaleX);
        assert.deepEqual(textSnapshot(text), before, 'trial cannot modify the scene or layout');
        text.lastSegmentScaleX = scaleX;
        text.relayoutBody();
        assert.equal(height, text.getLayoutHeight(), JSON.stringify(data));
      }
    } finally { text.destroy(); }
  }
});

test('custom layout callbacks remain involved in every compression trial', () => {
  class CustomText extends CompressText {
    layoutCount = 0;
    relayoutBody() {
      this.layoutCount = (this.layoutCount || 0) + 1;
      return super.relayoutBody();
    }
  }
  const text = new CustomText({ text: '日'.repeat(100), fontFamily: 'ygo-jp', fontSize: 38, width: 200 });
  try {
    text.layoutCount = 0;
    text.set({ height: 100 });
    assert.ok(text.layoutCount > 3);
    assert.ok(text.lastSegmentScaleX > 0 && text.lastSegmentScaleX < 1);
    assert.ok(text.bounds.height <= 100);
  } finally { text.destroy(); }
});
