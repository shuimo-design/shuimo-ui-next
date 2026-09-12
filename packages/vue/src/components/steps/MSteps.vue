<script setup lang="ts">
import { computed, provide } from "vue";
import {
  stepsClasses,
  type StepsContextValue,
  type StepsProps,
  type StepsSlots,
} from "@shuimo-design/core";
import { stepsKey } from "./context";
import MStepSlots from "./step-slots";

defineOptions({ name: "MSteps" });

const {
  active = 0,
  direction = "horizontal",
  status = "process",
  simple = false,
} = defineProps<StepsProps>();
defineSlots<StepsSlots>();

// 整组配置一份发给所有步；纯值外面包 computed，props 变了子步骤跟着重算
provide(
  stepsKey,
  computed<StepsContextValue>(() => ({ active, direction, status, simple })),
);
</script>

<template>
  <div :class="stepsClasses({ direction, simple })" role="list">
    <!-- 序号由 children 的顺序决定，不再让每一步登记：登记表的顺序取决于 setup / effect 的执行时机，
         React 那边不保证它和 DOM 顺序一致，两个壳要数出同一套序号就只能都从 children 数 -->
    <MStepSlots><slot /></MStepSlots>
  </div>
</template>
