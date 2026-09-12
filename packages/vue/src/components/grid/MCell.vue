<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";
import { useSize } from "../../runtime";
import {
  cellBrush,
  cellBrushEnabled,
  cellGeometry,
  createCellShift,
  type CellComponentProps,
  type CellSlots,
} from "@shuimo-design/core";
import { useBrushBorder } from "../../ink";
import { useController } from "../../runtime";

defineOptions({ name: "MCell" });

// 必须直接从 defineProps 上解构：先存成 props 再解构的话默认值编译不进 props 选项，
// border 这种布尔项会被 Vue 转型成 false 救不回来
const {
  w,
  h,
  border = false,
  points,
  a,
  b,
  c,
  d,
  span,
  offset,
  shiftAngle,
} = defineProps<CellComponentProps>();
defineSlots<CellSlots>();

const cellProps = computed<CellComponentProps>(() => ({
  w,
  h,
  border,
  points,
  a,
  b,
  c,
  d,
  span,
  offset,
  shiftAngle,
}));

const root = useTemplateRef<HTMLElement>("root");
const { width, height } = useSize(root, "border-box");
/** 挂载后才敢读引擎状态；服务端和水合首帧一律当作没开，两边输出才对得上 */
const mounted = ref(false);

// 往左压多少交给 core 的控制器：它会把这一次布局改动推到下一帧，不在尺寸回调里同步改
const { controller: shift, state: shiftState } = useController(createCellShift, () => ({
  height: height.value,
  angle: shiftAngle,
}));
onMounted(() => {
  mounted.value = true;
  shift.flush();
});
watch([height, () => shiftAngle], () => shift.flush(), { flush: "post" });

const geometry = computed(() =>
  cellGeometry({
    props: cellProps.value,
    width: width.value,
    height: height.value,
    shift: shiftState.value.shift,
    mounted: mounted.value,
  }),
);

// 直边格子的笔触边框；斜边格子换成 cellGeometry 里按角点生成的笔触多边形遮罩
useBrushBorder(root, {
  ...cellBrush(),
  enabled: computed(() => cellBrushEnabled(border, geometry.value.tilted)),
});
</script>

<template>
  <div ref="root" :class="geometry.classes" :style="geometry.style">
    <div
      class="m-cell__main"
      :style="geometry.clipPath ? { clipPath: geometry.clipPath } : undefined"
    >
      <slot />
    </div>
    <!-- 斜边格子默认皮肤的细线轮廓；水墨模式换成 ::before 上的笔触多边形遮罩 -->
    <svg v-if="geometry.outlinePoints" class="m-cell__outline" aria-hidden="true">
      <polygon :points="geometry.outlinePoints" />
    </svg>
  </div>
</template>
