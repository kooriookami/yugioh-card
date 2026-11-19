<template>
  <div class="play">
    <div class="toolbar">
      <h1 class="title">CompressText Playground</h1>
      <p class="subtitle">切换不同样例，检查注音、压缩、换行和自动缩小行为。</p>
      <el-radio-group v-model="selectedCaseId" class="case-list">
        <el-radio-button
          v-for="item in cases"
          :key="item.id"
          :value="item.id"
        >
          {{ item.label }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <div class="content">
      <section class="preview-panel">
        <div class="preview-header">
          <h2>{{ currentCase.label }}</h2>
          <p>{{ currentCase.description }}</p>
        </div>

        <div class="render-preview">
          <div class="render-header">
            <h3>当前预览</h3>
            <span :class="['render-metric', getRenderMetricClass(renderCost)]">
              最近一次渲染 {{ formatRenderCost(renderCost) }}
            </span>
          </div>
          <div ref="leaferRef" class="leafer-host" />
        </div>
      </section>

      <section class="editor-panel info-block">
        <div class="info-header">
          <h3>编辑参数</h3>
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

      <section class="inspector-grid">
        <div class="info-block">
          <h3>当前渲染参数</h3>
          <pre>{{ currentConfigText }}</pre>
        </div>

        <div class="info-block">
          <h3>纯文本参考</h3>
          <div class="plain-text">{{ plainText }}</div>
        </div>

        <div class="info-block">
          <h3>分词结果</h3>
          <div class="token-list">
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
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { CompressText } from '/packages/src/compress-text';
import { parseBreakText, splitBreakWordWithBracket } from '/packages/src/compress-text/breaking/split-break-word.ts';
import { loadFontBrowser } from '/packages/src/utils/font-loader.ts';
import { resourcePath } from '@/assets/resource-path.js';

const rubyPlainTextPattern = /\[([^\[\]()]+)\(([^\[\]()]*)\)]/g;

const leaferRef = ref(null);
const leaferInstanceRef = ref(null);
const compressTextRef = ref(null);
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

onMounted(() => {
  loadFontBrowser(`${resourcePath}/yugioh/font`).catch(error => console.error('Playground font loading failed', error));
  const leafer = new Leafer({
    view: leaferRef.value,
    grow: true,
  });
  const compressText = new CompressText();

  leaferInstanceRef.value = leafer;
  compressTextRef.value = compressText;
  leafer.add(compressText);

  updatePreview();
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

<style lang="scss">
.play {
  min-height: 100vh;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(215, 232, 255, 0.8), transparent 28%),
    linear-gradient(135deg, #f5f1e8 0%, #eef4f8 100%);
}

.toolbar {
  max-width: 1400px;
  margin: 0 auto 24px;
}

.title {
  margin: 0;
  font-size: 32px;
  line-height: 1.1;
}

.subtitle {
  margin: 8px 0 0;
  color: rgba(0, 0, 0, 0.65);
}

.case-list {
  margin-top: 16px;
}

.content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.preview-panel,
.editor-panel,
.info-block {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 24px 80px rgba(50, 70, 90, 0.12);
  backdrop-filter: blur(10px);
}

.preview-panel {
  padding: 24px;
}

.editor-panel {
  padding: 20px;
}

.render-preview {
  margin-top: 20px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.78);
}

.render-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.render-header h3 {
  margin: 0;
}

.render-metric {
  font-size: 12px;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.62);
}

.render-metric-idle {
  color: rgba(15, 23, 42, 0.45);
}

.render-metric-ok {
  color: #0f766e;
}

.render-metric-warn {
  color: #b45309;
}

.render-metric-danger {
  color: #b91c1c;
}

.preview-header h2,
.info-block h3 {
  margin: 0;
}

.preview-header p {
  margin: 8px 0 0;
  color: rgba(0, 0, 0, 0.65);
}

.leafer-host {
  min-height: 420px;
  padding: 20px;
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(241, 245, 249, 0.9)),
    linear-gradient(90deg, rgba(148, 163, 184, 0.2) 1px, transparent 1px),
    linear-gradient(rgba(148, 163, 184, 0.2) 1px, transparent 1px);
  background-size: auto, 24px 24px, 24px 24px;
}

.info-block {
  padding: 18px;
  background: rgba(248, 250, 252, 0.86);
}

.inspector-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 12px;
}

.field {
  display: grid;
  gap: 8px;
}

.field > span {
  font-size: 13px;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.8);
}

.field-full {
  grid-column: 1 / -1;
}

.field-switch {
  align-items: center;
  grid-template-columns: 1fr auto;
}

.field-switch > span {
  align-self: center;
}

.info-block pre,
.plain-text {
  margin: 12px 0 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.6;
}

.info-block pre {
  max-height: 260px;
  overflow: auto;
}

.token-list {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.token-row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.75);
}

.token-index {
  font-size: 12px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.5);
}

.token-value {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Consolas', 'SFMono-Regular', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.inspector-grid > .info-block:last-child {
  grid-column: 1 / -1;
}

@media (max-width: 960px) {
  .play {
    padding: 16px;
  }

  .content {
    grid-template-columns: 1fr;
  }

  .editor-grid {
    grid-template-columns: 1fr;
  }

  .inspector-grid {
    grid-template-columns: 1fr;
  }

  .leafer-host {
    min-height: 320px;
  }
}
</style>
