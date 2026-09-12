<script setup lang="ts">
import { h, ref } from "vue";
import { MButton, MTable, MTableColumn, type VueTableColumn } from "@shuimo-design/vue";

interface Term {
  id: number;
  name: string;
}

const data = ref<Term[]>([
  { id: 1, name: "立春" },
  { id: 2, name: "雨水" },
  { id: 3, name: "惊蛰" },
  { id: 4, name: "春分" },
  { id: 5, name: "清明" },
  { id: 6, name: "谷雨" },
  {
    id: 7,
    name: "立夏、小满、芒种、夏至、小暑、大暑、立秋、处暑、白露、秋分、寒露、霜降、立冬、小雪、大雪、冬至、小寒、大寒",
  },
]);

const clicked = ref("");
const stripe = ref(true);

/**
 * 新写法：列就是一个数组，顺序即列序。
 * 自定义单元格 / 表头挂在列上的 render / renderHead，和 React 那边同一个签名。
 */
const columns: VueTableColumn<Term>[] = [
  { prop: "id", label: "序号", width: 80 },
  {
    prop: "name",
    label: "节气",
    align: "left",
    renderHead: () => "节气（自定义表头）",
    render: ({ row, index }) => `这里是 ${row.name} 的 render，id 为 ${row.id}，index 为 ${index}`,
  },
  {
    prop: "option",
    label: "操作",
    width: 120,
    render: ({ row }) =>
      h(MButton, { type: "text", onClick: () => (clicked.value = row.name) }, () => "查看"),
  },
];
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">
        用 columns 数组声明列（推荐）：顺序就是列序，服务端也算得出来；自定义单元格用列上的 render
      </p>
      <div class="demo__row">
        <MButton @click="stripe = !stripe">斑马纹：{{ stripe ? "开" : "关" }}</MButton>
      </div>
      <MTable
        :data="data.slice(0, 4)"
        :columns="columns"
        :stripe="stripe"
        row-key="id"
        @row-click="(row) => (clicked = row.name)"
      />
      <p class="demo__hint">row-click：{{ clicked || "点一行试试" }}</p>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        语法糖：用 MTableColumn 子组件声明列也行（MTable 在渲染期按书写顺序读它们的 props，
        不渲染这些子组件本身）；height 限高后表体内滚动、表头吸顶
      </p>
      <MTable :data="data" height="260px" @row-click="(row) => (clicked = row.name)">
        <MTableColumn :width="80" prop="id" label="序号" />
        <MTableColumn prop="name" label="节气" />
        <MTableColumn prop="option" label="操作" :width="120">
          <template #default="{ data: row }">
            <MButton @click.stop="clicked = `操作 ${String(row.name)}`">操作</MButton>
          </template>
        </MTableColumn>
      </MTable>
    </div>

    <div class="demo__block">
      <p class="demo__caption">对齐：整表 align="left"，单列自己覆盖为 right</p>
      <MTable
        :data="data.slice(0, 3)"
        align="left"
        :columns="[
          { prop: 'id', label: '序号', width: 80, align: 'right' },
          { prop: 'name', label: '节气' },
        ]"
      />
    </div>

    <div class="demo__block">
      <p class="demo__caption">无内容</p>
      <MTable>
        <MTableColumn prop="name" label="参数" />
      </MTable>
    </div>

    <div class="demo__block">
      <p class="demo__caption">空内容插槽</p>
      <MTable :columns="[{ prop: 'name', label: '参数' }]">
        <template #empty>千山鸟飞绝，万径人踪灭。</template>
      </MTable>
    </div>
  </div>
</template>
