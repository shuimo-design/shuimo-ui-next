<script setup lang="ts">
// 样式必须从 SFC 自己引：rolldown 会跳过只做转发的 index.ts，那里的副作用引入会被丢掉
import "./confirm.css";
import { computed, nextTick, useId, useTemplateRef, watch } from "vue";
import { useBrushBorder } from "../../ink/stroke";
import { MButton } from "../button";
import type { ConfirmEmits, ConfirmProps, ConfirmSlots } from "./types";

// 根是 Teleport，外部传的 class / style 落到面板上
defineOptions({ name: "MConfirm", inheritAttrs: false });

const {
  content = "",
  title,
  mask,
  teleport = true,
  confirmText = "确定",
  cancelText = "取消",
  seed = 1,
} = defineProps<ConfirmProps>();
const emit = defineEmits<ConfirmEmits>();
defineSlots<ConfirmSlots>();
const open = defineModel<boolean>("open", { default: false });

const maskShow = computed(() => mask?.show ?? true);
const maskClickClose = computed(() => mask?.clickClose ?? true);
const teleportTo = computed(() => (typeof teleport === "string" ? teleport : "body"));
const titleId = useId();
const contentId = useId();

const panel = useTemplateRef<HTMLElement>("panel");
useBrushBorder(panel, { seed, strokeWidth: 3 });

/** 打开时记住焦点在哪，关掉后还回去 */
let lastFocus: Element | null = null;
watch(
  open,
  async (value) => {
    if (value) {
      lastFocus = document.activeElement;
      await nextTick();
      panel.value?.focus();
    } else if (lastFocus instanceof HTMLElement) {
      lastFocus.focus();
      lastFocus = null;
    }
  },
  { immediate: true },
);

function settle(result: boolean) {
  if (!open.value) return;
  open.value = false;
  if (result) emit("confirm");
  else emit("cancel");
}

function confirm() {
  settle(true);
}

function cancel() {
  settle(false);
}

function onMaskClick() {
  if (maskClickClose.value) cancel();
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  event.stopPropagation();
  cancel();
}
</script>

<template>
  <Teleport :to="teleportTo" :disabled="teleport === false">
    <Transition name="m-confirm" @after-leave="emit('closed')">
      <div
        v-if="open"
        class="m-confirm"
        :class="{ 'm-confirm--mask': maskShow }"
        @click.self="onMaskClick"
        @keydown="onKeydown"
      >
        <div
          ref="panel"
          class="m-confirm__panel"
          v-bind="$attrs"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          :aria-describedby="contentId"
          tabindex="-1"
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
