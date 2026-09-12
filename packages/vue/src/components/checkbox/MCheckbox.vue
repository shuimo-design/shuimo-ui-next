<script setup lang="ts">
import { computed, inject, ref } from "vue";
import {
  checkboxAriaChecked,
  checkboxBrush,
  checkboxChecked,
  checkboxClasses,
  checkboxDisabled,
  checkboxHasLabel,
  checkboxInk,
  type CheckboxEmits,
  type CheckboxProps,
  type CheckboxSlots,
} from "@shuimo-design/core";
import { useBrushBorder } from "../../ink";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { checkboxGroupKey } from "./context";

defineOptions({ name: "MCheckbox" });

const {
  value,
  label,
  disabled: disabledProp = false,
  indeterminate = false,
  name,
} = defineProps<CheckboxProps>();
const emit = defineEmits<CheckboxEmits>();
const slots = defineSlots<CheckboxSlots>();
const model = defineModel<boolean>({ default: false });

const group = inject(checkboxGroupKey, undefined);
// 上下文形状在 core（context/form-item.ts），这两行只是 Vue 的 inject 胶水
const formItem = useFormItem();
const ownDisabled = useDisabled(() => disabledProp);

// 在组里就听组的，单独用就听自己的 v-model；min/max 把这一项锁住时也算禁用。判断全在 core
const checked = computed(() => checkboxChecked({ group: group?.value, value, own: model.value }));
const disabled = computed(() =>
  checkboxDisabled({
    group: group?.value,
    value,
    own: ownDisabled.value,
    checked: checked.value,
  }),
);
const classes = computed(() =>
  checkboxClasses({ checked: checked.value, indeterminate, disabled: disabled.value }),
);

// 方框的笔触参数、勾选墨块与半选一横的遮罩都在 core 里，两个壳共用同一份
const box = ref<HTMLElement | null>(null);
useBrushBorder(box, checkboxBrush());
const inkStyle = checkboxInk();

function onChange(event: Event) {
  if (disabled.value) return;
  const next = (event.target as HTMLInputElement).checked;
  if (group && value !== undefined) {
    group.value.toggle(value, next);
  } else {
    model.value = next;
  }
  emit("change", next, event);
  formItem.value.validate("change");
}
</script>

<template>
  <label :class="classes" :style="inkStyle">
    <input
      :id="group ? undefined : formItem.id"
      class="m-checkbox__input"
      type="checkbox"
      :name="name"
      :checked="checked"
      :disabled="disabled"
      :aria-checked="checkboxAriaChecked(checked, indeterminate)"
      @change="onChange"
    />
    <span ref="box" class="m-checkbox__box" aria-hidden="true">
      <!-- 勾选是框里一块实墨，半选是一横；默认皮肤靠 CSS，m.ink 层换成毛边墨块 / 短笔触遮罩 -->
      <span class="m-checkbox__mark" />
    </span>
    <span v-if="checkboxHasLabel(label, Boolean(slots.default))" class="m-checkbox__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>
