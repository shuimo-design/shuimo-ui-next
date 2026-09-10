<script setup lang="ts">
import "./tooltip.css";
import { computed, useId, useTemplateRef, watch } from "vue";
import { inkTipUrl } from "../../ink/assets/tip";
import { usePopoverTrigger } from "../../internal/popover-trigger";
import MPopper from "../../internal/popper/MPopper.vue";
import { MBorder } from "../border";
import type { TooltipEmits, TooltipProps, TooltipSlots } from "./types";

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
const show = defineModel<boolean>("show", { default: false });

const tooltipId = useId();
const wrapper = useTemplateRef<HTMLElement>("wrapper");
const float = useTemplateRef<HTMLElement>("float");
const arrowEl = useTemplateRef<HTMLElement>("arrowEl");

const tooltip = usePopoverTrigger({
  trigger: () => trigger,
  disabled: () => disabled,
  openDelay: () => openDelay,
  closeDelay: () => closeDelay,
  disableClickAway: () => disableClickAway,
  show,
  wrapper,
  panel: float,
  onChange: (open) => emit("visibleChange", open),
});
const { reference, wrapOnly, open } = tooltip;

const tip = computed(() => inkTipUrl({ seed, width: 12, height: 6 }));
const floatStyle = computed(() => ({ "--m-tooltip-tip": `url("${tip.value}")` }));

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
    class="m-tooltip"
    :class="{
      'm-tooltip--wrap': wrapOnly,
      'm-tooltip--open': open,
      'm-tooltip--disabled': disabled,
    }"
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
      <MBorder class="m-tooltip__panel" :seed="seed" :stroke-width="1.5">
        <slot name="content">{{ content }}</slot>
      </MBorder>
      <span v-if="arrow" ref="arrowEl" class="m-tooltip__arrow" aria-hidden="true" />
    </div>
  </MPopper>
</template>
