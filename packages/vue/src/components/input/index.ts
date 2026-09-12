export { default as MInput } from "./MInput.vue";
// 类型在 core，两个框架共用同一份；这里转出去，使用方不用再多装一个包
export type {
  InputEmits,
  InputExpose,
  InputProps,
  InputResize,
  InputSlots,
  InputType,
} from "@shuimo-design/core";
