<script setup lang="ts">
import { ref } from "vue";
import { MButton, MLoading, vLoading } from "@shuimo-design/ui";

const isLoading = ref(true);
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">普通加载 / 可调速 / 带文字</p>
      <div class="demo__row">
        <MLoading />
        <MLoading :speed="800" :size="28" />
        <MLoading text="正在加载…" :seed="4" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">指示器插槽</p>
      <MLoading>
        <template #indicator>
          <span class="loading-demo__indicator" />
        </template>
      </MLoading>
    </div>

    <div class="demo__block">
      <p class="demo__caption">v-loading 指令：宿主内容照常挂载，宿主会被加上 position: relative</p>
      <div class="demo__row">
        <MButton @click="isLoading = !isLoading">切换 loading 状态</MButton>
      </div>
      <div v-loading="isLoading" class="loading-demo__box" data-loading-text="加载中">
        <p>需要注意这块内容是会 mount 的。</p>
        <p>父元素若原本是 static，会被加上 .m-loading-parent。</p>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">组件方式的遮罩：自己写 v-if 和 position: relative</p>
      <div class="loading-demo__box" style="position: relative">
        <p>一段被盖住的内容。</p>
        <MLoading v-if="isLoading" mask text="稍候" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading-demo__box {
  width: 320px;
  height: 140px;
  padding: 12px;
  border: 1px dashed var(--m-border);
}
.loading-demo__indicator {
  display: block;
  width: 20px;
  height: 20px;
  border: 3px solid transparent;
  border-top-color: var(--m-accent);
  border-radius: 50%;
  animation: loading-demo-spin 1s linear infinite;
}
@keyframes loading-demo-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
