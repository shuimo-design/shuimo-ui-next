<script setup lang="ts">
import { computed, useId, useTemplateRef, watch } from "vue";
import {
  createPopoverFocus,
  createPopoverTrigger,
  dropdownClasses,
  dropdownFirstItem,
  dropdownItemClasses,
  dropdownMenuKeyAction,
  dropdownReferenceAria,
  dropdownTriggerKeyAction,
  moveDropdownFocus,
  DROPDOWN_BORDER_STROKE,
  DROPDOWN_REFERENCE_ARIA,
  type DropdownEmits,
  type DropdownItem,
  type DropdownProps,
  type DropdownSlots,
} from "@shuimo-design/core";
import MPopper from "../../internal/popper/MPopper.vue";
import { MBorder } from "../border";
import { useController } from "../../runtime";

defineOptions({ name: "MDropdown", inheritAttrs: false });

const {
  items,
  trigger = "click",
  placement = "bottom-start",
  disabled = false,
  offset = 6,
  teleport = true,
  seed = 1,
} = defineProps<DropdownProps>();
const emit = defineEmits<DropdownEmits>();
defineSlots<DropdownSlots>();
/** 是否展开；不传也能用，由 trigger 自己管 */
const open = defineModel<boolean>("open", { default: false });

const menuId = useId();
const wrapper = useTemplateRef<HTMLElement>("wrapper");
const float = useTemplateRef<HTMLElement>("float");
const menu = useTemplateRef<HTMLElement>("menu");

// 开合时序（hover / click、Escape、点外面）全在 core 的控制器里，和气泡是同一份；
// 展开状态归 v-model 持有，控制器只负责请求改变
const { controller: popover, state } = useController(createPopoverTrigger, () => ({
  trigger,
  disabled,
  openDelay: 0,
  closeDelay: 100,
  disableClickAway: false,
  show: open.value,
  onChange: (next: boolean) => (open.value = next),
}));
// 焦点搬运：ArrowDown 打开时送到第一项，选中 / Escape 时还给触发元素
const focus = createPopoverFocus({ target: dropdownFirstItem });

watch(
  [wrapper, float, menu],
  () => {
    popover.setWrapper(wrapper.value);
    popover.setPanel(float.value);
    focus.setPanel(menu.value);
  },
  { immediate: true, flush: "post" },
);
// 壳里的内容换了要重新挑参照元素
watch(
  () => open.value,
  () => popover.refresh(),
  { flush: "post" },
);

const expanded = computed(() => open.value && !disabled);
const reference = computed(() => state.value.reference);
watch(reference, (el) => focus.setReference(el), { immediate: true });

// 参照元素标成「带菜单的按钮」，读屏能知道按下去会出一个菜单
watch([reference, expanded], ([el, isOpen], [prevEl]) => {
  for (const name of DROPDOWN_REFERENCE_ARIA) {
    if (prevEl && prevEl !== el) prevEl.removeAttribute(name);
  }
  if (!el) return;
  const aria = dropdownReferenceAria({ open: isOpen, menuId });
  for (const name of DROPDOWN_REFERENCE_ARIA) {
    const value = aria[name];
    if (value === undefined) el.removeAttribute(name);
    else el.setAttribute(name, value);
  }
});

function select(item: DropdownItem) {
  if (item.disabled || disabled) return;
  emit("select", item.key, item);
  focus.restoreFocus();
  popover.setOpen(false);
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (disabled) return;
  const action = dropdownTriggerKeyAction(event.key);
  if (!action.prevent) return;
  event.preventDefault();
  // 没开就先开，菜单挂上后焦点会落到第一项；已经开着就直接挪
  popover.setOpen(true);
  focus.requestFocus();
}

function onItemKeydown(event: KeyboardEvent, item: DropdownItem) {
  const action = dropdownMenuKeyAction(event.key);
  if (action.prevent) event.preventDefault();
  if (action.kind === "focus" && action.target) {
    moveDropdownFocus(menu.value, event.currentTarget as HTMLElement, action.target);
  } else if (action.kind === "select") {
    select(item);
  } else if (action.kind === "close") {
    focus.restoreFocus();
  }
}

defineExpose({
  show: () => popover.setOpen(true),
  hide: () => popover.setOpen(false),
});
</script>

<template>
  <span
    ref="wrapper"
    :class="dropdownClasses({ wrapOnly: state.wrapOnly, open: expanded, disabled })"
    v-bind="$attrs"
    @mouseenter="popover.onTriggerEnter"
    @mouseleave="popover.onTriggerLeave"
    @click="popover.onTriggerClick"
    @focusin="popover.onTriggerFocusin"
    @focusout="popover.onTriggerFocusout"
    @keydown="onTriggerKeydown"
  >
    <slot />
  </span>
  <MPopper
    :open="expanded"
    :reference="reference"
    :placement="placement"
    :offset="offset"
    :teleport="teleport"
    @click-outside="popover.onClickOutside"
  >
    <div
      ref="float"
      class="m-dropdown__float"
      @mouseenter="popover.onPanelEnter"
      @mouseleave="popover.onPanelLeave"
    >
      <MBorder class="m-dropdown__panel" :seed="seed" :stroke-width="DROPDOWN_BORDER_STROKE">
        <ul :id="menuId" ref="menu" class="m-dropdown__menu" role="menu">
          <template v-for="item in items" :key="item.key">
            <li v-if="item.divided" class="m-dropdown__divider" role="separator" />
            <li
              :class="dropdownItemClasses(item)"
              role="menuitem"
              tabindex="-1"
              :aria-disabled="item.disabled || undefined"
              @click="select(item)"
              @keydown="onItemKeydown($event, item)"
            >
              <slot name="item" :item="item">{{ item.label }}</slot>
            </li>
          </template>
        </ul>
      </MBorder>
    </div>
  </MPopper>
</template>
