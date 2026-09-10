<script setup lang="ts">
import { ref } from "vue";
import { MPagination } from "@shuimo-design/ui";

const current = ref(1);
const big = ref(6);
const size = ref(20);
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">普通分页</p>
      <MPagination v-model:current="current" :total="11" />
      <p class="demo__hint">当前页：{{ current }}</p>
    </div>
    <div class="demo__block">
      <p class="demo__caption">页数多时折叠，带每页条数与跳页</p>
      <MPagination
        v-model:current="big"
        v-model:page-size="size"
        :total="1024"
        layout="total, sizes, prev, pager, next, jumper"
      />
      <p class="demo__hint">第 {{ big }} 页，每页 {{ size }} 条</p>
    </div>
    <div class="demo__block">
      <p class="demo__caption">不显示首末页、禁用</p>
      <MPagination
        :current="8"
        :total="300"
        :show-edge-page-num="false"
        layout="prev, pager, next"
      />
      <MPagination :current="2" :total="50" disabled />
    </div>
  </div>
</template>
