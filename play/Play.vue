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

        <div class="compare-grid">
          <div class="compare-card">
            <div class="compare-card-header">
              <h3>新版本</h3>
              <span class="compare-tag compare-tag-new">current</span>
            </div>
            <div ref="newLeaferRef" class="leafer-host" />
          </div>

          <div class="compare-card">
            <div class="compare-card-header">
              <h3>旧版本</h3>
              <span class="compare-tag compare-tag-old">yugioh-card@1.9.0</span>
            </div>
            <div ref="oldLeaferRef" class="leafer-host" />
          </div>
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
            <span>rtTop</span>
            <el-input-number v-model="editableConfig.rtTop" :step="1" />
          </label>

          <label class="field">
            <span>smallFontSize</span>
            <el-input-number v-model="editableConfig.smallFontSize" :min="8" :step="1" />
          </label>

          <label class="field">
            <span>对齐方式</span>
            <el-select v-model="editableConfig.textAlign">
              <el-option label="两端对齐" value="justify" />
              <el-option label="居中" value="center" />
              <el-option label="右对齐" value="right" />
            </el-select>
          </label>

          <label class="field field-switch">
            <span>首行压缩</span>
            <el-switch v-model="editableConfig.firstLineCompress" />
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
          <div class="info-header">
            <h3>分词结果</h3>
            <span :class="['compare-chip', isSplitConsistent ? 'compare-chip-match' : 'compare-chip-diff']">
              {{ isSplitConsistent ? '新旧一致' : '新旧不一致' }}
            </span>
          </div>

          <div class="split-compare-grid">
            <div>
              <h4>新版本</h4>
              <div class="token-list">
                <div
                  v-for="row in splitDiffRows"
                  :key="`new-${row.index}`"
                  :class="['token-row', row.isDifferent && 'token-row-diff']"
                >
                  <span class="token-index">{{ row.index + 1 }}</span>
                  <span class="token-value">{{ row.newToken ?? '∅' }}</span>
                </div>
              </div>
            </div>
            <div>
              <h4>旧版本</h4>
              <div class="token-list">
                <div
                  v-for="row in splitDiffRows"
                  :key="`old-${row.index}`"
                  :class="['token-row', row.isDifferent && 'token-row-diff']"
                >
                  <span class="token-index">{{ row.index + 1 }}</span>
                  <span class="token-value">{{ row.oldToken ?? '∅' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { Leafer } from 'leafer-unified';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { CompressText as OldCompressText } from 'yugioh-card-v190/src/compress-text/compress-text';
import { splitBreakWordWithBracket as splitBreakWordWithBracketOld } from 'yugioh-card-v190/src/compress-text/split-break-word';
import { CompressText as NewCompressText, splitBreakWordWithBracket as splitBreakWordWithBracketNew } from '/packages/src/compress-text';

const rubyPlainTextPattern = /\[([^\[\]()]+)\(([^\[\]()]*)\)]/g;

const newLeaferRef = ref(null);
const oldLeaferRef = ref(null);
const newCompressTextRef = ref(null);
const oldCompressTextRef = ref(null);
const selectedCaseId = ref('ruby-basic');

const previewBaseConfig = {
  text: '',
  width: 0,
  height: 0,
  y: 14,
  lineHeight: 1.5,
  fontSize: 32,
  rtFontSize: 16,
  rtTop: -8,
  textAlign: 'justify',
  firstLineCompress: false,
  smallFontSize: 16,
  autoSmallSize: false,
};

const editableConfig = reactive({ ...previewBaseConfig });

// 移除假名
const removeKanjiKana = (text = '') => {
  return text.replace(rubyPlainTextPattern, '$1');
};

const cases = [
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
    label: '首行压缩',
    description: '验证首行强制压缩到一行时，后续行布局是否稳定。',
    config: {
      text: '【[永(えい)][続(ぞく)][魔(ま)][法(ほう)]】[自(じ)][分(ぶん)]は１ターンに１[度(ど)]、[手(て)][札(ふだ)]を１[枚(まい)][捨(す)]てて[発(はつ)][動(どう)]できる。デッキから[魔(ま)][法(ほう)]カード１[枚(まい)]を[手(て)][札(ふだ)]に[加(くわ)]える。',
      width: 420,
      firstLineCompress: true,
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
    description: '验证中文夹长 Latin 连续串时，新版会强制断开而不是越过画布。',
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

const splitResultNew = computed(() => {
  return splitBreakWordWithBracketNew(editableConfig.text);
});

const splitResultOld = computed(() => {
  return splitBreakWordWithBracketOld(editableConfig.text);
});

const splitDiffRows = computed(() => {
  const maxLength = Math.max(splitResultNew.value.length, splitResultOld.value.length);

  return Array.from({ length: maxLength }, (_, index) => {
    const newToken = splitResultNew.value[index];
    const oldToken = splitResultOld.value[index];

    return {
      index,
      newToken,
      oldToken,
      isDifferent: newToken !== oldToken,
    };
  });
});

const isSplitConsistent = computed(() => {
  return splitDiffRows.value.every(row => !row.isDifferent);
});

const currentConfigText = computed(() => {
  const { text, ...rest } = editableConfig;
  return JSON.stringify(rest, null, 2);
});

const loadCaseConfig = () => {
  Object.assign(editableConfig, previewBaseConfig, currentCase.value.config);
};

const resetCurrentCase = () => {
  loadCaseConfig();
};

const updatePreview = () => {
  if (!newCompressTextRef.value || !oldCompressTextRef.value) {
    return;
  }

  const nextConfig = {
    ...previewBaseConfig,
    ...editableConfig,
  };

  newCompressTextRef.value.set({ ...nextConfig });
  oldCompressTextRef.value.set({ ...nextConfig });
};

onMounted(() => {
  const newLeafer = new Leafer({
    view: newLeaferRef.value,
    grow: true,
  });

  const oldLeafer = new Leafer({
    view: oldLeaferRef.value,
    grow: true,
  });

  const newCompressText = new NewCompressText();
  const oldCompressText = new OldCompressText();
  newCompressTextRef.value = newCompressText;
  oldCompressTextRef.value = oldCompressText;

  newLeafer.add(newCompressText);
  oldLeafer.add(oldCompressText);

  updatePreview();
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

.compare-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.compare-card {
  padding: 16px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.78);
}

.compare-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.compare-card-header h3,
.split-compare-grid h4 {
  margin: 0;
}

.compare-tag,
.compare-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.compare-tag-new,
.compare-chip-match {
  color: #0f766e;
  background: rgba(20, 184, 166, 0.14);
}

.compare-tag-old {
  color: #92400e;
  background: rgba(245, 158, 11, 0.18);
}

.compare-chip-diff {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.14);
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

.split-compare-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 12px;
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

.token-row-diff {
  background: rgba(239, 68, 68, 0.12);
  outline: 1px solid rgba(239, 68, 68, 0.22);
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

  .inspector-grid,
  .compare-grid,
  .split-compare-grid {
    grid-template-columns: 1fr;
  }

  .leafer-host {
    min-height: 320px;
  }
}
</style>
