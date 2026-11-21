<template>
  <main class="playground-page">
    <h1>Playground</h1>
    <ClientOnly>
      <CardPlayground
        v-if="mounted"
        :locale="lang"
        :initial-example="initialExample"
        :resource-path="withBase('/card-assets')"
        :reference-base="withBase(`${localePath}/reference/cards/`)"
      />
    </ClientOnly>
  </main>
</template>

<script setup>
import { useData, withBase } from 'vitepress';
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';

const CardPlayground = defineAsyncComponent(() => import('../../../src/components/YugiohCard.vue'));
const { lang, localeIndex } = useData();
const localePath = computed(() => localeIndex.value === 'root' ? '' : `/${localeIndex.value}`);
const mounted = ref(false);
const initialExample = ref('');

onMounted(() => {
  initialExample.value = new URLSearchParams(window.location.search).get('example') ?? '';
  mounted.value = true;
});
</script>

<style scoped>
.playground-page {
  max-width: 1440px;
  margin-inline: auto;
  padding: clamp(22px, 4vw, 44px) clamp(14px, 3vw, 38px) 44px;
}

.playground-page h1 {
  color: var(--vp-c-text-1);
  font-size: clamp(27px, 3vw, 36px);
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 1.2;
}
</style>
