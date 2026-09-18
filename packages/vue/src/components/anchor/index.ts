export { default as MAnchor } from "./MAnchor.vue";
// 类型在 core，两个框架共用同一份；这里转出去，使用方不用再多装一个包
export type {
  AnchorContainer,
  AnchorDirection,
  AnchorEmits,
  AnchorItem,
  AnchorItemScope,
  AnchorProps,
  AnchorSlots,
} from "@shuimo-design/core";
