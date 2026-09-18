export { default as MCarousel } from "./MCarousel.vue";
export { default as MCarouselItem } from "./MCarouselItem.vue";
export type { MCarouselProps, VueCarouselItem } from "./collect";
// 类型在 core，两个框架共用同一份；这里转出去，使用方不用再多装一个包
export type {
  CarouselArrows,
  CarouselDirection,
  CarouselEmits,
  CarouselIndicator,
  CarouselItem,
  CarouselItemProps,
  CarouselItemSlots,
  CarouselProps,
  CarouselSlots,
} from "@shuimo-design/core";
