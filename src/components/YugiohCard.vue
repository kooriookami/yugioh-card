<template>
  <div class="playground">
    <div class="playground-toolbar">
      <div class="card-type-field">
        <span>{{ labels.cardType }}</span>
        <ElSelect
          :model-value="selectedExample.type"
          :options="cardTypeOptions"
          :aria-label="labels.cardType"
          :teleported="false"
          @change="changeCard"
        />
      </div>
      <a v-if="referenceBase" :href="`${referenceBase}${selectedExample.type}.html`">{{ labels.reference }} ↗</a>
    </div>

    <div class="playground-body">
      <section class="playground-panel" :aria-label="labels.preview">
        <div ref="preview" class="preview-surface">
          <div class="preview-content">
            <div ref="card" class="preview-card" :style="{ zoom: previewScale }" />
          </div>
        </div>
        <div class="preview-toolbar">
          <div class="preview-options">
            <ElButton
              :type="fitHeight ? 'primary' : ''"
              :plain="fitHeight"
              :aria-pressed="fitHeight"
              @click="fitHeight = true"
            >
              {{ labels.fit }}
            </ElButton>
            <ElButton
              :type="fitHeight ? '' : 'primary'"
              :plain="!fitHeight"
              :aria-pressed="!fitHeight"
              @click="fitHeight = false"
            >
              {{ labels.actual }}
            </ElButton>
          </div>
          <span class="render-status" :class="{ 'is-error': cardError }" role="status">
            {{ cardError ? `${labels.renderError} · ${cardError}` : cardPending ? labels.loading : labels.idle }}
          </span>
        </div>
      </section>

      <section class="playground-panel data-panel" :aria-label="labels.json">
        <h2>{{ labels.json }}</h2>
        <JsonEditorVue
          :key="editorRevision"
          :model-value="jsonData"
          mode="text"
          :debounce="0"
          :main-menu-bar="false"
          :status-bar="false"
          class="playground-editor"
          @update:model-value="updateJson"
        />
        <p v-if="jsonError" class="editor-status is-error" role="status">{{ jsonError }}</p>
        <p v-if="exportError" class="editor-status is-error" role="alert">{{ exportError }}</p>
        <p v-if="copyStatus" class="editor-status" role="status">{{ copyStatus }}</p>
        <div class="editor-toolbar">
          <ElButton @click="copyJson">{{ labels.copy }}</ElButton>
          <ElButton @click="changeCard(selectedExample.id)">{{ labels.reset }}</ElButton>
          <ElButton
            class="export-button"
            type="primary"
            :loading="exporting"
            :disabled="!cardInstance || !!jsonError || exporting"
            @click="exportImage"
          >
            {{ exporting ? labels.exporting : labels.export }}
          </ElButton>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ElButton, ElSelect } from 'element-plus';
import 'element-plus/es/components/button/style/css';
import 'element-plus/es/components/select/style/css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue';
import * as CardConstructors from 'yugioh-card';
import JsonEditorVue from 'json-editor-vue';
import { cardTypes, findExample } from '../assets/demo/examples.js';
import { cardPlaygroundLabels } from './card-playground-labels.js';

const props = defineProps({
  locale: { type: String, default: 'zh-CN' },
  resourcePath: { type: String, required: true },
  initialExample: { type: String, default: '' },
  referenceBase: { type: String, default: '' },
});

const labels = computed(() => cardPlaygroundLabels[props.locale]);
const cardTypeOptions = computed(() => Object.entries(labels.value.cardTypes).map(([value, label]) => ({ value, label })));
const selectedExample = shallowRef(findExample(props.initialExample));
const jsonData = ref('');
const jsonError = ref('');
const exportError = ref('');
const copyStatus = ref('');
const editorRevision = ref(0);

const card = ref(null);
const preview = ref(null);
const fitHeight = ref(true);
const previewSize = reactive({ width: 0, height: 0 });
const cardSize = reactive({ width: 0, height: 0 });
const previewScale = computed(() => {
  if (!fitHeight.value || !cardSize.width || !cardSize.height) return 1;
  return Math.max(0.01, Math.min(1, (previewSize.height - 48) / cardSize.height, (previewSize.width - 48) / cardSize.width));
});

let resizeObserver;
const cardInstance = shallowRef(null);
const cardPending = ref(false);
const cardError = ref('');
const exporting = ref(false);
let observedReady;
let exportRequest;

const trackReady = async () => {
  const current = cardInstance.value;
  if (!current) return;
  const ready = current.ready;
  if (ready === observedReady) return;
  observedReady = ready;
  cardPending.value = true;
  cardError.value = '';
  const isCurrent = () => current === cardInstance.value && ready === current.ready && !current.leafer.destroyed;
  try {
    await ready;
  } catch (error) {
    if (isCurrent()) cardError.value = error.message;
  } finally {
    if (isCurrent()) cardPending.value = false;
  }
};

const cancelExport = () => {
  exportRequest = null;
  exporting.value = false;
};

const changeCard = id => {
  cancelExport();
  cardInstance.value?.leafer.destroy(true);
  cardInstance.value = null;
  selectedExample.value = findExample(id);
  jsonData.value = JSON.stringify(selectedExample.value.data, null, 2);
  jsonError.value = '';
  exportError.value = '';
  copyStatus.value = '';
  cardPending.value = false;
  cardError.value = '';
  editorRevision.value++;

  try {
    const { type, data } = selectedExample.value;
    const Card = CardConstructors[cardTypes[type]];
    cardInstance.value = new Card({ view: card.value, resourcePath: props.resourcePath, data });
    void trackReady();
  } catch (error) {
    cardError.value = error.message;
  }
};

const updateJson = value => {
  if (value === jsonData.value) return;
  jsonData.value = value;
  jsonError.value = '';
  exportError.value = '';
  copyStatus.value = '';
  let data;
  try {
    data = JSON.parse(value);
  } catch (error) {
    jsonError.value = `${labels.value.syntaxError} · ${error.message}`;
    return;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    jsonError.value = labels.value.objectError;
    return;
  }
  try {
    cardInstance.value?.setData(data);
    void trackReady();
  } catch (error) {
    cardError.value = error.message;
  }
};

const copyJson = async () => {
  try {
    await navigator.clipboard.writeText(jsonData.value);
    copyStatus.value = labels.value.copied;
  } catch {
    copyStatus.value = labels.value.copyError;
  }
};

const exportImage = async () => {
  const current = cardInstance.value;
  if (!current || exporting.value || jsonError.value) return;
  const request = exportRequest = {};
  exporting.value = true;
  exportError.value = '';
  try {
    await current.ready;
    if (current !== cardInstance.value || current.leafer.destroyed || jsonError.value) return;
    await current.leafer.export(`${selectedExample.value.id}.png`, {
      screenshot: true,
      pixelRatio: devicePixelRatio,
    });
  } catch (error) {
    if (current !== cardInstance.value || current.leafer.destroyed) return;
    exportError.value = `${labels.value.exportError} · ${error.message}`;
  } finally {
    if (request === exportRequest) cancelExport();
  }
};

onMounted(() => {
  resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const size = entry.target === preview.value ? previewSize : cardSize;
      size.width = entry.contentRect.width;
      size.height = entry.contentRect.height;
    }
  });
  resizeObserver.observe(preview.value);
  resizeObserver.observe(card.value);
  changeCard(selectedExample.value.id);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  cancelExport();
  cardInstance.value?.leafer.destroy();
  cardInstance.value = null;
  cardPending.value = false;
  cardError.value = '';
});
</script>

<style scoped>
.playground {
  --workbench-border: var(--vp-c-divider, #d8d5cd);
  --workbench-text: var(--vp-c-text-1, #312c25);
  --workbench-muted: var(--vp-c-text-2, #62594f);
  --workbench-surface: var(--vp-c-bg, #fff);
  --workbench-accent: var(--vp-c-brand-1, #79532b);
  --el-color-primary: var(--workbench-accent);
  --el-color-primary-light-3: color-mix(in srgb, var(--workbench-accent) 78%, var(--workbench-surface));
  --el-color-primary-light-5: color-mix(in srgb, var(--workbench-accent) 52%, var(--workbench-surface));
  --el-color-primary-light-7: color-mix(in srgb, var(--workbench-accent) 32%, var(--workbench-surface));
  --el-color-primary-light-8: color-mix(in srgb, var(--workbench-accent) 20%, var(--workbench-surface));
  --el-color-primary-light-9: var(--vp-c-bg-soft, #f5eee5);
  --el-color-primary-dark-2: var(--vp-c-brand-2, #684321);
  --el-bg-color: var(--workbench-surface);
  --el-bg-color-overlay: var(--vp-c-bg-elv, var(--workbench-surface));
  --el-border-color: var(--workbench-border);
  --el-border-color-light: var(--workbench-border);
  --el-text-color-regular: var(--workbench-text);
  --el-text-color-placeholder: var(--workbench-muted);
  color: var(--workbench-text);
}

.playground-toolbar,
.preview-toolbar,
.editor-toolbar,
.preview-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.playground-toolbar {
  align-items: end;
  gap: 12px 18px;
  margin: 16px 0;
}

.card-type-field {
  display: grid;
  gap: 5px;
  flex: 1 1 160px;
  max-width: 240px;
  color: var(--workbench-muted);
  font-size: 13px;
  font-weight: 600;
}

.playground-toolbar a {
  margin: 0 0 8px auto;
  color: var(--workbench-accent);
  font-size: 14px;
  font-weight: 600;
}

.playground a:focus-visible {
  outline: 2px solid var(--workbench-accent);
  outline-offset: 2px;
}

.playground-body {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 16px;
}

.playground-panel {
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--workbench-border);
  border-radius: 12px;
  background: var(--workbench-surface);
}

.preview-surface {
  height: clamp(25rem, 65vh, 46rem);
  overflow: auto;
  background-color: var(--card-preview-background, #eeeae1);
  background-image:
    linear-gradient(var(--card-preview-grid, #ded7ca) 1px, transparent 1px),
    linear-gradient(90deg, var(--card-preview-grid, #ded7ca) 1px, transparent 1px);
  background-size: 20px 20px;
}

.preview-content {
  display: grid;
  width: max-content;
  min-width: 100%;
  min-height: 100%;
  padding: 24px;
  box-sizing: border-box;
  place-items: center;
}

.preview-card :deep(canvas) {
  display: block;
  filter: drop-shadow(0 13px 24px rgb(35 23 9 / 20%));
}

.preview-toolbar,
.editor-toolbar {
  padding: 10px 14px;
}

.preview-options {
  gap: 4px;
}

.preview-options .el-button + .el-button,
.editor-toolbar .el-button + .el-button {
  margin-inline-start: 0;
}

.render-status,
.editor-status {
  font-size: 13px;
  overflow-wrap: anywhere;
}

.render-status {
  color: var(--workbench-muted);
}

.is-error {
  color: var(--vp-c-danger-1, #b63424);
}

.data-panel h2 {
  margin: 0;
  padding: 13px 14px;
  color: var(--workbench-text);
  font-size: 15px;
  font-weight: 650;
}

.playground-editor {
  --jse-main-border: 0;
  --jse-background-color: var(--workbench-surface);
  --jse-text-color: var(--workbench-text);
  --jse-font-size-mono: 13px;
  --jse-font-family-mono: var(--vp-font-family-mono, ui-monospace, monospace);
  --jse-panel-background: var(--vp-c-bg-soft, #f7f5ef);
  flex: 1 1 auto;
  height: clamp(20rem, 57vh, 41rem);
  min-height: 250px;
  overflow: hidden;
  border-block: 1px solid var(--workbench-border);
}

:global(.dark .playground-editor) {
  --jse-theme: dark;
  --jse-delimiter-color: var(--workbench-muted);
  --jse-active-line-background-color: rgb(255 255 255 / 6%);
  --jse-menu-color: var(--workbench-text);
  --jse-key-color: #e4ba8b;
  --jse-value-color-string: #a8d2ad;
  --jse-value-color-number: #eacaa0;
  --jse-value-color-boolean: #b4c2ef;
  --jse-value-color-null: #d5addd;
  --jse-selection-background-color: #403528;
}

.editor-status {
  margin: 8px 14px 0;
}

.editor-toolbar {
  margin-top: auto;
}

.editor-toolbar .el-button.export-button {
  margin-inline-start: auto;
}

:global(.dark .playground .export-button) {
  --el-button-text-color: #221910;
  --el-button-hover-text-color: #221910;
  --el-button-active-text-color: #221910;
}

@media (max-width: 800px) {
  .playground-body {
    grid-template-columns: minmax(0, 1fr);
  }

  .preview-surface {
    height: clamp(19rem, 62vh, 35rem);
  }

  .card-type-field {
    max-width: none;
  }
}

@media (max-width: 420px) {
  .card-type-field {
    flex-basis: 100%;
  }
}
</style>
