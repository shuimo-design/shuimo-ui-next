<script setup lang="ts">
import { computed, ref, Transition, useTemplateRef } from "vue";
import {
  ALERT_CLOSE_LABEL,
  alertBarLine,
  alertClasses,
  alertStyle,
  collapseHeightHooks,
  type AlertEmits,
  type AlertProps,
  type AlertSlots,
} from "@shuimo-design/core";
import { IconClose } from "../../icons";
import { toVueTransitionHooks } from "../../runtime/transition-hooks";
import { useBrushLine } from "../divider/use-brush-line";

defineOptions({ name: "MAlert" });

// 必须直接解构 defineProps：先存成变量再解构，编译出来是 setup 期的一次性快照，props 改了不会重渲染
const {
  type = "info",
  title,
  description,
  closable = true,
  showIcon = true,
  center = false,
  effect = "light",
  seed,
} = defineProps<AlertProps>();
const emit = defineEmits<AlertEmits>();
const slots = defineSlots<AlertSlots>();

const visible = ref(true);
const hasTitle = computed(() => Boolean(slots.title || title));
const hasDescription = computed(() => Boolean(slots.default || description));

// 左边那条色边按整条提示的实际高度单独生成一根竖向笔触线，参数在 core
const bar = useTemplateRef<HTMLElement>("bar");
useBrushLine(bar, alertBarLine(seed));

const rootClass = computed(() =>
  alertClasses({
    type,
    effect,
    center,
    hasTitle: hasTitle.value,
    hasDescription: hasDescription.value,
  }),
);
const style = computed(() => alertStyle({ type, seed }));

/**
 * 收起过渡：v-show 只会瞬间 display:none，得先把高度钉成实际值再过渡到 0。
 * 钉高度那几行在 core 的 collapseHeightHooks 里（React 那边用的是同一份），
 * 这里只把它转接成 <Transition> 认的事件 props。
 */
const collapse = toVueTransitionHooks(collapseHeightHooks);

function onClose(event: MouseEvent) {
  visible.value = false;
  emit("close", event);
}
</script>

<template>
  <Transition name="m-alert" v-bind="collapse">
    <div v-show="visible" :class="rootClass" :style="style" role="alert">
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
        :aria-label="ALERT_CLOSE_LABEL"
        @click="onClose"
      >
        <IconClose />
      </button>
    </div>
  </Transition>
</template>
