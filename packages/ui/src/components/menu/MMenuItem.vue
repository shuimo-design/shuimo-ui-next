<script setup lang="ts">
import "./menu.css";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  provide,
  shallowReactive,
  useId,
  useTemplateRef,
  watch,
} from "vue";
import { menuParentKey, useMenuContext, useMenuParent } from "./context";
import type { MenuItem, MenuItemProps, MenuItemSlots, MenuKey } from "./types";

defineOptions({ name: "MMenuItem" });

const { name, label = "", disabled = false, data = undefined } = defineProps<MenuItemProps>();
const slots = defineSlots<MenuItemSlots>();

const menu = useMenuContext();
const parent = useMenuParent();

const level = parent.level;
const labelId = useId();
const row = useTemplateRef<HTMLElement>("row");

const item = computed<MenuItem>(() => ({ key: name, label, disabled, level, data }));
const hasChildren = computed(() => Boolean(slots.default));
const expanded = computed(() => hasChildren.value && menu.isExpanded(name));
const current = computed(() => menu.current.value === name);

/* ---------- 后代登记 ---------- */

// 子项在 setup 时登记到这里并一路往上报，父项 onMounted 时就已知道自己下面有哪些 key
const descendants = shallowReactive(new Set<MenuKey>());
const containsCurrent = computed(() => {
  const cur = menu.current.value;
  return cur !== undefined && descendants.has(cur);
});

provide(menuParentKey, {
  level: level + 1,
  register(key) {
    descendants.add(key);
    parent.register(key);
  },
  unregister(key) {
    descendants.delete(key);
    parent.unregister(key);
  },
});
parent.register(name);
onBeforeUnmount(() => parent.unregister(name));

/* ---------- 展开跟随当前项（旧版 expand: 'isActive' 的行为） ---------- */

onMounted(() => {
  if (hasChildren.value && (menu.defaultExpandAll || containsCurrent.value)) menu.expand(name);
});
watch(containsCurrent, (inside) => {
  if (inside && hasChildren.value) menu.expand(name);
});

/* ---------- 交互 ---------- */

function onClick(event: MouseEvent) {
  menu.activate(item.value, hasChildren.value, event);
}

function onKeydown(event: KeyboardEvent) {
  const el = row.value;
  if (!el) return;
  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      menu.moveFocus(el, "next");
      break;
    case "ArrowUp":
      event.preventDefault();
      menu.moveFocus(el, "prev");
      break;
    case "Home":
      event.preventDefault();
      menu.moveFocus(el, "first");
      break;
    case "End":
      event.preventDefault();
      menu.moveFocus(el, "last");
      break;
    case "ArrowRight":
      if (!hasChildren.value) return;
      event.preventDefault();
      if (expanded.value) menu.moveFocus(el, "next");
      else if (!disabled) menu.toggleExpand(item.value);
      break;
    case "ArrowLeft":
      event.preventDefault();
      if (expanded.value && !disabled) menu.toggleExpand(item.value);
      else menu.moveFocus(el, "parent");
      break;
    case "Enter":
    case " ":
      event.preventDefault();
      menu.activate(item.value, hasChildren.value, event);
      break;
    default:
  }
}
</script>

<template>
  <li
    class="m-menu-item"
    :class="{
      'm-menu-item--root': level === 0,
      'm-menu-item--current': current,
      'm-menu-item--active': current || containsCurrent,
      'm-menu-item--expanded': expanded,
      'm-menu-item--disabled': disabled,
    }"
    :style="{ '--m-menu-level': level }"
    role="none"
  >
    <div
      ref="row"
      class="m-menu-item__row"
      role="menuitem"
      tabindex="0"
      :aria-labelledby="labelId"
      :aria-expanded="hasChildren ? expanded : undefined"
      :aria-disabled="disabled || undefined"
      :aria-current="current ? 'true' : undefined"
      @click="onClick"
      @keydown="onKeydown"
    >
      <span :id="labelId" class="m-menu-item__label">
        <slot name="label" :item="item" :level="level">{{ label }}</slot>
      </span>
    </div>
    <div v-if="hasChildren" class="m-menu-item__sub">
      <!-- 收起时 inert：还在 DOM 里参与高度动画，但不可聚焦、方向键也跳过 -->
      <ul class="m-menu-item__sub-list" role="menu" :inert="!expanded">
        <slot />
      </ul>
    </div>
  </li>
</template>
