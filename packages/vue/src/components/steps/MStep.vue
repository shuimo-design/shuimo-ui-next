<script setup lang="ts">
import { computed, inject, useTemplateRef } from "vue";
import {
  STEP_INDEX_DEFAULT,
  stepAriaCurrent,
  stepClasses,
  stepIsLast,
  stepIsVertical,
  stepLineOptions,
  stepOrdinal,
  stepStatus,
  stepStyle,
  type StepProps,
  type StepSlots,
} from "@shuimo-design/core";
import { useBrushLine } from "../divider/use-brush-line";
import { stepIndexKey, stepsKey } from "./context";

defineOptions({ name: "MStep" });

const { title, description, status: own = undefined } = defineProps<StepProps>();
defineSlots<StepSlots>();

const steps = inject(stepsKey, undefined);
const position = inject(stepIndexKey, undefined);

/** 单独使用（不在 MSteps 里）时就是唯一的一步：序号 0，也没有后面的连接线 */
const index = computed(() => position?.value.index ?? STEP_INDEX_DEFAULT.index);
const count = computed(() => position?.value.count ?? STEP_INDEX_DEFAULT.count);
const isLast = computed(() => stepIsLast(index.value, count.value));
const vertical = computed(() => stepIsVertical(steps?.value));
const status = computed(() => stepStatus({ own, index: index.value, group: steps?.value }));

// 节点后那段连接线按实际长度单独生成；笔触参数（含跟序号走的种子）在 core，
// 方向是响应式的，交给 hook 的取值函数
const line = useTemplateRef<HTMLElement>("line");
useBrushLine(line, { ...stepLineOptions(index.value), vertical: () => vertical.value });

// 勾、叉、墨团、一笔圆四张素材挂在根上，节点的伪元素拿它们当遮罩
const inkStyle = stepStyle();
</script>

<template>
  <div
    :class="stepClasses({ status, last: isLast })"
    :style="inkStyle"
    role="listitem"
    :aria-current="stepAriaCurrent(status)"
  >
    <div class="m-step__node" aria-hidden="true">
      <slot name="icon">
        <span v-if="status === 'finish'" class="m-step__mark m-step__mark--check" />
        <span v-else-if="status === 'error'" class="m-step__mark m-step__mark--cross" />
        <span v-else class="m-step__number">{{ stepOrdinal(index) }}</span>
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
