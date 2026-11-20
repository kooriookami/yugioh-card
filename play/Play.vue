<template>
  <div class="play">
    <header class="test-heading">
      <h1>文本排版调试</h1>
      <p class="test-description">切换样例并修改参数，观察注音、换行、压缩与分词结果。</p>
      <el-radio-group v-model="selectedCaseId" class="case-list" aria-label="排版样例">
        <el-radio-button
          v-for="item in cases"
          :key="item.id"
          :value="item.id"
        >
          {{ item.label }}
        </el-radio-button>
      </el-radio-group>
      <p v-if="fontLoadError" class="test-status" role="status">{{ fontLoadError }}</p>
    </header>

    <div class="content">
      <section class="test-panel">
        <header class="preview-header">
          <h2>{{ currentCase.label }}</h2>
          <span :class="['render-metric', getRenderMetricClass(renderCost)]">
            最近一次渲染 {{ formatRenderCost(renderCost) }}
          </span>
          <p class="test-description">{{ currentCase.description }}</p>
        </header>
        <div class="test-stage">
          <div ref="leaferRef" class="leafer-host" :style="{ minWidth: Math.max(540, editableConfig.width ?? 0) + 'px' }" />
        </div>
      </section>

      <section class="test-panel">
        <div class="info-header">
          <h2>编辑参数</h2>
          <el-button size="small" plain @click="resetCurrentCase">
            恢复样例默认值
          </el-button>
        </div>

        <div class="editor-grid">
          <label class="field field-full">
            <span>文本内容</span>
            <el-input
              v-model="editableConfig.text"
              type="textarea"
              :rows="8"
              resize="vertical"
              placeholder="输入带注音的文本，例如 [自(じ)][分(ぶん)]フィールド"
            />
          </label>

          <label class="field">
            <span>宽度</span>
            <el-input-number v-model="editableConfig.width" :min="0" :step="10" />
          </label>

          <label class="field">
            <span>高度</span>
            <el-input-number v-model="editableConfig.height" :min="0" :step="10" />
          </label>

          <label class="field">
            <span>fontSize</span>
            <el-input-number v-model="editableConfig.fontSize" :min="8" :step="1" />
          </label>

          <label class="field">
            <span>lineHeight</span>
            <el-input-number
              v-model="editableConfig.lineHeight"
              :min="0.5"
              :step="0.01"
              :precision="2"
            />
          </label>

          <label class="field">
            <span>rtFontSize</span>
            <el-input-number v-model="editableConfig.rtFontSize" :min="8" :step="1" />
          </label>

          <label class="field">
            <span>rtOffsetY</span>
            <el-input-number v-model="editableConfig.rtOffsetY" :step="1" />
          </label>

          <label class="field">
            <span>smallFontSize</span>
            <el-input-number v-model="editableConfig.smallFontSize" :min="8" :step="1" />
          </label>

          <label class="field">
            <span>对齐方式</span>
            <el-select v-model="editableConfig.textAlign">
              <el-option label="左对齐" value="left" />
              <el-option label="居中" value="center" />
              <el-option label="右对齐" value="right" />
              <el-option label="两端对齐" value="justify" />
            </el-select>
          </label>

          <label class="field">
            <span>指定段压成一行</span>
            <el-select v-model="editableConfig.compressSegments" multiple>
              <el-option
                v-for="number in segmentCount"
                :key="number"
                :label="'第 ' + number + ' 段'"
                :value="number"
              />
            </el-select>
          </label>

          <label class="field field-switch">
            <span>自动缩小</span>
            <el-switch v-model="editableConfig.autoSmallSize" />
          </label>
        </div>
      </section>

      <section class="inspector-grid" aria-label="排版详情">
        <div class="test-panel">
          <h2>当前渲染参数</h2>
          <pre class="test-report">{{ currentConfigText }}</pre>
        </div>

        <div class="test-panel">
          <h2>纯文本参考</h2>
          <div class="plain-text">{{ plainText }}</div>
        </div>

        <div class="test-panel field-full">
          <h2>分词结果</h2>
          <div class="test-report token-list">
            <div
              v-for="(token, index) in splitResult"
              :key="index"
              class="token-row"
            >
              <span class="token-index">{{ index + 1 }}</span>
              <span class="token-value">{{ token }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { Leafer } from 'leafer-unified';
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue';
import { CompressText } from '/packages/src/compress-text';
import { parseBreakText, splitBreakWordWithBracket } from '/packages/src/compress-text/breaking/split-break-word.ts';
import { loadFontBrowser } from '/packages/src/utils/font-loader.ts';
import { resourcePath } from '@/assets/resource-path.js';

const rubyPlainTextPattern = /\[([^\[\]()]+)\(([^\[\]()]*)\)]/g;

const leaferRef = ref(null);
const leaferInstanceRef = shallowRef(null);
const compressTextRef = shallowRef(null);
const selectedCaseId = ref('ruby-basic');

const previewBaseConfig = {
  text: '',
  fontFamily: 'ygo-sc',
  sideBearingRatio: 1,
  width: 0,
  height: 0,
  y: 14,
  lineHeight: 1.5,
  fontSize: 32,
  rtFontSize: 16,
  rtOffsetY: -8,
  textAlign: 'justify',
  compressSegments: [],
  smallFontSize: 16,
  autoSmallSize: false,
};

const editableConfig = reactive({ ...previewBaseConfig });
const segmentCount = computed(() => 1 + parseBreakText(editableConfig.text).filter(group => group.some(item => item.text === '\n')).length);
const renderCost = ref(null);
const fontLoadError = ref('');

// 移除假名
const removeKanjiKana = (text = '') => {
  return text.replace(rubyPlainTextPattern, '$1');
};

const cases = [
  {
    id: 'jp-spacing',
    label: '日文留白',
    description: '检查汉字、假名、长音符与混合数字的留白、注音及换行。',
    config: {
      text: '[青眼(ブルーアイズ)]の[白龍(ホワイト・ドラゴン)]\nコーヒー スーパー 々〆゛゜ゝゞー\n０１２３４５６７８９ AV。',
      fontFamily: 'ygo-jp',
      sideBearingRatio: 0.5,
      width: 540,
    },
  },
  {
    id: 'jp-original-spacing',
    label: '日文原始留白',
    description: '使用相同字体和文字，对照原始留白下的占宽与换行。',
    config: {
      text: '[青眼(ブルーアイズ)]の[白龍(ホワイト・ドラゴン)]\nコーヒー スーパー 々〆゛゜ゝゞー\n０１２３４５６７８９ AV。',
      fontFamily: 'ygo-jp',
      width: 540,
    },
  },
  {
    id: 'ruby-basic',
    label: '注音长文本',
    description: '验证标准注音布局、最后一行压缩和对齐。',
    config: {
      text: '[自(じ)][分(ぶん)]フィールドの[表(おもて)][側(がわ)][攻(こう)][撃(げき)][表(ひょう)][示(じ)]モンスター１[体(たい)]を[対(たい)][象(しょう)]としてこのカードを[発(はつ)][動(どう)]できる。①：このカードが[魔(ま)][法(ほう)]＆[罠(トラップ)]ゾーンに[存(そん)][在(ざい)]する[限(かぎ)]り、そのモンスターは[戦(せん)][闘(とう)]・[効(こう)][果(か)]では[破(は)][壊(かい)]されない。そのモンスターがフィールドから[離(はな)]れた[場(ば)][合(あい)]にこのカードは[破(は)][壊(かい)]される。',
      width: 400,
    },
  },
  {
    id: 'first-line-compress',
    label: '首段压缩',
    description: '验证首段压成一行时，后续段的布局是否稳定。',
    config: {
      text: '【[永(えい)][続(ぞく)][魔(ま)][法(ほう)]】[自(じ)][分(ぶん)]は１ターンに１[度(ど)]、[手(て)][札(ふだ)]を１[枚(まい)][捨(す)]てて[発(はつ)][動(どう)]できる。デッキから[魔(ま)][法(ほう)]カード１[枚(まい)]を[手(て)][札(ふだ)]に[加(くわ)]える。',
      width: 420,
      compressSegments: [1],
    },
  },
  {
    id: 'auto-small-size',
    label: '自动缩小',
    description: '验证高度受限时是否进入 autoSmallSize，并保持注音与正文关系。',
    config: {
      text: '[这(これ)]はテスト[用(よう)]の[長(なが)]い[文(ぶん)]です。[高(たか)]さが[足(た)]りない[場(ば)][合(あい)]に、[文(も)][字(じ)][全(ぜん)][体(たい)]が[自(じ)][動(どう)][的(てき)]に[縮(ちぢ)]むかを[確(かく)][認(にん)]します。②：さらに[別(べつ)]の[効(こう)][果(か)]テキストを[追(つい)][加(か)]して、[複(ふく)][数(すう)][行(ぎょう)]での[挙(きょ)][動(どう)]を[見(み)]ます。',
      width: 320,
      height: 92,
      autoSmallSize: true,
    },
  },
  {
    id: 'manual-break',
    label: '显式换行',
    description: '验证换行符、项目符号和相邻注音片段的分词行为。',
    config: {
      text: '●[相(あい)][手(て)]フィールドのカード１[枚(まい)]を[対(たい)][象(しょう)]として[発(はつ)][動(どう)]できる。\n①：そのカードを[破(は)][壊(かい)]する。\n②：[自(じ)][分(ぶん)]はデッキから１[枚(まい)][引(ひ)]く。',
      width: 360,
    },
  },
  {
    id: 'long-unbreakable',
    label: '超长连续串',
    description: '验证中文夹长 Latin 连续串时的强制换行行为。',
    config: {
      text: '汉字汉字汉字汉字汉字汉字汉字汉字汉字longlonglonglonglonglonglonglonglonglonglong汉字汉字汉字汉字汉字汉字汉字汉字汉字汉字',
      width: 360,
    },
  },
];

const currentCase = computed(() => {
  return cases.find(item => item.id === selectedCaseId.value) ?? cases[0];
});

const plainText = computed(() => {
  return removeKanjiKana(editableConfig.text);
});

const splitResult = computed(() => {
  return splitBreakWordWithBracket(editableConfig.text);
});

const currentConfigText = computed(() => {
  const { text, sideBearingRatio, ...rest } = editableConfig;
  return JSON.stringify(rest, null, 2);
});

const loadCaseConfig = () => {
  Object.assign(editableConfig, previewBaseConfig, currentCase.value.config);
};

const resetCurrentCase = () => {
  loadCaseConfig();
};

const getCurrentPreviewConfig = () => {
  return {
    ...previewBaseConfig,
    ...editableConfig,
  };
};

const measureRenderCost = callback => {
  const startTime = performance.now();
  callback();
  return performance.now() - startTime;
};

const formatRenderCost = value => {
  if (typeof value !== 'number') {
    return '--';
  }

  return `${value.toFixed(2)} ms`;
};

const getRenderMetricClass = value => {
  if (typeof value !== 'number') {
    return 'render-metric-idle';
  }
  if (value >= 50) {
    return 'render-metric-danger';
  }
  if (value >= 16) {
    return 'render-metric-warn';
  }

  return 'render-metric-ok';
};

const updatePreview = () => {
  if (!compressTextRef.value) {
    return;
  }

  const nextConfig = getCurrentPreviewConfig();

  renderCost.value = measureRenderCost(() => {
    compressTextRef.value.set({ ...nextConfig });
  });
};

onMounted(async () => {
  const leafer = new Leafer({
    view: leaferRef.value,
    grow: true,
  });
  const compressText = new CompressText();

  leaferInstanceRef.value = leafer;
  compressTextRef.value = compressText;
  leafer.add(compressText);

  updatePreview();
  try {
    await loadFontBrowser(`${resourcePath}/yugioh/font`);
    document.body.dataset.testState = 'ready';
  } catch (error) {
    fontLoadError.value = `字体加载失败：${error.message}`;
    document.body.dataset.testState = 'failed';
  }
});

onBeforeUnmount(() => {
  leaferInstanceRef.value?.destroy();
});

watch(selectedCaseId, () => {
  loadCaseConfig();
});

watch(editableConfig, () => {
  updatePreview();
}, { deep: true });

loadCaseConfig();
</script>

<style scoped>
.play {
  --el-color-primary: var(--test-accent);
  --el-color-primary-light-3: #9c7e60;
  --el-color-primary-light-5: #b9a38e;
  --el-color-primary-light-7: #d7c7b9;
  --el-color-primary-light-9: var(--test-soft);
  --el-color-primary-dark-2: var(--test-accent-hover);
  --el-border-color: var(--test-border);
  --el-text-color-regular: var(--test-text);
}

.case-list {
  gap: .5rem;
  margin-top: .25rem;
}

.case-list :deep(.el-radio-button__inner) {
  border: 1px solid var(--test-border);
  border-radius: .5rem;
  box-shadow: none;
}

.content {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  align-items: start;
  gap: 1rem;
}

.preview-header,
.info-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: .4rem .75rem;
  margin-bottom: .65rem;
}

.preview-header h2,
.info-header h2 {
  margin: 0;
}

.preview-header p {
  flex-basis: 100%;
}

.leafer-host {
  min-height: 26.25rem;
  padding: .55rem;
}

.render-metric {
  color: var(--test-muted);
  font: 12px/1.5 var(--test-mono);
}

.render-metric-ok {
  color: var(--test-pass);
}

.render-metric-warn {
  color: var(--test-accent);
}

.render-metric-danger {
  color: var(--test-fail);
}

.editor-grid,
.inspector-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .85rem;
}

.field {
  display: grid;
  gap: .35rem;
  min-width: 0;
}

.field > span {
  color: var(--test-muted);
  font-size: 13px;
  font-weight: 650;
}

.field :deep(.el-input-number) {
  width: 100%;
  max-width: 11rem;
}

.field-full,
.inspector-grid {
  grid-column: 1 / -1;
}

.field-switch {
  grid-template-columns: 1fr auto;
  align-items: center;
}

.plain-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.token-list {
  display: grid;
  gap: .35rem;
}

.token-row {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr);
  gap: .5rem;
  padding: .4rem .6rem;
  border-radius: .45rem;
  background: var(--test-surface);
}

.token-index {
  color: var(--test-muted);
}

.token-value {
  overflow-wrap: anywhere;
}

@media (max-width: 990px) {
  .content {
    grid-template-columns: minmax(0, 1fr);
  }

  .leafer-host {
    min-height: 20rem;
  }
}

@media (max-width: 580px) {
  .inspector-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
