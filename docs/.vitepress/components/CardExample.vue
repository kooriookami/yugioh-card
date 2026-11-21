<template>
  <section ref="container" class="card-example" :aria-label="labels.preview">
    <div class="example-card">
      <img
        :src="withBase(`/card-previews/${example.id}.webp`)"
        :alt="labels.examples[example.id]"
        :class="{ 'is-hidden': live }"
        :width="type === 'field-center' ? 372 : 349"
        :height="type === 'field-center' ? 520 : 508"
      >
      <div
        ref="view"
        class="example-canvas"
        :class="{ 'is-hidden': !live }"
        role="img"
        :aria-label="labels.examples[example.id]"
        :aria-hidden="!live"
      />
    </div>
    <p v-if="errorMessage" class="preview-error" role="status">
      {{ labels.renderError }} · {{ errorMessage }}
    </p>
  </section>
</template>

<script setup>
import { useData, withBase } from 'vitepress';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { cardTypes, findExample } from '../../../src/assets/demo/examples.js';
import { cardPlaygroundLabels } from '../../../src/components/card-playground-labels.js';

const props = defineProps({ type: String });
const { lang } = useData();
const labels = computed(() => cardPlaygroundLabels[lang.value]);
const example = findExample(props.type);
const container = ref(null);
const view = ref(null);
const live = ref(false);
const errorMessage = ref('');
let observer;
let card;
let disposed = false;

const render = async () => {
  try {
    const constructors = await import('yugioh-card');
    if (disposed) return;
    const ExampleCard = constructors[cardTypes[example.type]];
    // Preview at the same CSS width as the static image, including on high-DPI displays.
    const { data } = example;
    card = new ExampleCard({
      view: view.value,
      resourcePath: withBase('/card-assets'),
      data: { ...data, renderScale: 0.25 * window.devicePixelRatio },
    });
    await card.ready;
    if (!disposed) live.value = true;
  } catch (error) {
    if (!disposed) errorMessage.value = error.message;
  }
};

onMounted(() => {
  observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    void render();
  }, { rootMargin: '120px' });
  observer.observe(container.value);
});

onBeforeUnmount(() => {
  disposed = true;
  observer?.disconnect();
  card?.leafer.destroy(true);
});
</script>

<style scoped>
.card-example {
  display: grid;
  grid-template-columns: minmax(0, 348px);
  justify-content: center;
  gap: 12px;
  margin: 20px 0 28px;
  padding: clamp(12px, 4vw, 28px);
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background-color: var(--card-preview-background);
  background-image:
    linear-gradient(var(--card-preview-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--card-preview-grid) 1px, transparent 1px);
  background-size: 20px 20px;
}

.example-card {
  display: grid;
  min-width: 0;
  align-items: center;
  justify-items: center;
}

.example-card > * {
  grid-area: 1 / 1;
  width: 100%;
}

.example-card img {
  height: auto;
  filter: drop-shadow(0 7px 16px rgb(0 0 0 / 18%));
}

.example-canvas :deep(canvas) {
  display: block;
  max-width: 100%;
  height: auto !important;
  filter: drop-shadow(0 7px 16px rgb(0 0 0 / 18%));
}

.is-hidden {
  visibility: hidden;
}

.preview-error {
  margin: 0;
  text-align: center;
  color: var(--vp-c-danger-1);
  font-size: 13px;
  overflow-wrap: anywhere;
}
</style>
