<script setup lang="ts">
// 内部浮层原语：Select / DatePicker / Tooltip / Popover 共用。只管定位、传送和淡入，不管触发方式。
import "./popper.css";
import {
  arrow as arrowMiddleware,
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating,
  type Placement,
} from "@floating-ui/vue";
import { onClickOutside } from "@vueuse/core";
import { computed, toRef, useTemplateRef } from "vue";

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

const floating = useTemplateRef<HTMLElement>("floating");
const referenceRef = toRef(() => reference ?? null);
const arrowRef = toRef(() => arrow ?? null);

const {
  floatingStyles,
  isPositioned,
  middlewareData,
  placement: resolvedPlacement,
} = useFloating(referenceRef, floating, {
  placement: toRef(() => placement),
  strategy: "fixed",
  // 用 top/left 摆位置而不是 transform：入场动画要用 transform 做缩放，
  // 两者同属性会让"从 (0,0) 到目标位置"的定位变化被当成动画，浮层从左上角飞过来。
  // 算出坐标前用 opacity 0 藏住（不用 visibility：那会让面板里的格子接不住焦点）
  transform: false,
  open: toRef(() => open),
  whileElementsMounted: autoUpdate,
  middleware: computed(() => [
    offset(gap),
    flip(),
    shift({ padding: 8 }),
    // 箭头要避开圆角，离浮层边缘至少留 6px
    ...(arrow ? [arrowMiddleware({ element: arrowRef, padding: 6 })] : []),
    ...(matchWidth
      ? [
          size({
            apply({ rects, elements }) {
              elements.floating.style.width = `${rects.reference.width}px`;
            },
          }),
        ]
      : []),
  ]),
});

/** 箭头沿交叉轴的位置；没有箭头时变量为空，等于不声明 */
const arrowStyle = computed(() => {
  const data = middlewareData.value.arrow;
  return {
    "--m-popper-arrow-x": data?.x != null ? `${data.x}px` : "",
    "--m-popper-arrow-y": data?.y != null ? `${data.y}px` : "",
  };
});

onClickOutside(
  floating,
  (event) => {
    if (open) emit("clickOutside", event);
  },
  { ignore: [referenceRef] },
);

defineExpose({ floating });
</script>

<template>
  <Teleport to="body" :disabled="!teleport">
    <Transition name="m-popper">
      <div
        v-if="open"
        ref="floating"
        class="m-popper"
        :style="[floatingStyles, arrowStyle, isPositioned ? undefined : { opacity: 0 }]"
        :data-placement="resolvedPlacement"
        :role="role"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>
