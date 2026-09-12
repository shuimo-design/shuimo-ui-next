export { default as MBreadcrumb } from "./MBreadcrumb.vue";
export { default as MBreadcrumbItem } from "./MBreadcrumbItem.vue";
// 类型在 core，两个框架共用同一份；这里转出去，使用方不用再多装一个包
export type {
  BreadcrumbItemProps,
  BreadcrumbItemSlots,
  BreadcrumbProps,
  BreadcrumbSlots,
} from "@shuimo-design/core";
