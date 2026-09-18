<script setup lang="ts" generic="T extends object">
import { computed, onMounted, ref, useSlots, useTemplateRef } from "vue";
import {
  nextTableSort,
  resolveTableColumns,
  sortTableRows,
  tableCellScope,
  tableCellText,
  tableCellValue,
  tableClasses,
  tableGridTemplate,
  tableHeadScope,
  tableInk,
  tableRowId,
  tableSortAria,
  tableSortClasses,
  tableSortInk,
  tableSortOrder,
  type ResolvedTableColumn,
  type TableEmits,
  type TableSlots,
  type TableSort,
} from "@shuimo-design/core";
import { RenderNode } from "../../runtime/render-node";
import { useSize } from "../../runtime";
import { IconCaretDown, IconCaretUp } from "../../icons";
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
  defaultSort,
  sortRemote = false,
} = defineProps<MTableProps<T>>();
const emit = defineEmits<TableEmits<T>>();
const slots = useSlots() as TableSlots;
defineSlots<TableSlots>();
/** 当前排序；null 是不排。不绑时从 defaultSort 起步 */
const sortModel = defineModel<TableSort | null>("sort");

/**
 * 列的来源：传了 columns 就用传的，没传才从子组件收集。
 * 收集在渲染期完成（读 vnode 的 props），顺序 = 模板里的书写顺序。
 */
const rawColumns = computed(() => columnsProp ?? collectColumns<T>(slots.default?.()));
const columns = computed(() => resolveTableColumns(rawColumns.value, align));
const gridTemplate = computed(() => tableGridTemplate(columns.value));

// ---- 排序：model 没被赋过值（undefined）时用 defaultSort；点表头之后 model 里就是 null 或具体值 ----
const sort = computed(() =>
  sortModel.value === undefined ? (defaultSort ?? null) : sortModel.value,
);
const sortInk = tableSortInk();

function toggleSort(col: ResolvedTableColumn<T>) {
  const next = nextTableSort(sort.value, col.prop);
  sortModel.value = next;
  emit("sortChange", next);
}

/** 排好序的行，key 一并算好；sortRemote 时不在本地排，行序交给服务端 */
const rows = computed(() =>
  sortTableRows(data, sortRemote ? null : sort.value, rawColumns.value).map(({ row, index }) => ({
    row,
    index,
    key: tableRowId(row, index, rowKey),
  })),
);

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
              :aria-sort="col.sortable ? tableSortAria(sort, col.prop) : undefined"
            >
              <!-- 可排序的列：整个表头文字是一个真按钮，键盘也能点；三态循环在 core -->
              <button
                v-if="col.sortable"
                type="button"
                :class="tableSortClasses(tableSortOrder(sort, col.prop))"
                :style="sortInk"
                @click="toggleSort(col)"
              >
                <RenderNode
                  v-if="col.column.renderHead"
                  :node="() => col.column.renderHead!(tableHeadScope(col.column))"
                />
                <template v-else>{{ col.label }}</template>
                <span class="m-table__sort-icons" aria-hidden="true">
                  <span class="m-table__sort-icon m-table__sort-icon--ascending"
                    ><IconCaretUp
                  /></span>
                  <span class="m-table__sort-icon m-table__sort-icon--descending"
                    ><IconCaretDown
                  /></span>
                </span>
              </button>
              <RenderNode
                v-else-if="col.column.renderHead"
                :node="() => col.column.renderHead!(tableHeadScope(col.column))"
              />
              <template v-else>{{ col.label }}</template>
            </th>
          </tr>
        </thead>
        <tbody class="m-table__body">
          <template v-if="rows.length">
            <tr
              v-for="{ row, index, key } in rows"
              :key="key"
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
