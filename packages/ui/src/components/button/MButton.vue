<script setup lang="ts">
// 样式必须从 SFC 自己引：rolldown 会跳过只做转发的 index.ts，那里的副作用引入会被丢掉
import "./button.css";
import { computed, useTemplateRef } from "vue";
import { useElementSize } from "@vueuse/core";
import { IconLoading } from "../../icons";
import { inkScaleUrl } from "../../ink/assets/scale";
import { inkShapeUrl } from "../../ink/assets/shape";
import { inkVarBindings } from "../../ink/registry";
import { useBrushBorder } from "../../ink/stroke";
import type { ButtonEmits, ButtonProps, ButtonSlots } from "./types";

defineOptions({ name: "MButton" });

const {
  type = "default",
  text = "",
  disabled = false,
  loading = false,
  href,
  nativeType = "button",
} = defineProps<ButtonProps>();
const emit = defineEmits<ButtonEmits>();
defineSlots<ButtonSlots>();

const tag = computed(() => (href ? "a" : "button"));
const root = useTemplateRef<HTMLElement>("root");
const solid = computed(() => type !== "text");
// 文字型按钮没有边框，不落笔；其余类型套一圈深墨笔触边框，对应旧库的手绘 border-image。
// 旧框四角是收住的，不出头，所以把拐角出头压到最小
useBrushBorder(root, { strokeWidth: 3, seed: 3, overshoot: 0.5, wobble: 0.6, enabled: solid });

// 色块本身也撕成毛边：按按钮实际尺寸生成遮罩（8px 分桶缓存），色块边缘在笔触框下若隐若现
const { width, height } = useElementSize(root, undefined, { box: "border-box" });
const shape = computed(() =>
  solid.value && width.value && height.value
    ? inkShapeUrl(width.value, height.value, { seed: 3, raggedness: 0.4, corner: 0.06 })
    : undefined,
);
// 旧库色块上那层鱼鳞纹，固定瓦片，整个模块只生成一次
const scale = inkScaleUrl();
// 鱼鳞纹瓦片全局一张、毛边遮罩按尺寸分桶：走素材登记，同一张图在样式表里只写一次，元素上只挂属性；
// 登记不了（SSR）才内联。文字型按钮不铺鱼鳞纹，"none" 不是图，仍旧内联
const ink = computed(() =>
  inkVarBindings({
    "--m-button-scale": solid.value ? scale.url : undefined,
    "--m-button-shape": shape.value?.url,
  }),
);
const style = computed(() => ({
  ...ink.value.style,
  ...(solid.value ? {} : { "--m-button-scale": "none" }),
  "--m-button-scale-size": `${scale.width}px ${scale.height}px`,
  "--m-button-shape-pad": shape.value ? `${shape.value.padding}px` : undefined,
}));

function onClick(event: MouseEvent) {
  if (disabled || loading) {
    event.preventDefault();
    return;
  }
  emit("click", event);
}
</script>

<template>
  <component
    :is="tag"
    ref="root"
    class="m-button"
    :class="[`m-button--${type}`, { 'm-button--disabled': disabled, 'm-button--loading': loading }]"
    :style="style"
    v-bind="ink.attrs"
    :href="href"
    :type="href ? undefined : nativeType"
    :disabled="href ? undefined : disabled"
    :aria-disabled="disabled || undefined"
    :aria-busy="loading || undefined"
    @click="onClick"
  >
    <IconLoading v-if="loading" class="m-button__spinner" />
    <span class="m-button__label"
      ><slot>{{ text }}</slot></span
    >
  </component>
</template>
