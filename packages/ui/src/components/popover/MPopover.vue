<script setup lang="ts">
import "./popover.css";
import { computed, useId, useTemplateRef, watch } from "vue";
import { inkTipUrl } from "../../ink/assets/tip";
import { usePopoverTrigger } from "../../internal/popover-trigger";
import MPopper from "../../internal/popper/MPopper.vue";
import { MBorder } from "../border";
import type { PopoverEmits, PopoverProps, PopoverSlots } from "./types";

defineOptions({ name: "MPopover", inheritAttrs: false });

const {
  placement = "bottom",
  trigger = "click",
  content,
  disabled = false,
  arrow = true,
  offset = 8,
  openDelay = 0,
  closeDelay = 100,
  disableClickAway = false,
  teleport = true,
  seed = 1,
} = defineProps<PopoverProps>();
const emit = defineEmits<PopoverEmits>();
defineSlots<PopoverSlots>();
const show = defineModel<boolean>("show", { default: false });

const panelId = useId();
const wrapper = useTemplateRef<HTMLElement>("wrapper");
const float = useTemplateRef<HTMLElement>("float");
const arrowEl = useTemplateRef<HTMLElement>("arrowEl");

const popover = usePopoverTrigger({
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
const { reference, wrapOnly, open } = popover;

// 墨尖按种子生成一次；画在 float 上当变量，箭头元素拿它做遮罩
const tip = computed(() => inkTipUrl({ seed, width: 14, height: 7 }));
const floatStyle = computed(() => ({ "--m-popover-tip": `url("${tip.value}")` }));

// 点击触发时把展开状态标在参照元素上，读屏能知道这个按钮带着一个气泡
watch([reference, open, () => trigger], ([el, isOpen, kind], [prevEl]) => {
  if (prevEl && prevEl !== el) {
    prevEl.removeAttribute("aria-expanded");
    prevEl.removeAttribute("aria-controls");
  }
  if (!el) return;
  if (kind !== "click") {
    el.removeAttribute("aria-expanded");
    el.removeAttribute("aria-controls");
    return;
  }
  el.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) el.setAttribute("aria-controls", panelId);
  else el.removeAttribute("aria-controls");
});

defineExpose({
  show: () => popover.setOpen(true),
  hide: () => popover.setOpen(false),
  toggle: () => popover.setOpen(!show.value),
});
</script>

<template>
  <span
    ref="wrapper"
    class="m-popover"
    :class="{
      'm-popover--wrap': wrapOnly,
      'm-popover--open': open,
      'm-popover--disabled': disabled,
    }"
    v-bind="$attrs"
    @mouseenter="popover.onTriggerEnter"
    @mouseleave="popover.onTriggerLeave"
    @click="popover.onTriggerClick"
    @focusin="popover.onTriggerFocusin"
    @focusout="popover.onTriggerFocusout"
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
    @click-outside="popover.onClickOutside"
  >
    <div
      :id="panelId"
      ref="float"
      class="m-popover__float"
      :style="floatStyle"
      @mouseenter="popover.onPanelEnter"
      @mouseleave="popover.onPanelLeave"
      @focusout="popover.onPanelFocusout"
    >
      <MBorder class="m-popover__panel" :seed="seed" :stroke-width="1.5">
        <slot name="content">{{ content }}</slot>
      </MBorder>
      <span v-if="arrow" ref="arrowEl" class="m-popover__arrow" aria-hidden="true" />
    </div>
  </MPopper>
</template>
