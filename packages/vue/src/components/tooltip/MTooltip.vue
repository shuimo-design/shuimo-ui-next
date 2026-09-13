<script setup lang="ts">
import { computed, useId, useTemplateRef, watch } from "vue";
import {
  createPopoverTrigger,
  tooltipClasses,
  tooltipTipStyle,
  TOOLTIP_BORDER_STROKE,
  type TooltipEmits,
  type TooltipProps,
  type TooltipSlots,
} from "@shuimo-design/core";
import MPopper from "../../internal/popper/MPopper.vue";
import { MBorder } from "../border";
import { useController } from "../../runtime";

defineOptions({ name: "MTooltip", inheritAttrs: false });

const {
  placement = "bottom",
  trigger = "hover",
  content,
  disabled = false,
  arrow = true,
  offset = 6,
  openDelay = 80,
  closeDelay = 80,
  disableClickAway = false,
  teleport = true,
  seed = 1,
} = defineProps<TooltipProps>();
const emit = defineEmits<TooltipEmits>();
defineSlots<TooltipSlots>();
/** 是否显示提示；不传也能用，由 trigger 自己管 */
const show = defineModel<boolean>("show", { default: false });

const tooltipId = useId();
const wrapper = useTemplateRef<HTMLElement>("wrapper");
const float = useTemplateRef<HTMLElement>("float");
const arrowEl = useTemplateRef<HTMLElement>("arrowEl");

// 开合时序（延时、hover / click / focus、Escape、点外面）全在 core 的控制器里，
// React 那边用的是同一份；显隐状态仍归 v-model 持有，控制器只负责请求改变
const { controller: tooltip, state } = useController(createPopoverTrigger, () => ({
  trigger,
  disabled,
  openDelay,
  closeDelay,
  disableClickAway,
  show: show.value,
  onChange: (open: boolean) => {
    show.value = open;
    emit("visibleChange", open);
  },
}));
watch(
  [wrapper, float],
  () => {
    tooltip.setWrapper(wrapper.value);
    tooltip.setPanel(float.value);
  },
  { immediate: true, flush: "post" },
);
// 壳里的内容换了要重新挑参照元素
watch(
  () => [show.value, content],
  () => tooltip.refresh(),
  { flush: "post" },
);

const open = computed(() => show.value && !disabled);
const reference = computed(() => state.value.reference);
const floatStyle = computed(() => tooltipTipStyle({ seed }));

// 提示打开时挂到参照元素的 aria-describedby 上，读屏聚焦到它就会读出提示
watch([reference, open], ([el, isOpen], [prevEl]) => {
  if (prevEl && prevEl !== el) prevEl.removeAttribute("aria-describedby");
  if (!el) return;
  if (isOpen) el.setAttribute("aria-describedby", tooltipId);
  else el.removeAttribute("aria-describedby");
});

defineExpose({
  show: () => tooltip.setOpen(true),
  hide: () => tooltip.setOpen(false),
  toggle: () => tooltip.setOpen(!show.value),
});
</script>

<template>
  <span
    ref="wrapper"
    :class="tooltipClasses({ wrapOnly: state.wrapOnly, open, disabled })"
    v-bind="$attrs"
    @mouseenter="tooltip.onTriggerEnter"
    @mouseleave="tooltip.onTriggerLeave"
    @click="tooltip.onTriggerClick"
    @focusin="tooltip.onTriggerFocusin"
    @focusout="tooltip.onTriggerFocusout"
  >
    <slot />
  </span>
  <MPopper
    :open="open"
    :reference="reference"
    :placement="placement"
    :offset="offset"
    :teleport="teleport"
    :arrow="arrow ? arrowEl : null"
    @click-outside="tooltip.onClickOutside"
  >
    <div
      :id="tooltipId"
      ref="float"
      class="m-tooltip__float"
      role="tooltip"
      :style="floatStyle"
      @mouseenter="tooltip.onPanelEnter"
      @mouseleave="tooltip.onPanelLeave"
      @focusout="tooltip.onPanelFocusout"
    >
      <MBorder class="m-tooltip__panel" :seed="seed" :stroke-width="TOOLTIP_BORDER_STROKE">
        <slot name="content">{{ content }}</slot>
      </MBorder>
      <span v-if="arrow" ref="arrowEl" class="m-tooltip__arrow" aria-hidden="true" />
    </div>
  </MPopper>
</template>
