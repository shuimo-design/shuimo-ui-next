import { Fragment, isVNode, type VNodeChild } from "vue";
import type {
  TableCellScope,
  TableColumnConfig,
  TableHeadScope,
  TableProps,
  TableRow,
  TableSorter,
} from "@shuimo-design/core";
import MTableColumn from "./MTableColumn.vue";

/** Vue 这边的一列：render / renderHead 就是作用域插槽那个签名，返回 VNodeChild */
export type VueTableColumn<Row = TableRow> = TableColumnConfig<Row, VNodeChild>;

/**
 * 壳自己的 props 类型：把 core 的配置数组换成 Vue 的节点类型。
 * 必须写在这里并导出 —— 放进 `<script setup>` 里是个私有名字，生成 .d.ts 时
 * `__VLS_export` 引用不到它，dts 会报 TS4025（实测）。
 */
export interface MTableProps<Row extends object = TableRow> extends Omit<
  TableProps<Row>,
  "columns"
> {
  /** 列声明，顺序就是列序；不传则按书写顺序从子组件 MTableColumn 上收集 */
  columns?: VueTableColumn<Row>[];
}

/**
 * 从默认插槽的 vnode 数组里按**书写顺序**收集 MTableColumn 的配置。
 *
 * 全程在渲染期完成：读的是 vnode 上的 props 和 children（作用域插槽函数），
 * 不用等子组件挂载、也不比 DOM 位置，所以服务端渲染出来的列序就是对的。
 * v-for / `<template>` 生成的是 Fragment，递归进去才不会把一组列当成一个。
 */
export function collectColumns<Row>(nodes: unknown): VueTableColumn<Row>[] {
  const columns: VueTableColumn<Row>[] = [];
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
      if (node.type !== MTableColumn) continue;
      const props = (node.props ?? {}) as Record<string, unknown>;
      const slots = (node.children ?? {}) as {
        default?: (scope: TableCellScope<Row>) => VNodeChild;
        head?: (scope: TableHeadScope<Row>) => VNodeChild;
      };
      columns.push({
        prop: String(props.prop ?? ""),
        label: props.label as string | undefined,
        width: props.width as string | number | undefined,
        align: props.align as VueTableColumn<Row>["align"],
        // 模板里裸写 `sortable` 到 vnode 上是空串（没经过 Boolean 归一化），这里当 true
        sortable: props.sortable === "" ? true : (props.sortable as boolean | TableSorter<Row>),
        render: slots.default,
        renderHead: slots.head,
      });
    }
  };
  walk(Array.isArray(nodes) ? nodes : []);
  return columns;
}
