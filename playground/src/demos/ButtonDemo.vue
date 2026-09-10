<script setup lang="ts">
import { ref } from "vue";
import { MButton, MMessage } from "@shuimo-design/ui";

const count = ref(0);
const loading = ref(false);

function onEvent() {
  MMessage.success("点击事件触发");
}

function submit() {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 1600);
}
</script>

<template>
  <div class="demo">
    <p class="demo__caption">普通按钮</p>
    <div class="demo__row">
      <MButton @click="count++">普通按钮 {{ count }}</MButton>
      <MButton text="文字属性" />
    </div>

    <p class="demo__caption">类型</p>
    <div class="demo__row">
      <MButton>默认</MButton>
      <MButton type="primary">主要</MButton>
      <MButton type="confirm">确认</MButton>
      <MButton type="error">错误</MButton>
      <MButton type="warning">警告</MButton>
      <MButton type="text">文字</MButton>
    </div>

    <p class="demo__caption">禁用</p>
    <div class="demo__row">
      <MButton disabled>禁用按钮</MButton>
      <MButton type="primary" disabled>主要</MButton>
      <MButton type="confirm" disabled>确认</MButton>
      <MButton type="error" disabled>错误</MButton>
      <MButton type="warning" disabled>警告</MButton>
      <MButton type="text" disabled>文字</MButton>
    </div>

    <p class="demo__caption">事件</p>
    <div class="demo__row">
      <MButton @click="onEvent">点击事件</MButton>
    </div>

    <p class="demo__caption">加载中</p>
    <div class="demo__row">
      <MButton type="primary" :loading="loading" @click="submit">
        {{ loading ? "提交中" : "点我提交" }}
      </MButton>
      <MButton loading>加载</MButton>
      <MButton type="confirm" loading>确认</MButton>
    </div>

    <p class="demo__caption">链接与原生类型</p>
    <div class="demo__row">
      <MButton href="https://shuimo.design">链接</MButton>
      <MButton href="https://shuimo.design" disabled>禁用链接</MButton>
      <MButton native-type="submit" type="confirm">submit</MButton>
    </div>

    <p class="demo__caption">修改大小：覆盖 --m-button-height / --m-button-width</p>
    <div class="demo__row">
      <MButton class="button-demo__large">默认</MButton>
      <MButton class="button-demo__large" type="primary">主要</MButton>
    </div>
  </div>
</template>

<style scoped>
.button-demo__large {
  --m-button-height: 80px;
  --m-button-width: 180px;
}
</style>
