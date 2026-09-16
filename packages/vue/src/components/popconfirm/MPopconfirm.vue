<script setup lang="ts">
import { computed, useId, useTemplateRef, watch } from "vue";
import {
  createPopoverFocus,
  createPopoverTrigger,
  popconfirmClasses,
  popconfirmFocusTarget,
  popconfirmReferenceAria,
  popconfirmStyle,
  POPCONFIRM_BORDER_STROKE,
  POPCONFIRM_CANCEL_TEXT,
  POPCONFIRM_OK_TEXT,
  POPCONFIRM_REFERENCE_ARIA,
  type PopconfirmEmits,
  type PopconfirmProps,
  type PopconfirmSlots,
} from "@shuimo-design/core";
import MPopper from "../../internal/popper/MPopper.vue";
import { MBorder } from "../border";
import { MButton } from "../button";
import { useController } from "../../runtime";

defineOptions({ name: "MPopconfirm", inheritAttrs: false });

const {
  title,
  content,
  confirmText = POPCONFIRM_OK_TEXT,
  cancelText = POPCONFIRM_CANCEL_TEXT,
  confirmType = "primary",
  placement = "top",
  disabled = false,
  icon = true,
  offset = 8,
  teleport = true,
  seed = 1,
} = defineProps<PopconfirmProps>();
const emit = defineEmits<PopconfirmEmits>();
defineSlots<PopconfirmSlots>();
/** 是否显示；不传也能用，点触发元素自己开 */
const open = defineModel<boolean>("open", { default: false });

const panelId = useId();
const titleId = useId();
const wrapper = useTemplateRef<HTMLElement>("wrapper");
const float = useTemplateRef<HTMLElement>("float");
const arrowEl = useTemplateRef<HTMLElement>("arrowEl");

// 焦点搬运：打开时落在取消按钮上，关闭时还给触发元素
const focus = createPopoverFocus({ target: popconfirmFocusTarget });

// 开合时序（点击、Escape、点外面）全在 core 的控制器里，和气泡是同一份。
// 控制器发起的每一次收起（点外面、Esc、再点触发元素）都不是确定，一律算取消 —— 和 MConfirm 点遮罩的口径一致
const { controller: popover, state } = useController(createPopoverTrigger, () => ({
  trigger: "click" as const,
  disabled,
  openDelay: 0,
  closeDelay: 0,
  disableClickAway: false,
  show: open.value,
  onChange: (next: boolean) => {
    if (!next) {
      emit("cancel");
      focus.restoreFocus();
    }
    open.value = next;
  },
}));
watch(
  [wrapper, float],
  () => {
    popover.setWrapper(wrapper.value);
    popover.setPanel(float.value);
    focus.setPanel(float.value);
  },
  { immediate: true, flush: "post" },
);
// 壳里的内容换了要重新挑参照元素
watch(
  () => open.value,
  () => popover.refresh(),
  { flush: "post" },
);

const expanded = computed(() => open.value && !disabled);
const reference = computed(() => state.value.reference);
const floatStyle = computed(() => popconfirmStyle({ seed }));
watch(reference, (el) => focus.setReference(el), { immediate: true });
// 每次打开都把焦点送进去
watch(expanded, (isOpen) => {
  if (isOpen) focus.requestFocus();
});

// 参照元素标成「带对话框的按钮」，读屏能知道按下去会弹确认
watch([reference, expanded], ([el, isOpen], [prevEl]) => {
  for (const name of POPCONFIRM_REFERENCE_ARIA) {
    if (prevEl && prevEl !== el) prevEl.removeAttribute(name);
  }
  if (!el) return;
  const aria = popconfirmReferenceAria({ open: isOpen, panelId });
  for (const name of POPCONFIRM_REFERENCE_ARIA) {
    const value = aria[name];
    if (value === undefined) el.removeAttribute(name);
    else el.setAttribute(name, value);
  }
});

/** 按钮触发的关闭：先报结果、还焦点，再直接改开关，不经过控制器（否则会再报一次 cancel） */
function settle(result: boolean) {
  if (!open.value) return;
  if (result) emit("confirm");
  else emit("cancel");
  focus.restoreFocus();
  open.value = false;
}

defineExpose({
  show: () => popover.setOpen(true),
  hide: () => popover.setOpen(false),
});
</script>

<template>
  <span
    ref="wrapper"
    :class="popconfirmClasses({ wrapOnly: state.wrapOnly, open: expanded, disabled })"
    v-bind="$attrs"
    @click="popover.onTriggerClick"
  >
    <slot />
  </span>
  <MPopper
    :open="expanded"
    :reference="reference"
    :placement="placement"
    :offset="offset"
    :teleport="teleport"
    :arrow="arrowEl"
    @click-outside="popover.onClickOutside"
  >
    <div
      :id="panelId"
      ref="float"
      class="m-popconfirm__float"
      role="dialog"
      :aria-labelledby="titleId"
      tabindex="-1"
      :style="floatStyle"
    >
      <MBorder class="m-popconfirm__panel" :seed="seed" :stroke-width="POPCONFIRM_BORDER_STROKE">
        <div class="m-popconfirm__body">
          <span v-if="icon" class="m-popconfirm__icon" aria-hidden="true" />
          <div class="m-popconfirm__main">
            <div :id="titleId" class="m-popconfirm__title">
              <slot name="title">{{ title }}</slot>
            </div>
            <div v-if="content || $slots.content" class="m-popconfirm__content">
              <slot name="content">{{ content }}</slot>
            </div>
          </div>
        </div>
        <div class="m-popconfirm__footer">
          <MButton :type="confirmType" class="m-popconfirm__confirm" @click="settle(true)">
            {{ confirmText }}
          </MButton>
          <MButton class="m-popconfirm__cancel" @click="settle(false)">{{ cancelText }}</MButton>
        </div>
      </MBorder>
      <span ref="arrowEl" class="m-popconfirm__arrow" aria-hidden="true" />
    </div>
  </MPopper>
</template>
