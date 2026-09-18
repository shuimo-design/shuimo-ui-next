export { default as MReadingStroke } from "./MReadingStroke.vue";
// 类型在 core，两个框架共用同一份；这里转出去，使用方不用再多装一个包
export type {
  ReadingStrokeEmits,
  ReadingStrokePosition,
  ReadingStrokeProps,
} from "@shuimo-design/core";
