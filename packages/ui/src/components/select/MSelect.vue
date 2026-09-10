<script setup lang="ts">
import "./select.css";
import { computed, nextTick, ref, useId, useTemplateRef, watch } from "vue";
import { IconCheck, IconChevronDown, IconClose, IconLoading } from "../../icons";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { FIELD_STROKE } from "../../internal/field-stroke";
import { useBrushBorder } from "../../ink/stroke";
import MPopper from "../../internal/popper/MPopper.vue";
import { MTag } from "../tag";
import type {
  SelectEmits,
  SelectOption,
  SelectOptionLike,
  SelectProps,
  SelectSlots,
  SelectValue,
} from "./types";

defineOptions({ name: "MSelect" });

const {
  options,
  optionParam,
  valueParam,
  inputParam,
  toMatch,
  placeholder = "请选择",
  disabled: disabledProp = false,
  clearable = false,
  multiple = false,
  filterable = false,
  filter,
  loading = false,
  fetch,
  emptyText = "暂无数据",
  maxHeight = 240,
  teleport = true,
} = defineProps<SelectProps>();
const emit = defineEmits<SelectEmits>();
const slots = defineSlots<SelectSlots>();
// 值类型里带 boolean 会触发 Vue 的布尔转换，不传就变成 false；显式给个 undefined 默认值挡掉
const model = defineModel<SelectValue | SelectValue[] | undefined>({ default: undefined });

/** 统一后的选项：raw 是用户传进来的原样，其余字段按 *Param 取好 */
interface NormalizedOption {
  raw: SelectOptionLike;
  key: string;
  label: string;
  /** 选中后触发区里显示的文字 */
  inputLabel: string;
  value: SelectValue;
  disabled: boolean;
}

const formItem = useFormItem();
const disabled = useDisabled(() => disabledProp);
const listboxId = useId();
const root = useTemplateRef<HTMLElement>("root");
const trigger = useTemplateRef<HTMLElement>("trigger");
// 触发器和输入框共用一套细笔触参数，同一张表单里边框粗细才一致
useBrushBorder(trigger, FIELD_STROKE);
// 下拉面板被 Teleport 到 body，边框要套在面板容器自己身上；面板每次打开都是新元素，useBrushBorder 会重新落笔
const dropdown = useTemplateRef<HTMLElement>("dropdown");
useBrushBorder(dropdown, { strokeWidth: 2, seed: 3 });
const search = useTemplateRef<HTMLInputElement>("search");
const list = useTemplateRef<HTMLElement>("list");

const open = ref(false);
const focused = ref(false);
const query = ref("");
const activeIndex = ref(-1);
/** fetch 正在进行；同一时间只发一次 */
const fetching = ref(false);
/** 上次发起 fetch 时列表的内容高度：没变化说明没追加新项，再滚到底也不重复拉（拉空了不会死循环） */
let fetchedHeight = -1;

function readKey(item: object, key: string): unknown {
  return (item as Record<string, unknown>)[key];
}

function isSelectOption(item: SelectOptionLike): item is SelectOption {
  return typeof item === "object" && "label" in item && "value" in item;
}

function normalize(item: SelectOptionLike, index: number): NormalizedOption {
  if (typeof item !== "object") {
    const text = String(item);
    return { raw: item, key: text, label: text, inputLabel: text, value: item, disabled: false };
  }
  const label = optionParam
    ? String(readKey(item, optionParam) ?? "")
    : isSelectOption(item)
      ? item.label
      : String(item);
  const value: SelectValue = valueParam
    ? (readKey(item, valueParam) as SelectValue)
    : isSelectOption(item)
      ? item.value
      : item;
  const inputLabel = inputParam ? String(readKey(item, inputParam) ?? "") : label;
  const disabledFlag = "disabled" in item && readKey(item, "disabled") === true;
  // 对象当值时 String() 全是 [object Object]，key 只能靠下标；原始值用值本身，顺序变了也不重建节点
  const key = typeof value === "object" ? `${index}` : String(value);
  return { raw: item, key, label, inputLabel, value, disabled: disabledFlag };
}

const normalized = computed<NormalizedOption[]>(() => options.map(normalize));

/** 某个选项是否等于某个值：没给 toMatch 就按 === 比 */
function matches(option: NormalizedOption, value: SelectValue) {
  return toMatch ? toMatch(option.raw, value) : option.value === value;
}

/** 当前选中的值，单选也统一成数组处理 */
const selectedValues = computed<SelectValue[]>(() => {
  const value = model.value;
  if (multiple) return Array.isArray(value) ? value : [];
  return value === undefined || Array.isArray(value) ? [] : [value];
});
const selectedOptions = computed<NormalizedOption[]>(() =>
  selectedValues.value.map(
    (value) =>
      normalized.value.find((option) => matches(option, value)) ?? {
        raw: value,
        key: String(value),
        label: String(value),
        inputLabel: String(value),
        value,
        disabled: false,
      },
  ),
);
const hasValue = computed(() => selectedValues.value.length > 0);
const singleLabel = computed(() => selectedOptions.value[0]?.inputLabel ?? "");
/** 多选或可过滤时触发区里放一个 input */
const hasSearch = computed(() => multiple || filterable);
const showClear = computed(() => clearable && !disabled.value && hasValue.value);

const visibleOptions = computed<NormalizedOption[]>(() => {
  const text = query.value.trim();
  if (!filterable || !text) return normalized.value;
  const lower = text.toLowerCase();
  return normalized.value.filter((option) =>
    filter ? filter(option.raw, text) : option.label.toLowerCase().includes(lower),
  );
});

const searchValue = computed(() => {
  if (multiple || open.value) return query.value;
  return singleLabel.value;
});
const searchPlaceholder = computed(() => {
  if (multiple) return hasValue.value ? "" : placeholder;
  return open.value && singleLabel.value ? singleLabel.value : placeholder;
});
const activeId = computed(() =>
  open.value && activeIndex.value >= 0 ? `${listboxId}-${activeIndex.value}` : undefined,
);

function isSelected(option: NormalizedOption) {
  return selectedValues.value.some((value) => matches(option, value));
}

/** 从 from 起按 step 方向找第一个可选项的下标，循环 */
function findEnabled(from: number, step: 1 | -1) {
  const items = visibleOptions.value;
  if (!items.length) return -1;
  let index = from;
  for (let n = 0; n < items.length; n++) {
    index = (index + step + items.length) % items.length;
    if (!items[index]?.disabled) return index;
  }
  return -1;
}

function setOpen(next: boolean) {
  if (open.value === next) return;
  open.value = next;
  emit("visibleChange", next);
  if (next) {
    const selectedIndex = visibleOptions.value.findIndex(
      (option) => !option.disabled && isSelected(option),
    );
    activeIndex.value = selectedIndex >= 0 ? selectedIndex : findEnabled(-1, 1);
  } else {
    setQuery("");
    activeIndex.value = -1;
  }
}

function setQuery(next: string) {
  if (query.value === next) return;
  query.value = next;
  emit("input", next);
}

function focusInner() {
  (search.value ?? trigger.value)?.focus();
}

function commit(next: SelectValue | SelectValue[] | undefined) {
  model.value = next;
  emit("change", next);
  formItem?.validate("change");
}

function choose(option: NormalizedOption) {
  if (option.disabled) return;
  emit("select", option.raw);
  if (multiple) {
    const current = selectedValues.value;
    commit(
      isSelected(option)
        ? current.filter((value) => !matches(option, value))
        : [...current, option.value],
    );
    setQuery("");
    focusInner();
    return;
  }
  commit(option.value);
  setOpen(false);
  focusInner();
}

function removeTag(value: SelectValue) {
  if (disabled.value) return;
  commit(selectedValues.value.filter((item) => item !== value));
  emit("removeTag", value);
}

function clear() {
  commit(multiple ? [] : undefined);
  emit("clear");
  focusInner();
}

function onTriggerClick(event: MouseEvent) {
  if (disabled.value) return;
  // 已展开时点输入框只是想继续输入，不收起
  if (open.value && event.target === search.value) return;
  setOpen(!open.value);
  focusInner();
}

function onTriggerFocus(event: FocusEvent) {
  if (event.target === trigger.value && search.value) search.value.focus();
}

function onSearchInput(event: Event) {
  setQuery((event.target as HTMLInputElement).value);
  if (!open.value) setOpen(true);
  activeIndex.value = findEnabled(-1, 1);
}

/** 列表滚到底就去拉下一页；拉完由使用方往 options 里追加 */
async function onListScroll() {
  const el = list.value;
  if (!fetch || fetching.value || !el) return;
  if (el.scrollTop + el.clientHeight < el.scrollHeight - 4) return;
  if (el.scrollHeight === fetchedHeight) return;
  fetchedHeight = el.scrollHeight;
  fetching.value = true;
  try {
    await fetch();
  } finally {
    fetching.value = false;
  }
}

function onKeydown(event: KeyboardEvent) {
  if (disabled.value) return;
  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      if (open.value) activeIndex.value = findEnabled(activeIndex.value, 1);
      else setOpen(true);
      break;
    case "ArrowUp":
      event.preventDefault();
      if (open.value)
        activeIndex.value = findEnabled(activeIndex.value < 0 ? 0 : activeIndex.value, -1);
      else setOpen(true);
      break;
    case "Enter": {
      event.preventDefault();
      if (!open.value) {
        setOpen(true);
        break;
      }
      const option = visibleOptions.value[activeIndex.value];
      if (option) choose(option);
      break;
    }
    case " ":
      if (!hasSearch.value) {
        event.preventDefault();
        setOpen(!open.value);
      }
      break;
    case "Escape":
      if (open.value) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
      break;
    case "Tab":
      setOpen(false);
      break;
    case "Backspace":
      if (multiple && !query.value && hasValue.value) {
        const last = selectedValues.value.at(-1);
        if (last !== undefined) removeTag(last);
      }
      break;
  }
}

function onFocusin(event: FocusEvent) {
  if (focused.value) return;
  focused.value = true;
  emit("focus", event);
}

function onFocusout(event: FocusEvent) {
  const next = event.relatedTarget;
  if (next instanceof Node && root.value?.contains(next)) return;
  focused.value = false;
  emit("blur", event);
  formItem?.validate("blur");
}

watch(activeIndex, async () => {
  await nextTick();
  list.value?.querySelector(".m-select__option--active")?.scrollIntoView({ block: "nearest" });
});
</script>

<template>
  <div
    ref="root"
    class="m-select"
    :class="{
      'm-select--open': open,
      'm-select--focused': focused,
      'm-select--disabled': disabled,
      'm-select--multiple': multiple,
      'm-select--filterable': filterable,
    }"
    @focusin="onFocusin"
    @focusout="onFocusout"
    @keydown="onKeydown"
  >
    <div
      :id="formItem?.id.value"
      ref="trigger"
      class="m-select__trigger"
      role="combobox"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-controls="listboxId"
      :aria-activedescendant="activeId"
      :aria-disabled="disabled || undefined"
      :tabindex="disabled ? -1 : 0"
      @click="onTriggerClick"
      @focus="onTriggerFocus"
    >
      <span v-if="slots.prefix" class="m-select__prefix"><slot name="prefix" /></span>
      <div class="m-select__content">
        <template v-if="multiple">
          <MTag
            v-for="option in selectedOptions"
            :key="option.key"
            class="m-select__tag"
            size="sm"
            closable
            :disabled="disabled"
            @close="removeTag(option.value)"
          >
            {{ option.inputLabel }}
          </MTag>
        </template>
        <span
          v-else-if="!filterable"
          class="m-select__label"
          :class="{ 'm-select__placeholder': !hasValue }"
        >
          {{ hasValue ? singleLabel : placeholder }}
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
          @input="onSearchInput"
        />
      </div>
      <span class="m-select__suffix">
        <button
          v-if="showClear"
          type="button"
          class="m-select__clear"
          aria-label="清空"
          tabindex="-1"
          @mousedown.prevent
          @click.stop="clear"
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
      @click-outside="setOpen(false)"
    >
      <div ref="dropdown" class="m-select__dropdown" @mousedown.prevent>
        <div v-if="loading" class="m-select__loading"><IconLoading /><span>加载中</span></div>
        <ul
          v-else-if="visibleOptions.length"
          :id="listboxId"
          ref="list"
          class="m-select__options"
          role="presentation"
          :style="{ maxHeight: `${maxHeight}px` }"
          @scroll.passive="onListScroll"
        >
          <li
            v-for="(option, index) in visibleOptions"
            :id="`${listboxId}-${index}`"
            :key="option.key"
            class="m-select__option"
            :class="{
              'm-select__option--active': index === activeIndex,
              'm-select__option--selected': isSelected(option),
              'm-select__option--disabled': option.disabled,
            }"
            role="option"
            :aria-selected="isSelected(option)"
            :aria-disabled="option.disabled || undefined"
            @click="choose(option)"
            @mousemove="activeIndex = index"
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
          <li v-if="fetching" class="m-select__fetching" role="presentation">
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
