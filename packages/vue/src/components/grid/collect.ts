import { Fragment, isVNode } from "vue";
import type { GridCellConfig, GridProps } from "@shuimo-design/core";
import type { VueNode } from "../../runtime/render-node";
import MCell from "./MCell.vue";

/** Vue 这边的一个格子：content 可以是字符串、VNode，或返回它们的函数 */
export type VueGridCell = GridCellConfig<VueNode>;

/**
 * 壳自己的 props 类型：把 core 的配置数组换成 Vue 的节点类型。
 * 必须写在这里并导出 —— 放进 `<script setup>` 里是个私有名字，生成 .d.ts 时
 * `__VLS_export` 引用不到它，dts 会报 TS4025（实测）。
 */
export interface MGridProps extends Omit<GridProps, "cells"> {
  /** 每个格子的配置，顺序就是排列顺序；不传则按书写顺序从子组件 MCell 上收集 */
  cells?: VueGridCell[];
}

/** 模板里的布尔简写（`<MCell border>`）传过来的是空串，不是 true */
function flag(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  return value !== false && value !== "false";
}

/**
 * 从默认插槽的 vnode 数组里按**书写顺序**收集 MCell 的配置。
 *
 * 顺序在这里格外要紧：gapRotate 的第 i 道斜缝正好是第 i 个格子的右边、第 i+1 个格子的左边，
 * 旧版要等格子挂载后比 DOM 位置才排得出来。读 vnode 的 props 是渲染期就完成的，服务端也对。
 */
export function collectCells(nodes: unknown): VueGridCell[] {
  const cells: VueGridCell[] = [];
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
      if (node.type !== MCell) continue;
      const props = (node.props ?? {}) as Record<string, unknown>;
      const slots = (node.children ?? {}) as { default?: VueNode };
      cells.push({
        key: (node.key as string | number | null) ?? undefined,
        w: props.w as number | undefined,
        h: props.h as number | undefined,
        border: flag(props.border) ?? false,
        points: props.points as VueGridCell["points"],
        a: props.a as VueGridCell["a"],
        b: props.b as VueGridCell["b"],
        c: props.c as VueGridCell["c"],
        d: props.d as VueGridCell["d"],
        span: props.span as number | undefined,
        offset: props.offset as number | undefined,
        content: slots.default,
      });
    }
  };
  walk(Array.isArray(nodes) ? nodes : []);
  return cells;
}
