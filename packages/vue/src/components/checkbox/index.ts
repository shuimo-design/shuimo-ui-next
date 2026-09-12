export { default as MCheckbox } from "./MCheckbox.vue";
export { default as MCheckboxGroup } from "./MCheckboxGroup.vue";
// 类型在 core，两个框架共用同一份；这里转出去，使用方不用再多装一个包
export type {
  CheckboxEmits,
  CheckboxGroupEmits,
  CheckboxGroupProps,
  CheckboxGroupSlots,
  CheckboxProps,
  CheckboxSlots,
  CheckboxValue,
} from "@shuimo-design/core";
