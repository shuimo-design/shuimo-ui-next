export { default as MDivider } from "./MDivider.vue";
export { useBrushLine, type UseBrushLineOptions } from "./use-brush-line";
// 类型在 core，两个框架共用同一份；这里转出去，使用方不用再多装一个包
export type { DividerAlign, DividerProps, DividerSlots } from "@shuimo-design/core";
