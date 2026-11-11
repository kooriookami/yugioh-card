import test from 'node:test';
import assert from 'node:assert/strict';
import { YugiohCard } from '../index.js';
import { YugiohSeries2Card } from '../../yugioh-series-2-card/index.js';
import { RushDuelCard } from '../../rush-duel-card/index.js';

test('monster type height controls description placement independently of typography', () => {
  for (const CardClass of [YugiohCard, YugiohSeries2Card, RushDuelCard]) {
    let descriptionOptions;
    let monsterTypeOptions;
    const target = {
      data: { type: 'monster', language: 'sc', monsterType: '龙族/通常', atkBar: true },
      style: {
        monsterType: { top: 1528, height: 54, minHeight: 16, fontSize: 46, lineHeight: 1.17 },
        description: { top: 1560, fontSize: 38, lineHeight: 1.17 },
      },
      showMonsterType: true,
      monsterTypeLeaf: { set(value) { monsterTypeOptions = value; } },
      descriptionLeaf: { set(value) { descriptionOptions = value; } },
    };
    for (const fontSize of [46, 50]) {
      target.style.monsterType.fontSize = fontSize;
      for (const height of [54, 64]) {
        target.style.monsterType.height = height;
        CardClass.prototype.drawMonsterType.call(target);
        CardClass.prototype.drawDescription.call(target);
        assert.equal(monsterTypeOptions.height, height);
        assert.equal(descriptionOptions.y, CardClass === RushDuelCard ? 1560 : 1528 + height);
        if (CardClass === YugiohCard) assert.equal(descriptionOptions.height, 385 - height - 60);
      }
    }
    if (CardClass !== RushDuelCard) {
      target.showMonsterType = false;
      CardClass.prototype.drawDescription.call(target);
      assert.equal(descriptionOptions.y, 1544);
    }
  }
});

test('all supported styles define a fixed monster type height', () => {
  for (const [CardClass, languages, fonts] of [
    [YugiohCard, ['sc', 'tc', 'jp', 'kr', 'en', 'astral'], ['', 'custom1', 'custom2']],
    [YugiohSeries2Card, ['jp'], ['', 'custom1', 'custom2']],
    [RushDuelCard, ['sc', 'jp'], ['']],
  ]) {
    const getStyle = Object.getOwnPropertyDescriptor(CardClass.prototype, 'style').get;
    for (const language of languages) {
      for (const font of fonts) {
        const style = getStyle.call({ data: { language, font } });
        assert.ok(style.monsterType.height > 0);
        assert.equal(style.effect, undefined);
        const previousHeight = CardClass === RushDuelCard ? 80 : style.monsterType.fontSize * style.monsterType.lineHeight;
        assert.ok(Math.abs(style.monsterType.height - previousHeight) < 1e-8);
      }
    }
  }
});
