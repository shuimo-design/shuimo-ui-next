export { default as MTimeline } from "./MTimeline.vue";
export { default as MTimelineItem } from "./MTimelineItem.vue";
export type { MTimelineProps, VueTimelineItem } from "./collect";
// 类型在 core，两个框架共用同一份；这里转出去，使用方不用再多装一个包
export type {
  TimelineItem,
  TimelineItemConfig,
  TimelineItemProps,
  TimelineItemScope,
  TimelineItemSlots,
  TimelineMode,
  TimelineProps,
  TimelineSlots,
  TimelineType,
} from "@shuimo-design/core";
