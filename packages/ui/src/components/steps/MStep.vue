<script setup lang="ts">
import "./steps.css";
import { computed, inject, onBeforeUnmount, useId, useTemplateRef } from "vue";
import { inkBlobUrl } from "../../ink/assets/blob";
import { inkEnsoUrl } from "../../ink/assets/enso";
import { inkMarkUrl } from "../../ink/assets/mark";
import { useBrushLine } from "../divider/use-brush-line";
import { stepsKey } from "./context";
import type { StepProps, StepSlots, StepStatus } from "./types";

defineOptions({ name: "MStep" });

const { title, description, status: statusProp = undefined } = defineProps<StepProps>();
defineSlots<StepSlots>();

const steps = inject(stepsKey, undefined);
const id = useId();
if (steps) onBeforeUnmount(steps.register(id));

/** 单独使用（不在 MSteps 里）时序号是 0，也没有后面的连接线 */
const index = computed(() => (steps ? steps.indexOf(id) : 0));
const isLast = computed(() => !steps || index.value >= steps.count.value - 1);
const vertical = computed(() => steps?.direction.value === "vertical");

// 状态优先取自己的 status；没传就按序号和 active 的关系推断，当前步用 MSteps 的 status
const status = computed<StepStatus>(() => {
  if (statusProp) return statusProp;
  if (!steps) return "wait";
  const active = steps.active.value;
  if (index.value < active) return "finish";
  if (index.value === active) return steps.status.value;
  return "wait";
});

// 节点后那段连接线按实际长度单独生成；种子跟序号走，几段等长的线也不会一模一样。
// 照老库的线画：笔直不抖（抖了像手写的歪线），细而干，靠飞白的断口和丝缕出枯笔的质感
const line = useTemplateRef<HTMLElement>("line");
useBrushLine(line, {
  thickness: 2,
  wobble: 0,
  roughness: 0.35,
  flyingWhite: 0.4,
  vertical: () => vertical.value,
  seed: 2 + index.value,
});

// 勾、叉是素材库一笔写出的记号，不开 ink 引擎也能用；墨团和一笔圆只在 m.ink 层出场
const inkStyle = {
  "--m-step-check": `url("${inkMarkUrl("check", { seed: 2, strokeWidth: 3 })}")`,
  "--m-step-cross": `url("${inkMarkUrl("cross", { seed: 2, strokeWidth: 3 })}")`,
  "--m-step-blob": `url("${inkBlobUrl({ seed: 4, size: 36, radius: 0.4, raggedness: 0.08 })}")`,
  "--m-step-enso": `url("${inkEnsoUrl({ seed: 3, size: 40, strokeWidth: 3, gap: 0.6 })}")`,
};
</script>

<template>
  <div
    class="m-step"
    :class="[`m-step--${status}`, { 'm-step--last': isLast }]"
    :style="inkStyle"
    role="listitem"
    :aria-current="status === 'process' ? 'step' : undefined"
  >
    <div class="m-step__node" aria-hidden="true">
      <slot name="icon">
        <span v-if="status === 'finish'" class="m-step__mark m-step__mark--check" />
        <span v-else-if="status === 'error'" class="m-step__mark m-step__mark--cross" />
        <span v-else class="m-step__number">{{ index + 1 }}</span>
      </slot>
    </div>
    <!-- 到下一步的连接线，最后一步没有；横向放节点右侧，纵向放节点下方 -->
    <div v-if="!isLast" ref="line" class="m-step__line" aria-hidden="true" />
    <div class="m-step__main">
      <div class="m-step__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div v-if="description || $slots.description" class="m-step__description">
        <slot name="description">{{ description }}</slot>
      </div>
    </div>
  </div>
</template>
