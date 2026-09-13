<script setup lang="ts" generic="T extends SwitchValue = boolean">
import { computed } from "vue";
import {
  switchChecked,
  switchClasses,
  switchInert,
  switchInk,
  switchNextValue,
  type SwitchEmits,
  type SwitchProps,
  type SwitchSlots,
  type SwitchValue,
} from "@shuimo-design/core";
import { useDisabled, useFormItem } from "../../internal/form-item";

defineOptions({ name: "MSwitch" });

const {
  disabled: disabledProp = false,
  loading = false,
  // 默认值是 true / false，T 默认也是 boolean；用户传了别的 activeValue，T 就跟着变
  activeValue = true as T,
  inactiveValue = false as T,
  activeText,
  inactiveText,
  controlled = false,
  name,
} = defineProps<SwitchProps<T>>();
const emit = defineEmits<SwitchEmits<T>>();
const slots = defineSlots<SwitchSlots>();
/** 开关的值，类型和 activeValue / inactiveValue 一致；不绑的话默认 false */
// 默认值必须写成函数：泛型 T 过不了 Vue 对字面量默认值的类型检查（它要先确定 T 是原始类型）
const model = defineModel<T>({ default: () => false as T });

// 上下文形状在 core（context/form-item.ts），这两行只是 Vue 的 inject 胶水
const formItem = useFormItem();
const disabled = useDisabled(() => disabledProp);
const checked = computed(() => switchChecked(model.value, activeValue));
const classes = computed(() =>
  switchClasses({ checked: checked.value, disabled: disabled.value, loading }),
);
const inert = computed(() => switchInert({ disabled: disabled.value, loading }));
// 轨道那"一抹"和滑钮外的手画方框都在 core 里生成，两个壳共用同一份遮罩
const inkStyle = switchInk();

function toggle() {
  if (inert.value) return;
  const next = switchNextValue(checked.value, activeValue, inactiveValue);
  // 受控模式只把"将要变成的值"报出去，改不改 v-model 由外部决定
  if (!controlled) model.value = next;
  emit("change", next);
  formItem.value.validate("change");
}
</script>

<template>
  <button
    :id="formItem.id"
    type="button"
    :class="classes"
    :style="inkStyle"
    role="switch"
    :aria-checked="checked"
    :aria-busy="loading || undefined"
    :disabled="disabled"
    :name="name"
    @click="toggle"
  >
    <span v-if="slots.active || activeText" class="m-switch__text m-switch__text--active">
      <slot name="active">{{ activeText }}</slot>
    </span>
    <span class="m-switch__track" aria-hidden="true">
      <!-- 外层只管左右滑，里层只管转 45° 和 loading 时的慢转，两个 transform 不打架 -->
      <span class="m-switch__thumb">
        <span class="m-switch__core" />
      </span>
    </span>
    <span v-if="slots.inactive || inactiveText" class="m-switch__text m-switch__text--inactive">
      <slot name="inactive">{{ inactiveText }}</slot>
    </span>
  </button>
</template>
