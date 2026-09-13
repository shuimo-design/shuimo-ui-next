<script setup lang="ts">
import { computed, provide, useTemplateRef, type VNodeChild } from "vue";
import { useSize } from "../../runtime";
import {
  addMenuKey,
  buildMenuNodes,
  menuInkStyle,
  moveMenuFocus,
  resolveMenuFields,
  toggleMenuKey,
  MENU_ROOT_PARENT,
  type MenuEmits,
  type MenuFocusTarget,
  type MenuItem,
  type MenuKey,
  type MenuLabelScope,
  type MenuProps,
  type MenuSlots,
} from "@shuimo-design/core";
import { menuKey, menuParentKey } from "./context";
import MenuNode from "./MenuNode.vue";

defineOptions({ name: "MMenu" });

const { data, fieldNames, defaultExpandAll = false } = defineProps<MenuProps>();
const emit = defineEmits<MenuEmits>();
const slots = defineSlots<MenuSlots>();
/** 当前选中的菜单项 key */
const model = defineModel<MenuKey | undefined>();
/** 展开的子菜单 key */
const expandedKeys = defineModel<MenuKey[]>("expandedKeys", { default: () => [] });

const root = useTemplateRef<HTMLElement>("root");

const fields = computed(() => resolveMenuFields(fieldNames));
const nodes = computed(() => (data ? buildMenuNodes(data, fields.value) : []));

/* ---------- 展开 ---------- */

const expandedSet = computed(() => new Set(expandedKeys.value));

/** 程序性展开（跟随当前项、初始全展开）：已经展开时 addMenuKey 原样返回，引用相同就不写回 */
function expand(key: MenuKey) {
  const next = addMenuKey(expandedKeys.value, key);
  if (next !== expandedKeys.value) expandedKeys.value = next;
}

function toggleExpand(item: MenuItem) {
  const expanded = expandedSet.value.has(item.key);
  expandedKeys.value = toggleMenuKey(expandedKeys.value, item.key);
  emit("expand", item, !expanded);
}

/* ---------- 点击 ---------- */

function activate(item: MenuItem, hasChildren: boolean, event: MouseEvent | KeyboardEvent) {
  if (item.disabled) return;
  emit("nodeClick", item, event);
  if (hasChildren) {
    toggleExpand(item);
    return;
  }
  if (model.value === item.key) return;
  model.value = item.key;
  emit("change", item.key);
}

/* ---------- 键盘 ---------- */

// 看得见的行靠查 DOM 找（手写的 MMenuItem 根组件手里没有那棵树），整段在 core 里
function moveFocus(from: HTMLElement, target: MenuFocusTarget) {
  moveMenuFocus(root.value, from, target);
}

/* ---------- 文字 ---------- */

function renderLabel(scope: MenuLabelScope): VNodeChild {
  return (slots.label ? slots.label(scope) : scope.item.label) as VNodeChild;
}

/* ---------- 竖线 ---------- */

// 左侧那一笔按菜单实际高度生成；分桶和画幅计算都在 core 的 menuInkStyle 里
const { height } = useSize(root);
const inkStyle = computed(() => menuInkStyle(height.value));

// 值字段写成 getter：Vue 要在子组件读的那一刻才建立依赖，存好的普通值追不到更新
provide(menuKey, {
  get current() {
    return model.value;
  },
  get defaultExpandAll() {
    return defaultExpandAll;
  },
  get expanded() {
    return expandedSet.value;
  },
  toggleExpand,
  expand,
  activate,
  moveFocus,
  renderLabel,
});
// 根层：一级项的 level 是 0；根不用记后代
provide(menuParentKey, MENU_ROOT_PARENT);
</script>

<template>
  <ul ref="root" class="m-menu" role="menu" aria-orientation="vertical" :style="inkStyle">
    <template v-if="data">
      <MenuNode v-for="node in nodes" :key="node.key" :node="node" />
    </template>
    <slot v-else />
  </ul>
</template>
