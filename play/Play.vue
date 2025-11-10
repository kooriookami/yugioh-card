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

  const text = '测1111111111111111试「[测试(test)]」[测试(test)][测试(test)][测试(test)]';

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
