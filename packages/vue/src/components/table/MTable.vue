<script setup lang="ts" generic="T extends object">
import { computed, onMounted, ref, useSlots, useTemplateRef } from "vue";
import {
  resolveTableColumns,
  tableCellScope,
  tableCellText,
  tableCellValue,
  tableClasses,
  tableGridTemplate,
  tableHeadScope,
  tableInk,
  tableRowId,
  type TableEmits,
  type TableSlots,
} from "@shuimo-design/core";
import { RenderNode } from "../../runtime/render-node";
import { useSize } from "../../runtime";
import { collectColumns, type MTableProps } from "./collect";

defineOptions({ name: "MTable" });

const {
  data = [],
  columns: columnsProp,
  rowKey,
  height,
  align = "center",
  stripe = false,
  emptyText = "暂无数据",
} = defineProps<MTableProps<T>>();
const emit = defineEmits<TableEmits<T>>();
const slots = useSlots() as TableSlots;
defineSlots<TableSlots>();

/**
 * 列的来源：传了 columns 就用传的，没传才从子组件收集。
 * 收集在渲染期完成（读 vnode 的 props），顺序 = 模板里的书写顺序。
 */
const columns = computed(() =>
  resolveTableColumns(columnsProp ?? collectColumns<T>(slots.default?.()), align),
);
const gridTemplate = computed(() => tableGridTemplate(columns.value));

// ---- 墨线：按表格实际宽度生成，宽度按 32px 分桶 ----
const root = useTemplateRef<HTMLElement>("root");
const { width } = useSize(root, "border-box");
/** 挂载后才敢走素材登记（服务端登记不了），首帧一律内联，两边输出才对得上 */
const mounted = ref(false);
onMounted(() => (mounted.value = true));
const ink = computed(() => tableInk({ width: width.value, mounted: mounted.value }));
</script>

<template>
  <div ref="root" :class="tableClasses({ stripe, height })" :style="ink.style" v-bind="ink.attrs">
    <div class="m-table__scroll" :style="{ maxHeight: height }">
      <table class="m-table__inner" role="table" :style="{ gridTemplateColumns: gridTemplate }">
        <thead class="m-table__head">
          <tr class="m-table__row m-table__row--head" role="row">
            <th
              v-for="col in columns"
              :key="col.key"
              :class="col.headClass"
              role="columnheader"
              scope="col"
              :data-prop="col.prop"
            >
              <RenderNode
                v-if="col.column.renderHead"
                :node="() => col.column.renderHead!(tableHeadScope(col.column))"
              />
              <template v-else>{{ col.label }}</template>
            </th>
          </tr>
        </thead>
        <tbody class="m-table__body">
          <template v-if="data.length">
            <tr
              v-for="(row, index) in data"
              :key="tableRowId(row, index, rowKey)"
              class="m-table__row m-table__row--body"
              role="row"
              @click="emit('rowClick', row, index, $event)"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                :class="col.cellClass"
                role="cell"
                :data-prop="col.prop"
              >
                <RenderNode
                  v-if="col.column.render"
                  :node="() => col.column.render!(tableCellScope(row, index, col.column))"
                />
                <template v-else>{{ tableCellText(tableCellValue(row, col.prop)) }}</template>
              </td>
            </tr>
          </template>
          <tr v-else class="m-table__row m-table__row--empty" role="row">
            <td class="m-table__empty" role="cell" :aria-colspan="columns.length || 1">
              <slot name="empty">{{ emptyText }}</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
