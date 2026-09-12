export { default as MRadio } from "./MRadio.vue";
export { default as MRadioGroup } from "./MRadioGroup.vue";
// 类型在 core，两个框架共用同一份；这里转出去，使用方不用再多装一个包
export type {
  RadioEmits,
  RadioGroupEmits,
  RadioGroupProps,
  RadioGroupSlots,
  RadioProps,
  RadioSlots,
  RadioValue,
} from "@shuimo-design/core";
