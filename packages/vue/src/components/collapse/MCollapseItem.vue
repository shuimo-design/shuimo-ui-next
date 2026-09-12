<script setup lang="ts">
import { computed, inject, useId, useTemplateRef } from "vue";
import {
  collapseItemActive,
  collapseItemClasses,
  collapseItemDisabled,
  collapseItemDivider,
  collapseItemIds,
  collapseItemName,
  collapseLineOptions,
  type CollapseItemEmits,
  type CollapseItemProps,
  type CollapseItemSlots,
} from "@shuimo-design/core";
import { IconBrushChevronDown } from "../../icons";
import { useBrushLine } from "../divider/use-brush-line";
import { collapseKey } from "./context";

defineOptions({ name: "MCollapseItem" });

// divider 默认 undefined 是为了绕开 Boolean 转型（不传会变 false），这样才能区分"没传"去跟随 MCollapse
const {
  name,
  title,
  disabled: disabledProp = false,
  divider: dividerProp = undefined,
} = defineProps<CollapseItemProps>();
const emit = defineEmits<CollapseItemEmits>();
defineSlots<CollapseItemSlots>();
/** 单独使用（不在 MCollapse 里）时靠这个 v-model 记展开态，对应旧版单面板的 v-model */
const model = defineModel<boolean>({ default: false });

const collapse = inject(collapseKey, undefined);
const uid = useId();
const { headerId, contentId } = collapseItemIds(uid);
/** 没给 name 时用生成的 id 顶上，放进组里也能被区分 */
const key = computed(() => collapseItemName(name, uid));

const active = computed(() =>
  collapseItemActive({ collapse: collapse?.value, name: key.value, own: model.value }),
);
const divider = computed(() =>
  collapseItemDivider({ collapse: collapse?.value, own: dividerProp }),
);
const disabled = computed(() =>
  collapseItemDisabled({ collapse: collapse?.value, own: disabledProp }),
);
const classes = computed(() =>
  collapseItemClasses({ active: active.value, disabled: disabled.value, divider: divider.value }),
);

// 标题右侧那一笔按剩余宽度单独生成：标题长短不同，线的长度就不同，拿通用长线硬压会糊
const line = useTemplateRef<HTMLElement>("line");
useBrushLine(line, collapseLineOptions());

function onClick() {
  if (disabled.value) return;
  if (collapse) {
    collapse.value.toggle(key.value);
    return;
  }
  const next = !model.value;
  model.value = next;
  emit("change", next);
}
</script>

<template>
  <div :class="classes">
    <button
      :id="headerId"
      type="button"
      class="m-collapse-item__header"
      :aria-expanded="active"
      :aria-controls="contentId"
      :disabled="disabled"
      @click="onClick"
    >
      <span class="m-collapse-item__title"
        ><slot name="title">{{ title }}</slot></span
      >
      <!-- 标题后一直画到右边缘的笔触线，再接一个一笔写出的箭头 -->
      <span v-if="divider" ref="line" class="m-collapse-item__line" aria-hidden="true" />
      <span class="m-collapse-item__arrow" aria-hidden="true">
        <IconBrushChevronDown />
      </span>
    </button>
    <div :id="contentId" class="m-collapse-item__wrap" role="region" :aria-labelledby="headerId">
      <!-- 收起时 inert：还在 DOM 里参与高度动画，但不可聚焦、不进无障碍树 -->
      <div class="m-collapse-item__content" :inert="!active">
        <div class="m-collapse-item__body"><slot /></div>
      </div>
    </div>
  </div>
</template>
