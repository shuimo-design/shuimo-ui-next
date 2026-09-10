<script setup lang="ts">
import "./menu.css";
import { computed, provide, useTemplateRef, type VNodeChild } from "vue";
import { useElementSize } from "@vueuse/core";
import { brushLineUrl } from "../../ink/assets/line";
import { menuKey, menuParentKey, type MenuFocusTarget, type MenuTreeNode } from "./context";
import MenuNode from "./MenuNode.vue";
import type {
  MenuEmits,
  MenuItem,
  MenuItemData,
  MenuKey,
  MenuLabelScope,
  MenuProps,
  MenuSlots,
} from "./types";

defineOptions({ name: "MMenu" });

const { data, fieldNames, defaultExpandAll = false } = defineProps<MenuProps>();
const emit = defineEmits<MenuEmits>();
const slots = defineSlots<MenuSlots>();
const model = defineModel<MenuKey | undefined>();
const expandedKeys = defineModel<MenuKey[]>("expandedKeys", { default: () => [] });

const root = useTemplateRef<HTMLElement>("root");

/* ---------- 数据整理 ---------- */

const fields = computed(() => ({
  key: fieldNames?.key ?? "key",
  label: fieldNames?.label ?? "label",
  children: fieldNames?.children ?? "children",
  disabled: fieldNames?.disabled ?? "disabled",
}));

function isDataList(value: unknown): value is MenuItemData[] {
  return Array.isArray(value);
}

/** 没 key 的项按路径补一个，保证展开态和当前项都能记住 */
function build(items: MenuItemData[], path: string): MenuTreeNode[] {
  const f = fields.value;
  return items.map((raw, index) => {
    const rawKey = raw[f.key];
    const key =
      typeof rawKey === "string" || typeof rawKey === "number" ? rawKey : `${path}${index}`;
    const children = raw[f.children];
    return {
      key,
      label: String(raw[f.label] ?? ""),
      disabled: Boolean(raw[f.disabled]),
      children: isDataList(children) ? build(children, `${key}-`) : [],
      data: raw,
    };
  });
}

const nodes = computed(() => (data ? build(data, "") : []));

/* ---------- 展开 ---------- */

const expandedSet = computed(() => new Set(expandedKeys.value));

function isExpanded(key: MenuKey): boolean {
  return expandedSet.value.has(key);
}

function expand(key: MenuKey) {
  if (isExpanded(key)) return;
  expandedKeys.value = [...expandedKeys.value, key];
}

function toggleExpand(item: MenuItem) {
  const expanded = isExpanded(item.key);
  expandedKeys.value = expanded
    ? expandedKeys.value.filter((k) => k !== item.key)
    : [...expandedKeys.value, item.key];
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

/** 看得见的菜单项行，按屏幕顺序；收起的子菜单带 inert，整支跳过 */
function visibleRows(): HTMLElement[] {
  const el = root.value;
  if (!el) return [];
  return [...el.querySelectorAll<HTMLElement>('[role="menuitem"]')].filter(
    (row) => !row.closest("[inert]"),
  );
}

function moveFocus(from: HTMLElement, target: MenuFocusTarget) {
  if (target === "parent") {
    // 自己所在的 li 往上找到父项的 li，再取它自己那一行
    const parentItem = from.closest(".m-menu-item")?.parentElement?.closest(".m-menu-item");
    parentItem?.querySelector<HTMLElement>(':scope > [role="menuitem"]')?.focus();
    return;
  }
  const rows = visibleRows();
  const index = rows.indexOf(from);
  const at =
    target === "first"
      ? 0
      : target === "last"
        ? rows.length - 1
        : target === "next"
          ? index + 1
          : index - 1;
  rows[at]?.focus();
}

/* ---------- 文字 ---------- */

function renderLabel(scope: MenuLabelScope): VNodeChild {
  return (slots.label ? slots.label(scope) : scope.item.label) as VNodeChild;
}

/* ---------- 竖线 ---------- */

// 左侧那一笔按菜单实际高度生成：高度按 32px 分桶，避免每变一像素就重画一张 SVG
const { height } = useElementSize(root);
const lineLength = computed(() => Math.max(64, Math.ceil(height.value / 32) * 32));
const line = computed(() =>
  brushLineUrl({ seed: 3, vertical: true, length: lineLength.value, thickness: 2, wobble: 1 }),
);
const inkStyle = computed(() => ({
  "--m-menu-line-mask": `url("${line.value.url}")`,
  "--m-menu-line-band": `${line.value.width}px`,
}));

provide(menuKey, {
  current: model,
  defaultExpandAll,
  isExpanded,
  toggleExpand,
  expand,
  activate,
  moveFocus,
  renderLabel,
});
// 根层：一级项的 level 是 0；根不用记后代
provide(menuParentKey, { level: 0, register: () => {}, unregister: () => {} });
</script>

<template>
  <ul ref="root" class="m-menu" role="menu" aria-orientation="vertical" :style="inkStyle">
    <template v-if="data">
      <MenuNode v-for="node in nodes" :key="node.key" :node="node" />
    </template>
    <slot v-else />
  </ul>
</template>
