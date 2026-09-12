<script setup lang="ts">
import { computed, useTemplateRef, watch } from "vue";
import { createFloating, floatingStyle, observeOutside, type Placement } from "@shuimo-design/core";
import { onScopeDispose } from "vue";
import { useController } from "../../runtime";

export interface PopperProps {
  /** 是否显示 */
  open: boolean;
  /** 参照元素 */
  reference: HTMLElement | null | undefined;
  /** floating-ui 的 placement，默认 bottom-start */
  placement?: Placement;
  /** 与参照元素的间距 px，默认 6 */
  offset?: number;
  /** 浮层宽度跟随参照元素 */
  matchWidth?: boolean;
  /** 传送到 body；默认 true。关掉时渲染在原地（用于测试或受限容器） */
  teleport?: boolean;
  /** 浮层根元素的 role */
  role?: string;
  /** 箭头元素：传了就参与定位，算出的坐标写成浮层根上的 --m-popper-arrow-x / -y */
  arrow?: HTMLElement | null;
}

const {
  open,
  reference,
  placement = "bottom-start",
  offset: gap = 6,
  matchWidth = false,
  teleport = true,
  role,
  arrow,
} = defineProps<PopperProps>();

const emit = defineEmits<{
  /** 点在浮层与参照元素之外 */
  clickOutside: [event: PointerEvent];
}>();

defineSlots<{ default?: () => unknown }>();

const floatingEl = useTemplateRef<HTMLElement>("floating");

// 定位全在 core 的控制器里（底下是框架无关的 @floating-ui/dom），React 那边用的是同一份
const { controller, state } = useController(createFloating, () => ({
  placement,
  offset: gap,
  matchWidth,
  open,
}));
watch(
  [floatingEl, () => reference, () => arrow],
  () => {
    controller.setFloating(floatingEl.value);
    controller.setReference(reference ?? null);
    controller.setArrow(arrow ?? null);
  },
  { immediate: true, flush: "post" },
);

const style = computed(() => floatingStyle(state.value));

onScopeDispose(
  observeOutside(
    () => floatingEl.value,
    (event) => {
      if (open) emit("clickOutside", event);
    },
    { ignore: () => [reference ?? null] },
  ),
);

defineExpose({ floating: floatingEl });
</script>

<template>
  <Teleport to="body" :disabled="!teleport">
    <Transition name="m-popper">
      <div
        v-if="open"
        ref="floating"
        class="m-popper"
        :style="style"
        :data-placement="state.placement"
        :role="role"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>
