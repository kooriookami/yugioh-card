<template>
  <div class="yugioh-card-container">
    <div class="yugioh-card">
      <div ref="card" class="card" />
    </div>
    <div class="form">
      <div class="form-header">
        <div class="form-title">
          <span>Yugioh Card</span>
          <Icon
            class="github-icon"
            icon="ri:github-fill"
            width="24"
            height="24"
            @click="toGithub"
          />
        </div>
        <div class="form-description">
          <span>Canvas UI to render yugioh cards</span>
        </div>
      </div>

      <div class="form-main">
        <el-form :model="form" label-width="auto">
          <el-form-item label="template">
            <el-select
              v-model="form.card"
              placeholder="choose template"
              @change="changeCard"
            >
              <el-option label="Fuwalos" value="en-fuwalos" />
            </el-select>
          </el-form-item>
          <el-form-item label="card data">
            <json-editor-vue
              v-model="jsonData"
              style="width: 100%"
              mode="text"
              v-bind="jsonOption"
            />
          </el-form-item>
        </el-form>

        <div class="button-group">
          <el-button type="primary" @click="exportImage"
            >export image</el-button
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue';
import {
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
  watch,
} from 'vue';
import { YugiohCard } from 'yugioh-card';
import JsonEditorVue from 'json-editor-vue';
import yugiohDemo from '@/assets/demo/yugioh-demo';
import enFuwalos from '@/assets/demo/en-fuwalos';

const card = ref(null);
const cardLeaf = shallowRef(null);
const form = reactive({
  card: 'yugioh',
  data: {},
});
const jsonData = ref('');
const jsonOption = reactive({
  mainMenuBar: false,
  statusBar: false,
});

onMounted(() => {
  changeCard();
});

onBeforeUnmount(() => {
  cardLeaf.value?.leafer.destroy();
});

const changeCard = () => {
  cardLeaf.value?.leafer.destroy();
  let Card;
  switch (form.card) {
    case 'en-fuwalos':
      form.data = enFuwalos;
      Card = YugiohCard;
      break;
    default:
      form.data = enFuwalos;
      Card = YugiohCard;
  }
  cardLeaf.value = new Card({
    view: card.value,
    data: form.data,
    resourcePath:
      process.env.NODE_ENV === 'production'
        ? 'https://raw.githubusercontent.com/kooriookami/yugioh-card/refs/heads/master/src/assets/yugioh-card'
        : 'src/assets/yugioh-card',
  });
  jsonData.value = form.data;
};

const exportImage = () => {
  cardLeaf.value.leafer.export('card.png', {
    screenshot: true,
    pixelRatio: devicePixelRatio,
  });
};

watch(
  () => jsonData.value,
  () => {
    try {
      form.data = JSON.parse(jsonData.value);
      cardLeaf.value.setData(form.data);
    } catch (e) {}
  },
);

const toGithub = () => {
  open('https://github.com/kooriookami/yugioh-card');
};
</script>

<style lang="scss" scoped>
.yugioh-card-container {
  height: 100vh;
  display: flex;
  overflow: hidden;

  .yugioh-card {
    height: 100%;
    overflow: auto;
    flex-grow: 1;
    position: relative;
    padding: 20px;

    .card {
      display: inline-block;
      vertical-align: top;
    }
  }

  .form {
    height: 100%;
    overflow: auto;
    width: 600px;
    flex-shrink: 0;
    border-left: 1px solid var(--border-color);

    .form-header {
      padding: 30px 20px;
      font-size: 18px;
      font-weight: bold;
      border-bottom: 1px solid var(--border-color);

      .form-title {
        display: flex;
        flex-wrap: wrap;
        align-items: center;

        .github-icon {
          margin-left: 5px;
          cursor: pointer;
        }
      }

      .form-description {
        margin-top: 20px;
        font-size: 12px;
        font-weight: normal;
        color: var(--info-color);
      }
    }

    .form-main {
      padding: 20px;

      .button-group {
        margin-top: 20px;

        .el-button {
          width: 100%;
        }
      }
    }
  }
}
</style>
