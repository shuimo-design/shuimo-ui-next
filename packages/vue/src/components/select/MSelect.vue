<script setup lang="ts">
import { computed, useId, useTemplateRef, watch } from "vue";
import {
  createSelect,
  selectActiveId,
  selectClasses,
  selectHasSearch,
  selectIsSelected,
  selectOptionClasses,
  selectOptionId,
  selectSearchPlaceholder,
  selectSearchValue,
  selectShowClear,
  selectView,
  SELECT_CLEAR_LABEL,
  SELECT_DROPDOWN_BRUSH,
  SELECT_EMPTY_TEXT,
  SELECT_LOADING_TEXT,
  SELECT_MAX_HEIGHT,
  SELECT_PLACEHOLDER,
  SELECT_TRIGGER_BRUSH,
  type SelectEmits,
  type SelectNormalizedOption,
  type SelectProps,
  type SelectSlots,
  type SelectValue,
} from "@shuimo-design/core";
import { IconCheck, IconChevronDown, IconClose, IconLoading } from "../../icons";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { useBrushBorder } from "../../ink";
import MPopper from "../../internal/popper/MPopper.vue";
import { MTag } from "../tag";
import { useController } from "../../runtime";

defineOptions({ name: "MSelect" });

const {
  options,
  optionParam,
  valueParam,
  inputParam,
  toMatch,
  placeholder = SELECT_PLACEHOLDER,
  disabled: disabledProp = false,
  clearable = false,
  multiple = false,
  filterable = false,
  filter,
  loading = false,
  fetch,
  emptyText = SELECT_EMPTY_TEXT,
  maxHeight = SELECT_MAX_HEIGHT,
  teleport = true,
} = defineProps<SelectProps>();
const emit = defineEmits<SelectEmits>();
const slots = defineSlots<SelectSlots>();
// 值类型里带 boolean 会触发 Vue 的布尔转换，不传就变成 false；显式给个 undefined 默认值挡掉
const model = defineModel<SelectValue | SelectValue[] | undefined>({ default: undefined });

const formItem = useFormItem();
const disabled = useDisabled(() => disabledProp);
const listboxId = useId();
const root = useTemplateRef<HTMLElement>("root");
const trigger = useTemplateRef<HTMLElement>("trigger");
// 触发器和输入框共用一套细笔触参数，同一张表单里边框粗细才一致
useBrushBorder(trigger, SELECT_TRIGGER_BRUSH);
// 下拉面板被 Teleport 到 body，边框要套在面板容器自己身上；面板每次打开都是新元素，useBrushBorder 会重新落笔
const dropdown = useTemplateRef<HTMLElement>("dropdown");
useBrushBorder(dropdown, SELECT_DROPDOWN_BRUSH);
const search = useTemplateRef<HTMLInputElement>("search");
const list = useTemplateRef<HTMLElement>("list");

// 展开、聚焦、过滤文字、高亮项、正在拉下一页全在 core 的控制器里，React 那边用的是同一份
const { controller: select, state } = useController(createSelect, () => ({
  options,
  optionParam,
  valueParam,
  inputParam,
  toMatch,
  filter,
  filterable,
  multiple,
  disabled: disabled.value,
  value: model.value,
  fetch,
  onCommit: (next: SelectValue | SelectValue[] | undefined) => {
    model.value = next;
    emit("change", next);
    formItem.value.validate("change");
  },
  onSelect: (option: SelectProps["options"][number]) => emit("select", option),
  onInput: (value: string) => emit("input", value),
  onVisibleChange: (open: boolean) => emit("visibleChange", open),
  onRemoveTag: (value: SelectValue) => emit("removeTag", value),
  onClear: () => emit("clear"),
  onFocus: (event: FocusEvent) => emit("focus", event),
  onBlur: (event: FocusEvent) => {
    emit("blur", event);
    formItem.value.validate("blur");
  },
}));

watch(
  [root, trigger, search, list],
  () => {
    select.setRoot(root.value);
    select.setTrigger(trigger.value);
    select.setSearch(search.value);
    select.setList(list.value);
  },
  { immediate: true, flush: "post" },
);
// 高亮换了要把那一项滚进视野；flush: "post" 才等得到这一轮 DOM 更新
watch(
  () => state.value.activeIndex,
  () => select.scrollActiveIntoView(),
  { flush: "post" },
);

// 归一化、过滤、选中判断一次算完；控制器内部处理键盘时调的是同一个 selectView
const view = computed(() =>
  selectView({
    options,
    optionParam,
    valueParam,
    inputParam,
    toMatch,
    filter,
    filterable,
    multiple,
    value: model.value,
    query: state.value.query,
  }),
);
const open = computed(() => state.value.open);
const hasSearch = computed(() => selectHasSearch({ multiple, filterable }));
const showClear = computed(() =>
  selectShowClear({ clearable, disabled: disabled.value, hasValue: view.value.hasValue }),
);
const searchValue = computed(() =>
  selectSearchValue({
    multiple,
    open: open.value,
    query: state.value.query,
    singleLabel: view.value.singleLabel,
  }),
);
const searchPlaceholder = computed(() =>
  selectSearchPlaceholder({
    multiple,
    open: open.value,
    hasValue: view.value.hasValue,
    singleLabel: view.value.singleLabel,
    placeholder,
  }),
);
const activeId = computed(() => selectActiveId(listboxId, state.value));

function isSelected(option: SelectNormalizedOption) {
  return selectIsSelected(option, view.value.selectedValues, toMatch);
}
</script>

<template>
  <div
    ref="root"
    :class="
      selectClasses({
        open,
        focused: state.focused,
        disabled,
        multiple,
        filterable,
      })
    "
    @focusin="select.onFocusin"
    @focusout="select.onFocusout"
    @keydown="select.onKeydown"
  >
    <div
      :id="formItem.id"
      ref="trigger"
      class="m-select__trigger"
      role="combobox"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-controls="listboxId"
      :aria-activedescendant="activeId"
      :aria-disabled="disabled || undefined"
      :tabindex="disabled ? -1 : 0"
      @click="select.onTriggerClick"
      @focus="select.onTriggerFocus"
    >
      <span v-if="slots.prefix" class="m-select__prefix"><slot name="prefix" /></span>
      <div class="m-select__content">
        <template v-if="multiple">
          <MTag
            v-for="option in view.selectedOptions"
            :key="option.key"
            class="m-select__tag"
            size="sm"
            closable
            :disabled="disabled"
            @close="select.removeTag(option.value)"
          >
            {{ option.inputLabel }}
          </MTag>
        </template>
        <span
          v-else-if="!filterable"
          class="m-select__label"
          :class="{ 'm-select__placeholder': !view.hasValue }"
        >
          {{ view.hasValue ? view.singleLabel : placeholder }}
        </span>
        <input
          v-if="hasSearch"
          ref="search"
          class="m-select__search"
          type="text"
          autocomplete="off"
          tabindex="-1"
          :value="searchValue"
          :placeholder="searchPlaceholder"
          :readonly="!filterable"
          :disabled="disabled"
          @input="select.onSearchInput"
        />
      </div>
      <span class="m-select__suffix">
        <button
          v-if="showClear"
          type="button"
          class="m-select__clear"
          :aria-label="SELECT_CLEAR_LABEL"
          tabindex="-1"
          @mousedown.prevent
          @click.stop="select.clear()"
        >
          <IconClose />
        </button>
        <span class="m-select__arrow" aria-hidden="true">
          <IconChevronDown class="m-select__arrow-icon" />
          <span class="m-select__arrow-ink" />
        </span>
      </span>
    </div>
    <MPopper
      :open="open"
      :reference="root"
      match-width
      role="listbox"
      :teleport="teleport"
      @click-outside="select.onClickOutside"
    >
      <div ref="dropdown" class="m-select__dropdown" @mousedown.prevent>
        <div v-if="loading" class="m-select__loading">
          <IconLoading /><span>{{ SELECT_LOADING_TEXT }}</span>
        </div>
        <ul
          v-else-if="view.visible.length"
          :id="listboxId"
          ref="list"
          class="m-select__options"
          role="presentation"
          :style="{ maxHeight: `${maxHeight}px` }"
          @scroll.passive="select.onListScroll"
        >
          <li
            v-for="(option, index) in view.visible"
            :id="selectOptionId(listboxId, index)"
            :key="option.key"
            :class="
              selectOptionClasses({
                active: index === state.activeIndex,
                selected: isSelected(option),
                disabled: option.disabled,
              })
            "
            role="option"
            :aria-selected="isSelected(option)"
            :aria-disabled="option.disabled || undefined"
            @click="select.choose(option)"
            @mousemove="select.setActiveIndex(index)"
          >
            <slot
              name="option"
              :option="option.raw"
              :label="option.label"
              :selected="isSelected(option)"
            >
              <span class="m-select__option-label">{{ option.label }}</span>
            </slot>
            <IconCheck v-if="multiple && isSelected(option)" class="m-select__check" />
          </li>
          <li v-if="state.fetching" class="m-select__fetching" role="presentation">
            <IconLoading />
          </li>
        </ul>
        <div v-else class="m-select__empty">
          <slot name="empty">{{ emptyText }}</slot>
        </div>
      </div>
    </MPopper>
  </div>
</template>
