<template>
  <div class="yugioh-card-container">
    <div class="yugioh-card">
      yugioh-card
    </div>
    <div class="form">
      <div class="form-header">
        <div class="form-title">
          <span>游戏王卡片 - Yugioh Card</span>
          <Icon
            class="github-icon"
            icon="ri:github-fill"
            width="24"
            height="24"
            @click="toGithub"
          />
        </div>
        <div class="form-description">
          <span>一个使用 Canvas 渲染游戏王卡片的工具</span>
        </div>
      </div>

      <div class="form-main" />
    </div>
  </div>
</template>

<script setup>
  import { Icon } from '@iconify/vue';
  import { ref } from 'vue';

  function toGithub() {
    open('https://github.com/kooriookami/yugioh-card');
  }
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
    }

    .form {
      height: 100%;
      overflow: auto;
      width: 400px;
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

        ::v-deep(.el-form) {
          .el-form-item {
            .tip {
              margin-left: 10px;
              color: var(--normal-color);
            }
          }
        }
      }
    }
  }
</style>
