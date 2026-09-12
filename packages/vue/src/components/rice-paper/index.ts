export { default as MRicePaper } from "./MRicePaper.vue";
// 类型在 core，两个框架共用同一份；这里转出去，使用方不用再多装一个包
export type {
  GoldFleckOptions,
  PaperPreset,
  RicePaperEmits,
  RicePaperProps,
  RicePaperReadyPayload,
  RicePaperSlots,
} from "@shuimo-design/core";
