<script setup lang="ts">
import { computed, inject } from "vue";
import {
  radioChecked,
  radioClasses,
  radioDisabled,
  radioHasLabel,
  radioInk,
  radioNativeName,
  type RadioEmits,
  type RadioProps,
  type RadioSlots,
  type RadioValue,
} from "@shuimo-design/core";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { radioGroupKey } from "./context";

defineOptions({ name: "MRadio" });

const { value, label, disabled: disabledProp = false, name } = defineProps<RadioProps>();
const emit = defineEmits<RadioEmits>();
const slots = defineSlots<RadioSlots>();
const model = defineModel<RadioValue>();

const group = inject(radioGroupKey, undefined);
// 上下文形状在 core（context/form-item.ts），这两行只是 Vue 的 inject 胶水
const formItem = useFormItem();
const ownDisabled = useDisabled(() => disabledProp);

// 在组里就比组的值，单独用就比自己的 v-model；判断全在 core
const checked = computed(() => radioChecked({ group: group?.value, own: model.value, value }));
const disabled = computed(() => radioDisabled({ group: group?.value, own: ownDisabled.value }));
const nativeName = computed(() => radioNativeName({ group: group?.value, name }));
const classes = computed(() => radioClasses({ checked: checked.value, disabled: disabled.value }));

// 外圈墨圈和中心墨点两张遮罩都在 core 里生成，两个壳共用同一份
const inkStyle = radioInk();

function onChange(event: Event) {
  if (disabled.value || !(event.target as HTMLInputElement).checked) return;
  if (group) {
    group.value.select(value);
  } else {
    model.value = value;
  }
  emit("change", value, event);
  formItem.value.validate("change");
}
</script>

<template>
  <label :class="classes" :style="inkStyle">
    <input
      :id="group ? undefined : formItem.id"
      class="m-radio__input"
      type="radio"
      :name="nativeName"
      :checked="checked"
      :disabled="disabled"
      @change="onChange"
    />
    <span class="m-radio__dot" aria-hidden="true" />
    <span v-if="radioHasLabel(label, Boolean(slots.default))" class="m-radio__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>
