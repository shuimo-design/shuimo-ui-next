<script setup lang="ts">
// 样式必须从 SFC 自己引：rolldown 会跳过只做转发的 index.ts，那里的副作用引入会被丢掉
import "./border.css";
import { computed, reactive, useTemplateRef, watch } from "vue";
import { useBrushBorder } from "../../ink/stroke";
import type { BorderProps, BorderSides, BorderSlots } from "./types";

defineOptions({ name: "MBorder" });

const {
  seed = 1,
  strokeWidth = 2,
  roughness = 0.35,
  flyingWhite = 0.06,
  tag = "div",
  border = true,
  // 显式 default undefined 是为了绕开 Boolean 转型（不传会变 false），不传要听 border 的
  top = undefined,
  right = undefined,
  bottom = undefined,
  left = undefined,
  mask = false,
  color,
  padding,
} = defineProps<BorderProps>();
defineSlots<BorderSlots>();

/** 单边开关优先，其次是 border 对象里的值，最后是 border 布尔值 */
const sides = computed<Required<BorderSides>>(() => {
  const fallback = typeof border === "boolean" ? border : undefined;
  const pick = (own: boolean | undefined, key: keyof BorderSides) =>
    own ?? (typeof border === "object" ? (border[key] ?? true) : (fallback ?? true));
  return {
    top: pick(top, "top"),
    right: pick(right, "right"),
    bottom: pick(bottom, "bottom"),
    left: pick(left, "left"),
  };
});

const root = useTemplateRef<HTMLElement>("root");
// 用 reactive 包一层：useBrushBorder 每次落笔时才读这些字段，props 改了下一次 update 就能拿到新值
const strokeOptions = reactive({
  seed: computed(() => seed),
  strokeWidth: computed(() => strokeWidth),
  roughness: computed(() => roughness),
  flyingWhite: computed(() => flyingWhite),
  sides: sides,
});
const { update } = useBrushBorder(root, strokeOptions);
watch(
  () => [seed, strokeWidth, roughness, flyingWhite, sides.value] as const,
  () => update(),
  { flush: "post" },
);

const style = computed(() => {
  const s: Record<string, string> = {};
  if (color) s["--m-border-color"] = color;
  if (padding !== undefined)
    s["--m-border-padding"] = typeof padding === "number" ? `${padding}px` : padding;
  return s;
});
</script>

<template>
  <component
    :is="tag"
    ref="root"
    class="m-border"
    :class="{
      'm-border--mask': mask,
      'm-border--no-top': !sides.top,
      'm-border--no-right': !sides.right,
      'm-border--no-bottom': !sides.bottom,
      'm-border--no-left': !sides.left,
    }"
    :style="style"
  >
    <slot />
  </component>
</template>
