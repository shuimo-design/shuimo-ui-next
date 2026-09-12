<script setup lang="ts">
import { computed, useSlots } from "vue";
import {
  gridClasses,
  gridStyle,
  resolveGridCells,
  type GridProps,
  type GridSlots,
} from "@shuimo-design/core";
import { RenderNode } from "../../runtime/render-node";
import MCell from "./MCell.vue";
import { collectCells, type MGridProps, type VueGridCell } from "./collect";

defineOptions({ name: "MGrid" });

const {
  cells: cellsProp,
  w,
  h,
  gap,
  colGap,
  rowGap,
  gapRotate,
  direction = "row",
  cols,
} = defineProps<MGridProps>();
const slots = useSlots() as GridSlots;
defineSlots<GridSlots>();

/**
 * 格子的来源：传了 cells 就用传的，没传才从子组件收集。
 * 收集在渲染期完成，所以 gapRotate 按下标分角这件事不用等挂载。
 */
const cells = computed(() =>
  resolveGridCells(cellsProp ?? collectCells(slots.default?.()), {
    w,
    h,
    direction,
    cols,
    gapRotate,
  }),
);
</script>

<template>
  <div
    :class="gridClasses({ direction, cols })"
    :style="gridStyle({ w, h, gap, colGap, rowGap, gapRotate, direction, cols })"
  >
    <MCell v-for="cell in cells" :key="cell.key" v-bind="cell.props">
      <RenderNode v-if="cell.content !== undefined" :node="cell.content" />
    </MCell>
  </div>
</template>
