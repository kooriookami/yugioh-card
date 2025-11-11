<template>
  <div ref="leaferRef" class="leafer" />
</template>

<script setup>
import { CompressText, splitBreakWordWithBracket } from '/packages/yugioh-card/src/compress-text';
import { Leafer } from 'leafer-unified';
import { onMounted, ref } from 'vue';

const leaferRef = ref(null);

onMounted(() => {
  const leafer = new Leafer({
    view: leaferRef.value,
    width: 400,
    height: 400,
  });

  const compressText = new CompressText();

  leafer.add(compressText);

  const text = '[自(じ)][分(ぶん)]フィールドの[表(おもて)][側(がわ)][攻(こう)][撃(げき)][表(ひょう)][示(じ)]モンスター１[体(たい)]を[対(たい)][象(しょう)]としてこのカードを[発(はつ)][動(どう)]できる。①：このカードが[魔(ま)][法(ほう)]＆[罠(トラップ)]ゾーンに[存(そん)][在(ざい)]する[限(かぎ)]り、そのモンスターは[戦(せん)][闘(とう)]・[効(こう)][果(か)]では[破(は)][壊(かい)]されない。そのモンスターがフィールドから[離(はな)]れた[場(ば)][合(あい)]にこのカードは[破(は)][壊(かい)]される。';

  console.log(splitBreakWordWithBracket(text));

  compressText.set({
    text: text,
    width: 360,
    // height: 100,
    lineHeight: 1.7,
    x: 20,
    y: 20,
  });
});
</script>

<style lang="scss">
.leafer {
  display: inline-flex;
  border: 1px solid;
}
</style>
