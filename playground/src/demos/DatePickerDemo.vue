<script setup lang="ts">
import { ref } from "vue";
import { MDatePicker } from "@shuimo-design/ui";

// 旧文档示例
const plain = ref<string | Date | null>(null);
const month = ref<string | Date | null>(null);
// 旧版允许直接传 Date 对象，写回的是格式化字符串
const withDefault = ref<string | Date | null>(new Date());

// 新增能力
const year = ref<string | Date | null>("2026");
const formatted = ref<string | Date | null>("2026年09月09日");
const weekday = ref<string | Date | null>(null);
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">普通日期选择框</p>
      <div class="demo__row">
        <MDatePicker v-model="plain" />
        <span class="demo__hint">{{ plain ?? "未选" }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">月份选择框：type="month"，写回 YYYY-MM</p>
      <div class="demo__row">
        <MDatePicker v-model="month" type="month" />
        <span class="demo__hint">{{ month ?? "未选" }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">传递默认值：v-model 可以直接给 Date 对象</p>
      <div class="demo__row">
        <MDatePicker v-model="withDefault" />
        <span class="demo__hint">日期：{{ withDefault }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">年份选择 type="year"、自定义 format、禁用</p>
      <div class="demo__row">
        <MDatePicker v-model="year" type="year" />
        <MDatePicker v-model="formatted" format="YYYY年MM月DD日" />
        <MDatePicker :model-value="'2026-09-09'" disabled />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">周一起始 + disabled-date 禁掉周末 + 关掉清空按钮</p>
      <div class="demo__row">
        <MDatePicker
          v-model="weekday"
          :first-day-of-week="1"
          :disabled-date="(d: Date) => d.getDay() === 0 || d.getDay() === 6"
          :clearable="false"
          placeholder="周末不可选"
        />
        <span class="demo__hint">{{ weekday ?? "未选" }}</span>
      </div>
    </div>
  </div>
</template>
