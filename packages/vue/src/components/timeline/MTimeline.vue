<script setup lang="ts">
import { computed, useSlots, useTemplateRef } from "vue";
import {
  timelineAxisLineOptions,
  timelineClasses,
  timelineLayout,
  timelineStyle,
  type TimelineSlots,
} from "@shuimo-design/core";
import { RenderNode } from "../../runtime/render-node";
import { useBrushLine } from "../divider/use-brush-line";
import { collectTimelineItems, type MTimelineProps } from "./collect";

defineOptions({ name: "MTimeline" });

const {
  items: itemsProp,
  mode = "left",
  pending = false,
  reverse = false,
  seed = undefined,
} = defineProps<MTimelineProps>();
const slots = useSlots() as TimelineSlots;
defineSlots<TimelineSlots>();

/**
 * 数据的来源：传了 items 就用传的，没传才从子组件收集。
 * 收集在渲染期完成（读 vnode 的 props），顺序 = 模板里的书写顺序。
 */
const layout = computed(() =>
  timelineLayout(itemsProp ?? collectTimelineItems(slots.default?.()), {
    mode,
    pending,
    reverse,
    customDot: Boolean(slots.dot),
  }),
);

// 轴线按实际高度单独生成笔触线；高度由网格给出，控制器只管量和画
const axis = useTemplateRef<HTMLElement>("axis");
useBrushLine(axis, timelineAxisLineOptions(seed));

// 墨团、一笔圆两张素材挂在根上，节点的伪元素拿它们当遮罩
const inkStyle = timelineStyle();
</script>

<template>
  <ol :class="timelineClasses({ mode, pending, reverse })" :style="inkStyle">
    <!-- 轴线和虚线段先于各条渲染，画在节点底下；它们不是列表项，对读屏器隐藏 -->
    <li
      v-if="layout.axis"
      ref="axis"
      class="m-timeline__axis"
      :style="layout.axis.style"
      role="presentation"
      aria-hidden="true"
    />
    <li
      v-if="layout.pendingLine"
      class="m-timeline__axis m-timeline__axis--pending"
      :style="layout.pendingLine.style"
      role="presentation"
      aria-hidden="true"
    />
    <li
      v-for="entry in layout.entries"
      :key="entry.key"
      :class="entry.classes"
      :style="entry.style"
    >
      <span class="m-timeline-item__node" aria-hidden="true">
        <slot v-if="!entry.pending" name="dot" :item="entry.item" :index="entry.index">
          <RenderNode v-if="entry.item.renderDot" :node="entry.item.renderDot" />
          <template v-else>{{ entry.item.dot }}</template>
        </slot>
      </span>
      <div class="m-timeline-item__main">
        <!-- 幽灵节点只有一行说明文字，不走 item 插槽 -->
        <template v-if="entry.pending">
          <div v-if="entry.item.content" class="m-timeline-item__content">
            {{ entry.item.content }}
          </div>
        </template>
        <slot v-else name="item" :item="entry.item" :index="entry.index">
          <RenderNode v-if="entry.item.render" :node="entry.item.render" />
          <template v-else>
            <div v-if="entry.item.label" class="m-timeline-item__label">{{ entry.item.label }}</div>
            <div v-if="entry.item.content" class="m-timeline-item__content">
              {{ entry.item.content }}
            </div>
          </template>
        </slot>
      </div>
    </li>
  </ol>
</template>
