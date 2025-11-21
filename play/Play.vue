<template>
  <div class="play">
    <div ref="leaferRef" />
    <div class="text">{{ rubyText }}</div>
  </div>
</template>

<script setup>
import { CompressText, splitBreakWordWithBracket } from '/packages/yugioh-card/src/compress-text';
import { Leafer } from 'leafer-unified';
import { onMounted, ref } from 'vue';
import { numberToFull } from '/packages/yugioh-card/src/utils';

const leaferRef = ref(null);

// 移除假名
const removeKanjiKana = (text = '') => {
  return text.replace(/\[(.*?)\(.*?\)]/g, '$1');
};

const text = '[自(じ)][分(ぶん)]フィールドの[表(おもて)][側(がわ)][攻(こう)][撃(げき)][表(ひょう)][示(じ)]モンスター１[体(たい)]を[対(たい)][象(しょう)]としてこのカードを[発(はつ)][動(どう)]できる。①：このカードが[魔(ま)][法(ほう)]＆[罠(トラップ)]ゾーンに[存(そん)][在(ざい)]する[限(かぎ)]り、そのモンスターは[戦(せん)][闘(とう)]・[効(こう)][果(か)]では[破(は)][壊(かい)]されない。そのモンスターがフィールドから[離(はな)]れた[場(ば)][合(あい)]にこのカードは[破(は)][壊(かい)]される。';
const rubyText = removeKanjiKana(text);

onMounted(() => {
  const leafer = new Leafer({
    view: leaferRef.value,
    grow: true,
  });

  const compressText = new CompressText();

  leafer.add(compressText);

  console.log(splitBreakWordWithBracket(text));

  console.log(numberToFull('我有0123456789.个苹果'));

  compressText.set({
    text: rubyText,
    width: 400,
    lineHeight: 1.15,
  });
});
</script>

<style lang="scss">
.play {
  padding: 20px;
}

.text {
  margin-top: 20px;
  text-align: justify;
  width: 400px;
  font-size: 24px;
  line-height: 1.15;
  line-break: strict;
  white-space: pre-wrap;
}
</style>
