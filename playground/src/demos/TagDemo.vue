<script setup lang="ts">
import { ref } from "vue";
import { MTag } from "@shuimo-design/ui";

const tags = ref(["朱砂", "花青", "藤黄", "赭石"]);
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">普通标签</p>
      <div class="demo__row">
        <MTag>普通标签</MTag>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">类型</p>
      <div class="demo__row">
        <MTag>默认</MTag>
        <MTag type="primary">主要</MTag>
        <MTag type="success">确认</MTag>
        <MTag type="danger">错误</MTag>
        <MTag type="warn">警告</MTag>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">自定义颜色：color 属性，或直接覆盖 --m-tag-color</p>
      <div class="demo__row">
        <MTag color="#951c48">菜头紫</MTag>
        <MTag style="--m-tag-color: #2f6b5a">竹青</MTag>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">尺寸</p>
      <div class="demo__row">
        <MTag size="sm">小</MTag>
        <MTag>默认</MTag>
        <MTag size="lg">大</MTag>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">可关闭 / 禁用</p>
      <div class="demo__row">
        <MTag
          v-for="tag in tags"
          :key="tag"
          type="primary"
          closable
          @close="tags = tags.filter((t) => t !== tag)"
        >
          {{ tag }}
        </MTag>
        <MTag v-if="tags.length === 0" @click="tags = ['朱砂', '花青', '藤黄', '赭石']">
          都关了，点我恢复
        </MTag>
        <MTag disabled closable>禁用</MTag>
      </div>
    </div>
  </div>
</template>
