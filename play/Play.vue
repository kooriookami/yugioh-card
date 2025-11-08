<template>
  <div ref="leaferRef" class="leafer" />
</template>

<script setup>
import { CompressText } from '/packages/yugioh-card/src/compress-text';
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

  const text = '你congratulation<b>好</b>ation，卡片是：「[测试(test)]」。[测试(test)][测试(test)][测试(test)]';

  compressText.set({
    text: text,
    width: 360,
    height: 100,
    x: 20,
    y: 20,
    // textAlign: 'left',
  });
});
</script>

<style lang="scss">
.leafer {
  display: inline-flex;
  border: 1px solid;
}
</style>
