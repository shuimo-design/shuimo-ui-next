<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from "vue";
import {
  buttonBrush,
  buttonClasses,
  buttonInert,
  buttonInk,
  isSolidButton,
  type ButtonEmits,
  type ButtonProps,
  type ButtonSlots,
} from "@shuimo-design/core";
import { observeSize } from "@shuimo-design/core";
import { IconLoading } from "../../icons";
import { useBrushBorder } from "../../ink";

defineOptions({ name: "MButton" });

// 必须直接解构 defineProps：先存成变量再解构，编译出来是 setup 期的一次性快照，
// props 改了不会重渲染（@vue/compiler-sfc 3.5.42 实测）
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

const root = useTemplateRef<HTMLElement>("root");
const solid = computed(() => isSolidButton(type));
useBrushBorder(root, buttonBrush(solid.value));

// 毛边色块要按按钮实际尺寸生成，只能挂载后量；服务端和水合首帧都是 0×0，渲染出的是没有色块的朴素版
const size = ref({ width: 0, height: 0 });
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
  if (root.value) observeSize(root.value, (box) => (size.value = box), "border-box");
});

const ink = computed(() =>
  buttonInk({
    solid: solid.value,
    width: size.value.width,
    height: size.value.height,
    registered: mounted.value,
  }),
);

function onClick(event: MouseEvent) {
  if (buttonInert({ disabled, loading })) {
    event.preventDefault();
    return;
  }
  emit("click", event);
}
</script>

<template>
  <component
    :is="href ? 'a' : 'button'"
    ref="root"
    :class="buttonClasses({ type, disabled, loading })"
    :style="ink.style"
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
