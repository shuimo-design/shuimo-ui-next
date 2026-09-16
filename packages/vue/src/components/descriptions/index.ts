export { default as MDescriptions } from "./MDescriptions.vue";
export { default as MDescriptionsItem } from "./MDescriptionsItem.vue";
export type { MDescriptionsProps, VueDescriptionsItem } from "./collect";
// 类型在 core，两个框架共用同一份；这里转出去，使用方不用再多装一个包
export type {
  DescriptionsItem,
  DescriptionsItemConfig,
  DescriptionsItemProps,
  DescriptionsItemScope,
  DescriptionsItemSlots,
  DescriptionsLayout,
  DescriptionsProps,
  DescriptionsSize,
  DescriptionsSlots,
} from "@shuimo-design/core";
