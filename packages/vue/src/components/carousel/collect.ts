import { Fragment, isVNode, type VNodeChild } from "vue";
import type { CarouselItem, CarouselProps } from "@shuimo-design/core";
import MCarouselItem from "./MCarouselItem.vue";

/** Vue 这边的一张：render 返回 VNodeChild */
export type VueCarouselItem = CarouselItem<VNodeChild>;

/**
 * 壳自己的 props 类型：items 换成带 Vue 节点类型的配置。
 * 写在这里并导出 —— 放进 `<script setup>` 里是个私有名字，生成 .d.ts 时引用不到。
 */
export interface MCarouselProps extends Omit<CarouselProps, "items"> {
  /** 幻灯片数据；不传则从子组件 MCarouselItem 上按书写顺序收集 */
  items?: readonly VueCarouselItem[];
}

/**
 * 从默认插槽的 vnode 数组里按**书写顺序**收集 MCarouselItem 的配置。
 *
 * 全程在渲染期完成：读的是 vnode 上的 props 和 children（插槽函数），
 * 不用等子组件挂载、也不比 DOM 位置，所以服务端渲染出来的顺序就是对的。
 * v-for / `<template>` 生成的是 Fragment，递归进去才不会把一组当成一张。
 * 没写 key 的按书写位置顶上。
 */
export function collectCarouselItems(nodes: unknown): VueCarouselItem[] {
  const items: VueCarouselItem[] = [];
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
      if (node.type !== MCarouselItem) continue;
      const props = (node.props ?? {}) as Record<string, unknown>;
      const slots = (node.children ?? {}) as { default?: () => VNodeChild };
      items.push({
        key: typeof node.key === "string" || typeof node.key === "number" ? node.key : items.length,
        src: props.src as string | undefined,
        alt: props.alt as string | undefined,
        render: slots.default,
      });
    }
  };
  walk(Array.isArray(nodes) ? nodes : []);
  return items;
}
