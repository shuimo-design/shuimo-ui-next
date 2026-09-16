import { Fragment, isVNode, type VNodeChild } from "vue";
import type { TimelineItemConfig, TimelineProps, TimelineType } from "@shuimo-design/core";
import MTimelineItem from "./MTimelineItem.vue";

/** Vue 这边的一条：render / renderDot 返回 VNodeChild */
export type VueTimelineItem = TimelineItemConfig<VNodeChild>;

/**
 * 壳自己的 props 类型：items 换成带 Vue 节点类型的配置。
 * 写在这里并导出 —— 放进 `<script setup>` 里是个私有名字，生成 .d.ts 时引用不到。
 */
export interface MTimelineProps extends Omit<TimelineProps, "items"> {
  /** 数据；不传则从子组件 MTimelineItem 上按书写顺序收集 */
  items?: readonly VueTimelineItem[];
}

/**
 * 从默认插槽的 vnode 数组里按**书写顺序**收集 MTimelineItem 的配置。
 *
 * 全程在渲染期完成：读的是 vnode 上的 props 和 children（插槽函数），
 * 不用等子组件挂载、也不比 DOM 位置，所以服务端渲染出来的顺序就是对的。
 * v-for / `<template>` 生成的是 Fragment，递归进去才不会把一组当成一条。
 */
export function collectTimelineItems(nodes: unknown): VueTimelineItem[] {
  const items: VueTimelineItem[] = [];
  const walk = (list: readonly unknown[]): void => {
    for (const node of list) {
      if (Array.isArray(node)) {
        walk(node);
        continue;
      }
      if (!isVNode(node)) continue;
      if (node.type === Fragment) {
        walk((node.children ?? []) as readonly unknown[]);
        continue;
      }
      if (node.type !== MTimelineItem) continue;
      const props = (node.props ?? {}) as Record<string, unknown>;
      const slots = (node.children ?? {}) as {
        default?: () => VNodeChild;
        dot?: () => VNodeChild;
      };
      items.push({
        key: typeof node.key === "string" || typeof node.key === "number" ? node.key : undefined,
        label: props.label as string | undefined,
        content: props.content as string | undefined,
        type: props.type as TimelineType | undefined,
        dot: props.dot as string | undefined,
        render: slots.default,
        renderDot: slots.dot,
      });
    }
  };
  walk(Array.isArray(nodes) ? nodes : []);
  return items;
}
