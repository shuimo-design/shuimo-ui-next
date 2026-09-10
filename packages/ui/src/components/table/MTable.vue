<script setup lang="ts" generic="T extends object">
import "./table.css";
import { computed, provide, shallowReactive, useTemplateRef, type FunctionalComponent } from "vue";
import { useElementSize } from "@vueuse/core";
import { brushLineUrl } from "../../ink/assets/line";
import { inkShapeUrl } from "../../ink/assets/shape";
import { inkVarBindings } from "../../ink/registry";
import { tableKey, type TableColumnRegistration } from "./context";
import type {
  TableCellScope,
  TableColumnDef,
  TableEmits,
  TableHeadScope,
  TableProps,
  TableRow,
  TableSlots,
} from "./types";

defineOptions({ name: "MTable" });

const {
  data = [],
  columns: columnsProp,
  rowKey,
  height,
  align = "center",
  stripe = false,
  emptyText = "暂无数据",
} = defineProps<TableProps<T>>();
const emit = defineEmits<TableEmits<T>>();
const slots = defineSlots<TableSlots<T>>();

/** 组件里渲染任意插槽函数的结果：写成函数式组件，模板里才能 <component :is> 它 */
const RenderNode: FunctionalComponent<{ render: () => unknown }> = (props) =>
  props.render() as ReturnType<FunctionalComponent>;
RenderNode.props = ["render"];

/** 表格渲染时用的一列：columns 属性和 MTableColumn 两条路都归一到这里 */
interface ColumnState {
  key: string;
  column: TableColumnDef;
  cell: ((scope: TableCellScope<T>) => unknown) | undefined;
  head: ((scope: TableHeadScope) => unknown) | undefined;
}

// ---- MTableColumn 登记 ----
const registered = shallowReactive(new Map<string, TableColumnRegistration>());
provide(tableKey, {
  register: (column) => registered.set(column.id, column),
  unregister: (id) => registered.delete(id),
});

/**
 * 列组件的作用域按 TableRow 声明（它拿不到表格的 T），表格这边的行是 T；
 * 两者只是同一份数据的两种叫法，这里抹平类型给模板用。
 */
function adaptCell(
  cell: ((scope: TableCellScope<TableRow>) => unknown) | undefined,
): ((scope: TableCellScope<T>) => unknown) | undefined {
  return cell as ((scope: TableCellScope<T>) => unknown) | undefined;
}

const columns = computed<ColumnState[]>(() => {
  if (columnsProp) {
    return columnsProp.map((column) => ({
      key: column.param,
      column,
      cell: slots[`cell-${column.param}`],
      head: slots[`head-${column.param}`],
    }));
  }
  // 登记顺序不一定是书写顺序（v-for 中间插入、条件切换），按占位元素在 DOM 里的先后排
  const list = [...registered.values()].sort((a, b) => {
    const ea = a.el.value;
    const eb = b.el.value;
    if (!ea || !eb) return 0;
    return ea.compareDocumentPosition(eb) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });
  return list.map((reg) => ({
    key: reg.id,
    column: reg.column,
    cell: adaptCell(reg.cell()),
    head: reg.head(),
  }));
});

/** 列宽 → grid 轨道：给了宽度就定死，没给的按内容分剩余空间 */
function track(width: string | number | undefined): string {
  if (width === undefined || width === "") return "auto";
  return typeof width === "number" ? `${width}px` : width;
}
const gridTemplate = computed(() => columns.value.map((c) => track(c.column.width)).join(" "));

function cellValue(row: T, param: string): unknown {
  return (row as Record<string, unknown>)[param];
}

/** 空值不显示 "undefined"，对象转 JSON，其余直出 */
function cellText(value: unknown): string {
  if (value === undefined || value === null) return "";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function cellScope(row: T, index: number, column: TableColumnDef): TableCellScope<T> {
  return { row, data: row, value: cellValue(row, column.param), index, column };
}

function keyOf(row: T, index: number): string | number {
  if (typeof rowKey === "function") return rowKey(row, index);
  if (rowKey) {
    const value = cellValue(row, rowKey);
    if (typeof value === "string" || typeof value === "number") return value;
  }
  return index;
}

function alignOf(column: TableColumnDef) {
  return column.align ?? align;
}

// ---- 墨线：按表格实际宽度生成，宽度按 32px 分桶，拉伸不超过一成，看不出变形 ----
const root = useTemplateRef<HTMLElement>("root");
const { width } = useElementSize(root, undefined, { box: "border-box" });
const SEED = 11;
const WIDTH_BUCKET = 32;
const assets = computed(() => {
  // SSR 和挂载瞬间量到 0：先不给变量，CSS 里回落到通用线
  if (width.value <= 0) return undefined;
  const length = Math.max(WIDTH_BUCKET, Math.ceil(width.value / WIDTH_BUCKET) * WIDTH_BUCKET);
  // 两种笔宽算出来的画幅高正好是 18px / 9px，和 CSS 里的回落值一致：
  // 量到宽度后写入变量时表格高度不变，不会触发 ResizeObserver 的循环告警
  const thick = brushLineUrl({ seed: SEED, length, thickness: 3, flyingWhite: 0.2 });
  const thin = brushLineUrl({ seed: SEED + 1, length, thickness: 1.5, roughness: 0.4 });
  const wash = inkShapeUrl(length, 40, { seed: SEED, raggedness: 1, corner: 0.08 });
  return { thick, thin, wash };
});
// 三张图走素材登记：同宽度桶的表共用样式表里的一条规则，元素上只挂属性；登记不了（SSR）才内联
const ink = computed(() =>
  inkVarBindings({
    "--m-table-line-thick": assets.value?.thick.url,
    "--m-table-line-thin": assets.value?.thin.url,
    "--m-table-wash": assets.value?.wash.url,
  }),
);
const inkStyle = computed(() => {
  if (!assets.value) return undefined;
  const { thick, thin, wash } = assets.value;
  return {
    ...ink.value.style,
    "--m-table-ink-thick-band": `${thick.height}px`,
    "--m-table-ink-thin-band": `${thin.height}px`,
    "--m-table-wash-pad": `${wash.padding}px`,
  };
});
</script>

<template>
  <div
    ref="root"
    class="m-table"
    :class="{ 'm-table--stripe': stripe, 'm-table--scroll': !!height }"
    :style="inkStyle"
    v-bind="ink.attrs"
  >
    <!-- 列组件不出现在视觉上，只留占位元素定顺序 -->
    <div class="m-table__columns" hidden><slot /></div>
    <div class="m-table__scroll" :style="{ maxHeight: height }">
      <table class="m-table__inner" role="table" :style="{ gridTemplateColumns: gridTemplate }">
        <thead class="m-table__head">
          <tr class="m-table__row m-table__row--head" role="row">
            <th
              v-for="col in columns"
              :key="col.key"
              class="m-table__th"
              :class="`m-table__th--${alignOf(col.column)}`"
              role="columnheader"
              scope="col"
              :data-param="col.column.param"
            >
              <RenderNode v-if="col.head" :render="() => col.head!({ column: col.column })" />
              <template v-else>{{ col.column.label }}</template>
            </th>
          </tr>
        </thead>
        <tbody class="m-table__body">
          <template v-if="data.length">
            <tr
              v-for="(row, index) in data"
              :key="keyOf(row, index)"
              class="m-table__row m-table__row--body"
              role="row"
              @click="emit('rowClick', row, index, $event)"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                class="m-table__td"
                :class="`m-table__td--${alignOf(col.column)}`"
                role="cell"
                :data-param="col.column.param"
              >
                <RenderNode
                  v-if="col.cell"
                  :render="() => col.cell!(cellScope(row, index, col.column))"
                />
                <template v-else>{{ cellText(cellValue(row, col.column.param)) }}</template>
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
