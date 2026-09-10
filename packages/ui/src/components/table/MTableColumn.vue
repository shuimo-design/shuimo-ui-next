<script setup lang="ts">
import { inject, onBeforeUnmount, ref, useId } from "vue";
import { tableKey } from "./context";
import type { TableColumnProps, TableColumnSlots } from "./types";

defineOptions({ name: "MTableColumn" });

const { param, label, width, align } = defineProps<TableColumnProps>();
const slots = defineSlots<TableColumnSlots>();

const table = inject(tableKey, undefined);
const id = useId();
const el = ref<HTMLElement | null>(null);

// 列本身不画东西，只把属性和插槽交给表格；用 getter 而不是快照，改 label / width 时表格能跟着变
table?.register({
  id,
  el,
  column: {
    get param() {
      return param;
    },
    get label() {
      return label;
    },
    get width() {
      return width;
    },
    get align() {
      return align;
    },
  },
  cell: () => slots.default,
  head: () => slots.head,
});
onBeforeUnmount(() => table?.unregister(id));
</script>

<template>
  <!-- 占位：表格按它在 DOM 里的位置决定列序，v-for 中间插一列也能排对 -->
  <span ref="el" class="m-table-column" hidden />
</template>
