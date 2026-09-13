<script
  setup
  lang="ts"
  generic="Name extends CollapseName = CollapseName, Accordion extends boolean = false"
>
import { computed, provide } from "vue";
import {
  collapseActiveNames,
  collapseClasses,
  collapseNextModel,
  type CollapseContextValue,
  type CollapseEmits,
  type CollapseModel,
  type CollapseName,
  type CollapseProps,
  type CollapseSlots,
} from "@shuimo-design/core";
import { unboundModel } from "../../internal/model";
import { collapseKey } from "./context";

defineOptions({ name: "MCollapse" });

const {
  // 默认不是手风琴，Accordion 默认也是 false；写了 accordion 就推成 true，v-model 跟着变单值
  accordion = false as Accordion,
  divider = true,
  disabled = false,
} = defineProps<CollapseProps<Accordion>>();
const emit = defineEmits<CollapseEmits<Accordion, Name>>();
defineSlots<CollapseSlots>();
// 手风琴下是单个 name，普通模式下是 name 数组；两种形状的换算在 core 里
/** 展开的项；accordion 模式下是单个 name，否则是数组 */
const model = defineModel<CollapseModel<Accordion, Name>>({ default: unboundModel });

function toggle(name: CollapseName) {
  // core 算出来的是两种形状的并集，按本组件的 Accordion / Name 收窄一次
  const next = collapseNextModel(model.value, name, accordion) as CollapseModel<Accordion, Name>;
  model.value = next;
  emit("change", next);
}

// 上下文装成 computed：展开项 / divider / 禁用任一变了，读它的子项跟着重渲染
provide(
  collapseKey,
  computed<CollapseContextValue>(() => ({
    active: collapseActiveNames(model.value),
    divider,
    disabled,
    toggle,
  })),
);
</script>

<template>
  <div :class="collapseClasses({ disabled })">
    <slot />
  </div>
</template>
