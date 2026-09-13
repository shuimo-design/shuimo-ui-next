<script setup lang="ts">
import { computed, useId, useTemplateRef, watch } from "vue";
import {
  confirmBrush,
  confirmClasses,
  createModal,
  resolveMask,
  CONFIRM_CANCEL_TEXT,
  CONFIRM_OK_TEXT,
  CONFIRM_TRANSITION,
  type ConfirmEmits,
  type ConfirmProps,
  type ConfirmSlots,
} from "@shuimo-design/core";
import { useBrushBorder } from "../../ink";
import { useController } from "../../runtime";
import { MButton } from "../button";

// 根是 Teleport，外部传的 class / style 落到面板上
defineOptions({ name: "MConfirm", inheritAttrs: false });

// mask 的类型里有 Boolean，Vue 会把"没传"当成 false（布尔属性的惯例），不写默认值遮罩就永远不显示
const {
  content = "",
  title,
  mask: maskProp = true,
  teleport = true,
  confirmText = CONFIRM_OK_TEXT,
  cancelText = CONFIRM_CANCEL_TEXT,
  closeOnEsc = true,
  seed = 1,
} = defineProps<ConfirmProps>();
const emit = defineEmits<ConfirmEmits>();
defineSlots<ConfirmSlots>();
/** 是否显示；函数式的 MConfirm.show() 不用管它 */
const open = defineModel<boolean>("open", { default: false });

const mask = computed(() => resolveMask(maskProp));
const teleportTo = computed(() => (typeof teleport === "string" ? teleport : "body"));
const titleId = useId();
const contentId = useId();

const panel = useTemplateRef<HTMLElement>("panel");
useBrushBorder(panel, confirmBrush(seed));

// 滚动锁、模态栈、ESC、焦点存还、Tab 循环全在 core 的控制器里，和弹窗、抽屉是同一份
const { controller: modal } = useController(createModal, () => ({
  closeOnEsc,
  onRequestClose: cancel,
}));
// flush: "post" —— 要等面板真的渲染出来再交给控制器，它拿到元素才好聚焦
watch(
  [open, panel],
  () => {
    modal.setPanel(panel.value);
    modal.setOpen(open.value);
  },
  { immediate: true, flush: "post" },
);

function settle(result: boolean) {
  if (!open.value) return;
  // 先报结果再关：渲染出口那边是听 confirm / cancel 定结果的，
  // 反过来的话 open 先变 false，出口会当成"被取消了"
  if (result) emit("confirm");
  else emit("cancel");
  open.value = false;
}

function confirm() {
  settle(true);
}

function cancel() {
  settle(false);
}

function onMaskClick() {
  if (mask.value.clickClose) cancel();
}
</script>

<template>
  <Teleport :to="teleportTo" :disabled="teleport === false">
    <Transition :name="CONFIRM_TRANSITION" @after-leave="emit('closed')">
      <div v-if="open" :class="confirmClasses(mask.show)" @click.self="onMaskClick">
        <div
          ref="panel"
          class="m-confirm__panel"
          v-bind="$attrs"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          :aria-describedby="contentId"
          tabindex="-1"
          @keydown="modal.trapFocus"
        >
          <h3 v-if="title" :id="titleId" class="m-confirm__title">{{ title }}</h3>
          <div :id="contentId" class="m-confirm__content">
            <slot>{{ content }}</slot>
          </div>
          <div class="m-confirm__footer">
            <slot name="footer" :confirm="confirm" :cancel="cancel">
              <MButton type="primary" @click="confirm">{{ confirmText }}</MButton>
              <MButton @click="cancel">{{ cancelText }}</MButton>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
