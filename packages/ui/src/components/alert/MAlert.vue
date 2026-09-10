<script setup lang="ts">
import "./alert.css";
import { computed, ref, useTemplateRef } from "vue";
import { IconClose } from "../../icons";
import { inkBadgeUrl, type InkBadgeKind } from "../../ink/assets/badge";
import { useBrushLine } from "../divider/use-brush-line";
import type { AlertEmits, AlertProps, AlertSlots, AlertType } from "./types";

defineOptions({ name: "MAlert" });

const {
  type = "info",
  title,
  description,
  closable = true,
  showIcon = true,
  center = false,
  effect = "light",
  seed = 1,
} = defineProps<AlertProps>();
const emit = defineEmits<AlertEmits>();
const slots = defineSlots<AlertSlots>();

const BADGE: Record<AlertType, InkBadgeKind> = {
  success: "check",
  warn: "bang",
  danger: "cross",
  info: "info",
};

const visible = ref(true);
const hasTitle = computed(() => Boolean(slots.title || title));
const hasDescription = computed(() => Boolean(slots.default || description));

// 左边那条色边按整条提示的实际高度单独生成一根竖向笔触线
const bar = useTemplateRef<HTMLElement>("bar");
useBrushLine(bar, { thickness: 3, seed, vertical: () => true });

const style = computed(() => ({
  "--m-alert-badge": `url("${inkBadgeUrl(BADGE[type], { seed })}")`,
}));

function onClose(event: MouseEvent) {
  visible.value = false;
  emit("close", event);
}

// 收起过渡：v-show 只会瞬间 display:none，这里先把高度钉成实际值再过渡到 0，CSS 只负责 transition 声明
function onBeforeLeave(el: Element) {
  const node = el as HTMLElement;
  node.style.height = `${node.offsetHeight}px`;
  // 强制回流，让下一步的高度变化被当成过渡的起点而不是直接跳到终点
  void node.offsetHeight;
}

function onLeave(el: Element) {
  const node = el as HTMLElement;
  node.style.height = "0";
  node.style.paddingTop = "0";
  node.style.paddingBottom = "0";
  node.style.marginTop = "0";
  node.style.marginBottom = "0";
}

function onAfterLeave(el: Element) {
  const node = el as HTMLElement;
  node.style.height = "";
  node.style.paddingTop = "";
  node.style.paddingBottom = "";
  node.style.marginTop = "";
  node.style.marginBottom = "";
}
</script>

<template>
  <Transition
    name="m-alert"
    @before-leave="onBeforeLeave"
    @leave="onLeave"
    @after-leave="onAfterLeave"
  >
    <div
      v-show="visible"
      class="m-alert"
      :class="[
        `m-alert--${type}`,
        `m-alert--${effect}`,
        {
          'm-alert--center': center,
          'm-alert--with-title': hasTitle,
          'm-alert--with-description': hasDescription,
        },
      ]"
      :style="style"
      role="alert"
    >
      <span ref="bar" class="m-alert__bar" aria-hidden="true" />
      <template v-if="showIcon">
        <span v-if="slots.icon" class="m-alert__icon m-alert__icon--custom" aria-hidden="true">
          <slot name="icon" />
        </span>
        <span v-else class="m-alert__icon" aria-hidden="true" />
      </template>
      <div class="m-alert__content">
        <div v-if="hasTitle" class="m-alert__title">
          <slot name="title">{{ title }}</slot>
        </div>
        <div v-if="hasDescription" class="m-alert__description">
          <slot>{{ description }}</slot>
        </div>
      </div>
      <div v-if="slots.action" class="m-alert__action"><slot name="action" /></div>
      <button
        v-if="closable"
        type="button"
        class="m-alert__close"
        aria-label="关闭"
        @click="onClose"
      >
        <IconClose />
      </button>
    </div>
  </Transition>
</template>
