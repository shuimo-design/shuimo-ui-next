<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  onScopeDispose,
  provide,
  shallowRef,
  useId,
  useTemplateRef,
  watch,
} from "vue";
import {
  createMenuDescendants,
  menuDescendantUid,
  menuHasDescendant,
  menuItemClasses,
  menuKeyAction,
  type MenuItem,
  type MenuItemProps,
  type MenuItemSlots,
} from "@shuimo-design/core";
import { menuParentKey, useMenuContext, useMenuParent } from "./context";

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
const expanded = computed(() => hasChildren.value && menu.expanded.has(name));
const current = computed(() => menu.current === name);

/* ---------- 后代登记 ---------- */

// 子项在 setup 时登记到这张表并一路往上报，父项 onMounted 时就已知道自己下面有哪些 key。
// 用 core 的登记表而不是一个响应式 Set：两个框架共用同一份，React 那边靠订阅重渲染
const descendants = createMenuDescendants();
const snapshot = shallowRef(descendants.getSnapshot());
onScopeDispose(descendants.subscribe(() => (snapshot.value = descendants.getSnapshot())));
const containsCurrent = computed(() => menuHasDescendant(snapshot.value, menu.current));

provide(menuParentKey, {
  level: level + 1,
  register(key) {
    descendants.register({ uid: menuDescendantUid(key) });
    parent.register(key);
  },
  unregister(key) {
    descendants.unregister(menuDescendantUid(key));
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

const classes = computed(() =>
  menuItemClasses({
    root: level === 0,
    current: current.value,
    active: current.value || containsCurrent.value,
    expanded: expanded.value,
    disabled,
  }),
);

function onClick(event: MouseEvent) {
  menu.activate(item.value, hasChildren.value, event);
}

function onKeydown(event: KeyboardEvent) {
  const el = row.value;
  if (!el) return;
  const action = menuKeyAction(event.key, {
    hasChildren: hasChildren.value,
    expanded: expanded.value,
    disabled,
  });
  if (action.prevent) event.preventDefault();
  if (action.kind === "focus" && action.target) menu.moveFocus(el, action.target);
  else if (action.kind === "toggle") menu.toggleExpand(item.value);
  else if (action.kind === "activate") menu.activate(item.value, hasChildren.value, event);
}
</script>

<template>
  <li :class="classes" :style="{ '--m-menu-level': level }" role="none">
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
