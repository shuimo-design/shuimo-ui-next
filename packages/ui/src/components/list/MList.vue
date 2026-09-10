<script setup lang="ts" generic="T">
import "./list.css";
import { provide, toRef } from "vue";
import { inkBlobUrl } from "../../ink/assets/blob";
import { inkVarBindings } from "../../ink/registry";
import { listKey } from "./context";
import MListItem from "./MListItem.vue";
import type { ListItemScope, ListProps, ListSlots } from "./types";

defineOptions({ name: "MList" });

const { data, marker = true, autoActive = false } = defineProps<ListProps<T>>();
defineSlots<ListSlots<T>>();

provide(listKey, { marker: toRef(() => marker) });

/**
 * 项目符号的两团墨：外圈和内点各用一个种子，毛边才不会一模一样。
 * 旧版是一张 34×34 的墨圈精灵图，这里改用素材库按种子生成，写成 CSS 变量给 m.ink 层当遮罩。
 * 两团都是固定素材：走素材登记，样式表里只写一次，列表元素上只挂属性；登记不了（SSR）才内联。
 */
const ink = inkVarBindings({
  "--m-list-blob-ring": inkBlobUrl({ seed: 3, raggedness: 0.2 }),
  "--m-list-blob-dot": inkBlobUrl({ seed: 7, raggedness: 0.16 }),
});

/**
 * 没有 data 时默认插槽不带作用域（使用者自己放 MListItem，不会去读 item）。
 * 插槽类型只声明了一种签名，这里用空对象顶上，免得模板类型检查报缺参。
 */
const emptyScope = {} as ListItemScope<T>;

/** 没给插槽时的兜底文字：基础类型直出，对象转 JSON */
function fallbackText(item: T): string {
  return typeof item === "object" && item !== null ? JSON.stringify(item) : String(item);
}

/** 数据项是对象且带 active 字段时听它的，否则看 autoActive（旧版 `d.active ?? autoActive`） */
function isActive(item: T): boolean {
  if (typeof item === "object" && item !== null && "active" in item) {
    const own = (item as { active?: unknown }).active;
    if (typeof own === "boolean") return own;
  }
  return autoActive;
}
</script>

<template>
  <ul class="m-list" :style="ink.style" v-bind="ink.attrs">
    <template v-if="data">
      <MListItem v-for="(item, index) in data" :key="index" :active="isActive(item)">
        <slot :item="item" :index="index">{{ fallbackText(item) }}</slot>
      </MListItem>
    </template>
    <slot v-else v-bind="emptyScope" />
  </ul>
</template>
