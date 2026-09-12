<script setup lang="ts">
import { computed } from "vue";
import { MTable, MTableColumn } from "@shuimo-design/vue";
import { apiTables } from "../shared/api";

/**
 * 页底的属性 / 事件 / 插槽表。数据和挑列的逻辑都在 ../shared/api.ts，
 * 这里只负责画表格；React 版（src/react/ApiDoc.tsx）画的是同样三张表。
 */
const { name } = defineProps<{ name: string }>();

const tables = computed(() => apiTables(name, "vue"));
</script>

<template>
  <section v-if="tables" class="api">
    <h3 class="api__title">API</h3>

    <div v-if="tables.props.length" class="api__block">
      <h4 class="api__sub">属性 Props</h4>
      <MTable :data="tables.props" align="left">
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

    <div v-if="tables.events.length" class="api__block">
      <h4 class="api__sub">{{ tables.eventsTitle }}</h4>
      <MTable :data="tables.events" align="left">
        <MTableColumn prop="name" label="名称" :width="180">
          <template #default="{ data: row }">
            <code class="api__code">{{ row.name }}</code>
          </template>
        </MTableColumn>
        <MTableColumn prop="description" label="说明" />
      </MTable>
    </div>

    <div v-if="tables.slots.length" class="api__block">
      <h4 class="api__sub">{{ tables.slotsTitle }}</h4>
      <MTable :data="tables.slots" align="left">
        <MTableColumn prop="name" label="名称" :width="180">
          <template #default="{ data: row }">
            <code class="api__code">{{ row.name }}</code>
          </template>
        </MTableColumn>
        <MTableColumn prop="description" label="说明" />
      </MTable>
    </div>
  </section>
</template>
