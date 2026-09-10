<script setup lang="ts">
import "./tag.css";
import { computed } from "vue";
import { inkMarkUrl } from "../../ink/assets/mark";
import { inkTagFrame } from "../../ink/assets/tag";
import { inkVarBindings } from "../../ink/registry";
import type { TagEmits, TagProps, TagSlots } from "./types";

defineOptions({ name: "MTag" });

const {
  type = "default",
  size = "md",
  color,
  closable = false,
  disabled = false,
  seed = 1,
} = defineProps<TagProps>();
const emit = defineEmits<TagEmits>();
defineSlots<TagSlots>();

// 底图是旧库三段手绘 SVG：左右收口按高度等比，中段横向平铺；写成组件变量，没开 ink 引擎时也是这个形
const frame = inkTagFrame();
// 三段底图每个标签都一样、叉号按种子分桶：走素材登记，同一张图在样式表里只写一次，
// 元素上只挂一个短属性；一页几十个标签不再各自内联一份几十 KB 的 data URL。登记不了（SSR）才退回内联
const ink = computed(() =>
  inkVarBindings({
    "--m-tag-left": frame.left,
    "--m-tag-body": frame.body,
    "--m-tag-right": frame.right,
    "--m-tag-cross": inkMarkUrl("cross", { seed, strokeWidth: 3 }),
  }),
);
const style = computed(() => ({
  ...ink.value.style,
  "--m-tag-cap-l": String(frame.leftRatio),
  "--m-tag-cap-r": String(frame.rightRatio),
  ...(color ? { "--m-tag-color": color } : {}),
}));

function onClose(event: MouseEvent) {
  event.stopPropagation();
  if (disabled) return;
  emit("close", event);
}
</script>

<template>
  <span
    class="m-tag"
    :class="[`m-tag--${type}`, `m-tag--${size}`, { 'm-tag--disabled': disabled }]"
    :style="style"
    v-bind="ink.attrs"
    @click="emit('click', $event)"
  >
    <span class="m-tag__label"><slot /></span>
    <button
      v-if="closable"
      type="button"
      class="m-tag__close"
      aria-label="关闭"
      :disabled="disabled"
      @click="onClose"
    >
      <span class="m-tag__cross" aria-hidden="true" />
    </button>
  </span>
</template>
