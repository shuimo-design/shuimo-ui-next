<script setup lang="ts">
import { ref } from "vue";
import { MButton, MTable, MTableColumn, type TableColumnDef } from "@shuimo-design/ui";

interface Term {
  id: number;
  param: string;
}

const data = ref<Term[]>([
  { id: 1, param: "立春" },
  { id: 2, param: "雨水" },
  { id: 3, param: "惊蛰" },
  { id: 4, param: "春分" },
  { id: 5, param: "清明" },
  { id: 6, param: "谷雨" },
  {
    id: 7,
    param:
      "立夏、小满、芒种、夏至、小暑、大暑、立秋、处暑、白露、秋分、寒露、霜降、立冬、小雪、大雪、冬至、小寒、大寒",
  },
]);

const columns: TableColumnDef[] = [
  { param: "id", label: "序号", width: 80 },
  { param: "param", label: "节气", align: "left" },
  { param: "option", label: "操作", width: 120 },
];

const clicked = ref("");
const stripe = ref(true);
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">
        用 MTableColumn 声明列：height 限高后表体内滚动、表头吸顶；default 插槽拿到
        {{ "{ row, data, value, index }" }}
      </p>
      <MTable :data="data" height="260px" @row-click="(row) => (clicked = row.param)">
        <MTableColumn :width="80" param="id" label="序号" />
        <MTableColumn param="param" label="节气" />
        <MTableColumn param="option" label="操作" :width="120">
          <template #default="{ data: row }">
            <MButton @click.stop="clicked = `操作 ${String(row.param)}`">操作</MButton>
          </template>
        </MTableColumn>
      </MTable>
      <p class="demo__hint">row-click：{{ clicked || "点一行试试" }}</p>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        用 columns 属性声明列，cell-&lt;param&gt; / head-&lt;param&gt; 插槽定制
      </p>
      <div class="demo__row">
        <MButton @click="stripe = !stripe">斑马纹：{{ stripe ? "开" : "关" }}</MButton>
      </div>
      <MTable :data="data.slice(0, 4)" :columns="columns" :stripe="stripe" row-key="id">
        <template #head-param>节气（自定义表头）</template>
        <template #cell-param="{ row, index }">
          <span>这里是 {{ row.param }} 的插槽，id 为 {{ row.id }}，index 为 {{ index }}</span>
        </template>
        <template #cell-option="{ row }">
          <MButton type="text" @click="clicked = row.param">查看</MButton>
        </template>
      </MTable>
    </div>

    <div class="demo__block">
      <p class="demo__caption">对齐：整表 align="left"，单列自己覆盖为 right</p>
      <MTable
        :data="data.slice(0, 3)"
        align="left"
        :columns="[
          { param: 'id', label: '序号', width: 80, align: 'right' },
          { param: 'param', label: '节气' },
        ]"
      />
    </div>

    <div class="demo__block">
      <p class="demo__caption">无内容</p>
      <MTable>
        <MTableColumn param="param" label="参数" />
      </MTable>
    </div>

    <div class="demo__block">
      <p class="demo__caption">空内容插槽</p>
      <MTable :columns="[{ param: 'param', label: '参数' }]">
        <template #empty>千山鸟飞绝，万径人踪灭。</template>
      </MTable>
    </div>
  </div>
</template>
