<script setup lang="ts">
import { computed, useId, useTemplateRef, watch } from "vue";
import {
  createPopoverTrigger,
  popoverClasses,
  popoverReferenceAria,
  popoverTipStyle,
  POPOVER_BORDER_STROKE,
  POPOVER_REFERENCE_ARIA,
  type PopoverEmits,
  type PopoverProps,
  type PopoverSlots,
} from "@shuimo-design/core";
import MPopper from "../../internal/popper/MPopper.vue";
import { MBorder } from "../border";
import { useController } from "../../runtime";

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

// 开合时序（延时、hover / click / focus、Escape、点外面）全在 core 的控制器里，
// React 那边用的是同一份；显隐状态仍归 v-model 持有，控制器只负责请求改变
const { controller: popover, state } = useController(createPopoverTrigger, () => ({
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
    popover.setWrapper(wrapper.value);
    popover.setPanel(float.value);
  },
  { immediate: true, flush: "post" },
);
// 壳里的内容换了要重新挑参照元素
watch(
  () => [show.value, content],
  () => popover.refresh(),
  { flush: "post" },
);

const open = computed(() => show.value && !disabled);
const reference = computed(() => state.value.reference);
const floatStyle = computed(() => popoverTipStyle({ seed }));

// 点击触发时把展开状态标在参照元素上，读屏能知道这个按钮带着一个气泡
watch([reference, open, () => trigger], ([el, isOpen, kind], [prevEl]) => {
  for (const name of POPOVER_REFERENCE_ARIA) {
    if (prevEl && prevEl !== el) prevEl.removeAttribute(name);
  }
  if (!el) return;
  const aria = popoverReferenceAria({ trigger: kind, open: isOpen, panelId });
  for (const name of POPOVER_REFERENCE_ARIA) {
    const value = aria[name];
    if (value === undefined) el.removeAttribute(name);
    else el.setAttribute(name, value);
  }
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
    :class="popoverClasses({ wrapOnly: state.wrapOnly, open, disabled })"
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
      <MBorder class="m-popover__panel" :seed="seed" :stroke-width="POPOVER_BORDER_STROKE">
        <slot name="content">{{ content }}</slot>
      </MBorder>
      <span v-if="arrow" ref="arrowEl" class="m-popover__arrow" aria-hidden="true" />
    </div>
  </MPopper>
</template>
