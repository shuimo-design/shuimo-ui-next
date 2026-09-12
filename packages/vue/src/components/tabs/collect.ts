import { Fragment, isVNode } from "vue";
import type { TabPaneConfig, TabsProps } from "@shuimo-design/core";
import type { VueNode } from "../../runtime/render-node";
import MTabPane from "./MTabPane.vue";

/** Vue 这边的一页配置：标签和面板的内容可以是字符串、VNode，或返回它们的函数 */
export type VueTabPane = TabPaneConfig<VueNode>;

/**
 * 壳自己的 props 类型：把 core 的配置数组换成 Vue 的节点类型。
 * 必须写在这里并导出 —— 放进 `<script setup>` 里是个私有名字，生成 .d.ts 时
 * `__VLS_export` 引用不到它，dts 会报 TS4025（实测）。
 */
export interface MTabsProps extends Omit<TabsProps, "panes"> {
  /** 每一页的配置，顺序就是标签顺序；不传则按书写顺序从子组件 MTabPane 上收集 */
  panes?: VueTabPane[];
}

/** 模板里的布尔简写（`<MTabPane disabled>`）传过来的是空串，不是 true */
function flag(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  return value !== false && value !== "false";
}

/**
 * 从默认插槽的 vnode 数组里按**书写顺序**收集 MTabPane 的配置。
 *
 * 全程在渲染期完成：读的是 vnode 上的 props 和 children（插槽函数），
 * 既不用等子组件挂载、也不用比 DOM 位置，所以服务端渲染出来的顺序就是对的。
 * v-for / `<template>` 生成的是 Fragment，递归进去才不会把一组 pane 当成一个。
 */
export function collectPanes(nodes: unknown): VueTabPane[] {
  const panes: VueTabPane[] = [];
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
      if (node.type !== MTabPane) continue;
      const props = (node.props ?? {}) as Record<string, unknown>;
      const slots = (node.children ?? {}) as { default?: VueNode; label?: VueNode };
      panes.push({
        // 没给 name 就用书写位置顶上；它只是个标识，v-model 也能拿它来切
        name: (props.name as VueTabPane["name"]) ?? panes.length,
        label: props.label as string | undefined,
        labelNode: slots.label,
        disabled: flag(props.disabled) ?? false,
        closable: flag(props.closable),
        lazy: flag(props.lazy) ?? false,
        content: slots.default,
      });
    }
  };
  walk(Array.isArray(nodes) ? nodes : []);
  return panes;
}
