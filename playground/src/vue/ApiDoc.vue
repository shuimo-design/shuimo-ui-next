<script setup lang="ts">
import { computed } from "vue";
import { MTable, MTableColumn } from "@shuimo-design/vue";
import { apiTables } from "../shared/api";

/**
 * 页底的属性 / 事件 / 插槽表。数据和挑列的逻辑都在 ../shared/api.ts，
 * 这里只负责画表格；React 版（src/react/ApiDoc.tsx）画的是同样的表。
 *
 * names 是这一页要列的全部组件：主组件在前，MTableColumn、MFormItem 这类
 * 没有独立页面的子组件跟在后面 —— 否则它们的文档生成了却没地方看。
 */
const { names } = defineProps<{ names: string[] }>();

const docs = computed(() =>
  names.map((name) => ({ name, tables: apiTables(name, "vue") })).filter((d) => d.tables),
);
</script>

<template>
  <section v-if="docs.length" class="api">
    <h3 class="api__title">API</h3>

    <section v-for="doc in docs" :key="doc.name" class="api__group">
      <h4 class="api__name">
        <code>{{ doc.name }}</code>
      </h4>

      <div v-if="doc.tables!.props.length" class="api__block">
        <h5 class="api__sub">属性 Props</h5>
        <MTable :data="doc.tables!.props" align="left">
          <MTableColumn prop="name" label="名称" :width="180">
            <template #default="{ data: row }">
              <code class="api__code">{{ row.name }}</code>
              <span v-if="row.required" class="api__required">必填</span>
            </template>
          </MTableColumn>
          <MTableColumn prop="type" label="类型">
            <template #default="{ data: row }">
              <code class="api__code">{{ row.type }}</code>
            </template>
          </MTableColumn>
          <MTableColumn prop="default" label="默认值" :width="110">
            <template #default="{ data: row }">
              <code v-if="row.default" class="api__code">{{ row.default }}</code>
              <span v-else class="api__none">—</span>
            </template>
          </MTableColumn>
          <MTableColumn prop="description" label="说明" />
        </MTable>
      </div>

      <div v-if="doc.tables!.events.length" class="api__block">
        <h5 class="api__sub">{{ doc.tables!.eventsTitle }}</h5>
        <MTable :data="doc.tables!.events" align="left">
          <MTableColumn prop="name" label="名称" :width="180">
            <template #default="{ data: row }">
              <code class="api__code">{{ row.name }}</code>
            </template>
          </MTableColumn>
          <MTableColumn prop="description" label="说明" />
        </MTable>
      </div>

      <div v-if="doc.tables!.slots.length" class="api__block">
        <h5 class="api__sub">{{ doc.tables!.slotsTitle }}</h5>
        <MTable :data="doc.tables!.slots" align="left">
          <MTableColumn prop="name" label="名称" :width="180">
            <template #default="{ data: row }">
              <code class="api__code">{{ row.name }}</code>
            </template>
          </MTableColumn>
          <MTableColumn prop="description" label="说明" />
        </MTable>
      </div>
    </section>
  </section>
</template>
