import { Fragment, isVNode, type VNodeChild } from "vue";
import type { DescriptionsItemConfig, DescriptionsProps } from "@shuimo-design/core";
import MDescriptionsItem from "./MDescriptionsItem.vue";

/** Vue 这边的一条：render / renderLabel 返回 VNodeChild */
export type VueDescriptionsItem = DescriptionsItemConfig<VNodeChild>;

/**
 * 壳自己的 props 类型：items 换成带 Vue 节点类型的配置。
 * 写在这里并导出 —— 放进 `<script setup>` 里是个私有名字，生成 .d.ts 时引用不到。
 */
export interface MDescriptionsProps extends Omit<DescriptionsProps, "items"> {
  /** 数据；不传则从子组件 MDescriptionsItem 上按书写顺序收集 */
  items?: readonly VueDescriptionsItem[];
}

/**
 * 从默认插槽的 vnode 数组里按**书写顺序**收集 MDescriptionsItem 的配置。
 *
 * 全程在渲染期完成：读的是 vnode 上的 props 和 children（插槽函数），
 * 不用等子组件挂载、也不比 DOM 位置，所以服务端渲染出来的顺序就是对的。
 * v-for / `<template>` 生成的是 Fragment，递归进去才不会把一组当成一条。
 */
export function collectDescriptionsItems(nodes: unknown): VueDescriptionsItem[] {
  const items: VueDescriptionsItem[] = [];
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
      if (node.type !== MDescriptionsItem) continue;
      const props = (node.props ?? {}) as Record<string, unknown>;
      const slots = (node.children ?? {}) as {
        default?: () => VNodeChild;
        label?: () => VNodeChild;
      };
      items.push({
        key: typeof node.key === "string" || typeof node.key === "number" ? node.key : undefined,
        label: String(props.label ?? ""),
        value: props.value as string | number | undefined,
        // 模板里写 span="2" 传进来是字符串，这里转成数字
        span: props.span === undefined ? undefined : Number(props.span),
        render: slots.default,
        renderLabel: slots.label,
      });
    }
  };
  walk(Array.isArray(nodes) ? nodes : []);
  return items;
}
