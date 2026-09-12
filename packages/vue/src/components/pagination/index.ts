export { default as MPagination } from "./MPagination.vue";
// 类型和页码折叠算法都在 core，两个框架共用同一份；这里转出去，使用方不用再多装一个包
export { buildPagers, type BuildPagersOptions, type Pager } from "@shuimo-design/core";
export type {
  PaginationEmits,
  PaginationLayoutKey,
  PaginationProps,
  PaginationSlots,
} from "@shuimo-design/core";
