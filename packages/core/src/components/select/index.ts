/**
 * 选择器的无框架部分。
 *
 * 这个组件看着大，真正碰 DOM 的只有两处：把焦点送回触发区里的输入框、把高亮的那一项滚进视野。
 * 其余全是数据运算——把五花八门的候选项归一化、按输入的文字过滤、判断某项是否等于当前值、
 * 键盘上下键跳过禁用项、Enter / Space / Esc / Tab / Backspace 各自该做什么——
 * 一行都不该在壳里重写，两个框架算出来的结果必须逐项相同。
 *
 * 分两类：
 * - 纯派生（归一化、过滤、选中判断、class、文案、aria）是纯函数，由壳在渲染期调（computed / useMemo）；
 * - 有状态的（展开、聚焦、过滤文字、高亮项、正在拉下一页）写成控制器。
 *   控制器内部要重算过滤结果时，调的是同一批纯函数，不是另写一遍。
 */
import { FIELD_STROKE } from "../field-stroke";
import { createStore } from "../../runtime/store";
import type { BrushBorderOptions } from "../../ink/stroke";
import type { Controller } from "../../runtime/controller";
import type { SelectOptionLike, SelectValue } from "./types";

export type {
  SelectEmits,
  SelectModel,
  SelectOption,
  SelectOptionLike,
  SelectOptionScope,
  SelectProps,
  SelectSlots,
  SelectValue,
} from "./types";

/* ── 文案与笔触参数 ───────────────────────────────────────────── */

export const SELECT_PLACEHOLDER = "请选择";
export const SELECT_EMPTY_TEXT = "暂无数据";
export const SELECT_LOADING_TEXT = "加载中";
export const SELECT_CLEAR_LABEL = "清空";
/** 下拉最大高度 px 的默认值 */
export const SELECT_MAX_HEIGHT = 240;

/** 触发区和输入框共用一套细笔触参数，同一张表单里边框粗细才一致 */
export const SELECT_TRIGGER_BRUSH: BrushBorderOptions = FIELD_STROKE;
/** 下拉面板被传送到 body，边框要套在面板容器自己身上 */
export const SELECT_DROPDOWN_BRUSH: BrushBorderOptions = { strokeWidth: 2, seed: 3 };

/* ── 归一化 ───────────────────────────────────────────────────── */

/** 统一后的选项：raw 是用户传进来的原样，其余字段按 *Param 取好 */
export interface SelectNormalizedOption {
  raw: SelectOptionLike;
  key: string;
  label: string;
  /** 选中后触发区里显示的文字 */
  inputLabel: string;
  value: SelectValue;
  disabled: boolean;
}

/** 取字段用的那三个 *Param */
export interface SelectParams {
  optionParam?: string;
  valueParam?: string;
  inputParam?: string;
}

function readKey(item: object, key: string): unknown {
  return (item as Record<string, unknown>)[key];
}

function isSelectOption(item: SelectOptionLike): item is { label: string; value: SelectValue } {
  return typeof item === "object" && "label" in item && "value" in item;
}

function normalize(
  item: SelectOptionLike,
  index: number,
  params: SelectParams,
): SelectNormalizedOption {
  if (typeof item !== "object") {
    const text = String(item);
    return { raw: item, key: text, label: text, inputLabel: text, value: item, disabled: false };
  }
  const label = params.optionParam
    ? String(readKey(item, params.optionParam) ?? "")
    : isSelectOption(item)
      ? item.label
      : String(item);
  const value: SelectValue = params.valueParam
    ? (readKey(item, params.valueParam) as SelectValue)
    : isSelectOption(item)
      ? item.value
      : item;
  const inputLabel = params.inputParam ? String(readKey(item, params.inputParam) ?? "") : label;
  const disabled = "disabled" in item && readKey(item, "disabled") === true;
  // 对象当值时 String() 全是 [object Object]，key 只能靠下标；原始值用值本身，顺序变了也不重建节点
  const key = typeof value === "object" ? `${index}` : String(value);
  return { raw: item, key, label, inputLabel, value, disabled };
}

export function normalizeSelectOptions(
  options: SelectOptionLike[],
  params: SelectParams,
): SelectNormalizedOption[] {
  return options.map((item, index) => normalize(item, index, params));
}

/** 某个选项是否等于某个值：没给 toMatch 就按 === 比 */
export function selectMatches(
  option: SelectNormalizedOption,
  value: SelectValue,
  toMatch?: (option: SelectOptionLike, value: SelectValue) => boolean,
): boolean {
  return toMatch ? toMatch(option.raw, value) : option.value === value;
}

export function selectIsSelected(
  option: SelectNormalizedOption,
  selectedValues: SelectValue[],
  toMatch?: (option: SelectOptionLike, value: SelectValue) => boolean,
): boolean {
  return selectedValues.some((value) => selectMatches(option, value, toMatch));
}

/* ── 一次算完的派生视图 ───────────────────────────────────────── */

export interface SelectViewOptions extends SelectParams {
  options: SelectOptionLike[];
  toMatch?: (option: SelectOptionLike, value: SelectValue) => boolean;
  filter?: (option: SelectOptionLike, query: string) => boolean;
  filterable: boolean;
  multiple: boolean;
  /** 当前 v-model / value */
  value: SelectValue | SelectValue[] | undefined;
  /** 过滤框里的文字 */
  query: string;
}

export interface SelectView {
  normalized: SelectNormalizedOption[];
  /** 过滤之后、真正渲染出来的那些 */
  visible: SelectNormalizedOption[];
  /** 当前选中的值，单选也统一成数组 */
  selectedValues: SelectValue[];
  selectedOptions: SelectNormalizedOption[];
  hasValue: boolean;
  /** 单选时触发区里显示的文字 */
  singleLabel: string;
}

/**
 * 渲染选择器要用的全部派生数据，一次算完。
 *
 * 壳在渲染期调它（Vue 的 computed / React 的 useMemo）；控制器在处理键盘和点选时
 * 也调同一个函数——因为过滤文字是控制器自己持有的，它必须能拿到「改完之后」的列表，
 * 而壳传进来的那份还是上一次渲染的。同一份实现两处调用，不是两份实现。
 */
export function selectView(o: SelectViewOptions): SelectView {
  const normalized = normalizeSelectOptions(o.options, o);
  const text = o.query.trim();
  const lower = text.toLowerCase();
  const visible =
    !o.filterable || !text
      ? normalized
      : normalized.filter((option) =>
          o.filter ? o.filter(option.raw, text) : option.label.toLowerCase().includes(lower),
        );

  const selectedValues: SelectValue[] = o.multiple
    ? Array.isArray(o.value)
      ? o.value
      : []
    : o.value === undefined || Array.isArray(o.value)
      ? []
      : [o.value];

  // 选中的值在候选项里找不到时（异步还没拉回来、或者值本来就不在列表里）造一个临时项顶上，
  // 触发区才不会空着
  const selectedOptions = selectedValues.map(
    (value) =>
      normalized.find((option) => selectMatches(option, value, o.toMatch)) ?? {
        raw: value,
        key: String(value),
        label: String(value),
        inputLabel: String(value),
        value,
        disabled: false,
      },
  );

  return {
    normalized,
    visible,
    selectedValues,
    selectedOptions,
    hasValue: selectedValues.length > 0,
    singleLabel: selectedOptions[0]?.inputLabel ?? "",
  };
}

/** 从 from 起按 step 方向找第一个可选项的下标，循环；一个能选的都没有就是 -1 */
export function selectFindEnabled(
  items: SelectNormalizedOption[],
  from: number,
  step: 1 | -1,
): number {
  if (items.length === 0) return -1;
  let index = from;
  for (let n = 0; n < items.length; n++) {
    index = (index + step + items.length) % items.length;
    if (!items[index]?.disabled) return index;
  }
  return -1;
}

/* ── class / 文案 / aria 的纯派生 ─────────────────────────────── */

export function selectClasses(state: {
  open: boolean;
  focused: boolean;
  disabled: boolean;
  multiple: boolean;
  filterable: boolean;
}): string[] {
  return [
    "m-select",
    ...(state.open ? ["m-select--open"] : []),
    ...(state.focused ? ["m-select--focused"] : []),
    ...(state.disabled ? ["m-select--disabled"] : []),
    ...(state.multiple ? ["m-select--multiple"] : []),
    ...(state.filterable ? ["m-select--filterable"] : []),
  ];
}

export function selectOptionClasses(state: {
  active: boolean;
  selected: boolean;
  disabled: boolean;
}): string[] {
  return [
    "m-select__option",
    ...(state.active ? ["m-select__option--active"] : []),
    ...(state.selected ? ["m-select__option--selected"] : []),
    ...(state.disabled ? ["m-select__option--disabled"] : []),
  ];
}

/** 多选或可过滤时触发区里放一个 input */
export function selectHasSearch(o: { multiple: boolean; filterable: boolean }): boolean {
  return o.multiple || o.filterable;
}

export function selectShowClear(o: {
  clearable: boolean;
  disabled: boolean;
  hasValue: boolean;
}): boolean {
  return o.clearable && !o.disabled && o.hasValue;
}

/** 输入框里显示什么：多选或展开时显示正在输的文字，收起的单选显示选中项 */
export function selectSearchValue(o: {
  multiple: boolean;
  open: boolean;
  query: string;
  singleLabel: string;
}): string {
  if (o.multiple || o.open) return o.query;
  return o.singleLabel;
}

/** 输入框的占位：单选展开时把选中项降级成占位，腾出位置输过滤文字 */
export function selectSearchPlaceholder(o: {
  multiple: boolean;
  open: boolean;
  hasValue: boolean;
  singleLabel: string;
  placeholder: string;
}): string {
  if (o.multiple) return o.hasValue ? "" : o.placeholder;
  return o.open && o.singleLabel ? o.singleLabel : o.placeholder;
}

export function selectOptionId(listboxId: string, index: number): string {
  return `${listboxId}-${index}`;
}

/** aria-activedescendant：没展开或没高亮项时不写 */
export function selectActiveId(
  listboxId: string,
  o: { open: boolean; activeIndex: number },
): string | undefined {
  return o.open && o.activeIndex >= 0 ? selectOptionId(listboxId, o.activeIndex) : undefined;
}

/* ── 控制器 ───────────────────────────────────────────────────── */

export interface SelectSnapshot {
  readonly open: boolean;
  readonly focused: boolean;
  /** 过滤框里的文字 */
  readonly query: string;
  /** 键盘高亮的那一项在 visible 里的下标；-1 表示没有 */
  readonly activeIndex: number;
  /** fetch 正在进行 */
  readonly fetching: boolean;
}

/** 控制器要的东西：算过滤结果的那几个参数 + 各种回调 */
export interface SelectOptions extends Omit<SelectViewOptions, "query"> {
  disabled: boolean;
  /** 滚到底部时调用，用来分页追加候选项 */
  fetch?: () => Promise<void>;
  /** 请求写回新值（壳负责写 v-model / setState，并发 change） */
  onCommit: (next: SelectValue | SelectValue[] | undefined) => void;
  /** 点选了某个选项，参数是原始选项 */
  onSelect: (option: SelectOptionLike) => void;
  /** 过滤框里的文字变化 */
  onInput: (query: string) => void;
  /** 下拉开合 */
  onVisibleChange: (open: boolean) => void;
  /** 多选时点了 Tag 的关闭 */
  onRemoveTag: (value: SelectValue) => void;
  /** 点了清空按钮 */
  onClear: () => void;
  onFocus: (event: FocusEvent) => void;
  onBlur: (event: FocusEvent) => void;
}

export interface SelectController extends Controller<SelectSnapshot, SelectOptions> {
  /** 组件根元素：判断焦点是不是还在组件里面 */
  setRoot(el: HTMLElement | null): void;
  /** 触发区（role=combobox）：没有过滤输入框时焦点落在它身上 */
  setTrigger(el: HTMLElement | null): void;
  /** 过滤输入框 */
  setSearch(el: HTMLInputElement | null): void;
  /** 选项列表的滚动容器 */
  setList(el: HTMLElement | null): void;
  /** 把高亮的那一项滚进视野；壳在 DOM 更新后调（Vue 的 flush: "post" / React 的 useEffect） */
  scrollActiveIntoView(): void;
  setOpen(next: boolean): void;
  setActiveIndex(index: number): void;
  choose(option: SelectNormalizedOption): void;
  removeTag(value: SelectValue): void;
  clear(): void;
  onTriggerClick(event: MouseEvent): void;
  onTriggerFocus(event: FocusEvent): void;
  onSearchInput(event: Event): void;
  onListScroll(): void;
  onKeydown(event: KeyboardEvent): void;
  onFocusin(event: FocusEvent): void;
  onFocusout(event: FocusEvent): void;
  /** 点在下拉与触发区之外 */
  onClickOutside(): void;
}

const SERVER_SNAPSHOT: SelectSnapshot = {
  open: false,
  focused: false,
  query: "",
  activeIndex: -1,
  fetching: false,
};

export function createSelect(initial: SelectOptions): SelectController {
  const store = createStore<SelectSnapshot>(SERVER_SNAPSHOT);
  let options = initial;

  let root: HTMLElement | null = null;
  let trigger: HTMLElement | null = null;
  let search: HTMLInputElement | null = null;
  let list: HTMLElement | null = null;
  /** 上次发起 fetch 时列表的内容高度：没变化说明没追加新项，再滚到底也不重复拉（拉空了不会死循环） */
  let fetchedHeight = -1;

  /** 拿当前这一刻的派生数据。过滤文字归控制器持有，所以这里用 store 里的那份，不是壳传进来的 */
  function view(): SelectView {
    return selectView({ ...options, query: store.get().query });
  }

  function hasSearch(): boolean {
    return selectHasSearch(options);
  }

  function focusInner(): void {
    (search ?? trigger)?.focus();
  }

  function setQuery(next: string): void {
    if (store.get().query === next) return;
    store.set({ query: next });
    options.onInput(next);
  }

  function setOpen(next: boolean): void {
    if (store.get().open === next) return;
    store.set({ open: next });
    options.onVisibleChange(next);
    if (next) {
      // 展开时高亮落在已选项上，没有已选项就落在第一个可选项
      const { visible: items, selectedValues } = view();
      const index = items.findIndex(
        (option) => !option.disabled && selectIsSelected(option, selectedValues, options.toMatch),
      );
      store.set({ activeIndex: index >= 0 ? index : selectFindEnabled(items, -1, 1) });
    } else {
      setQuery("");
      store.set({ activeIndex: -1 });
    }
  }

  function commit(next: SelectValue | SelectValue[] | undefined): void {
    options.onCommit(next);
  }

  function choose(option: SelectNormalizedOption): void {
    if (option.disabled) return;
    options.onSelect(option.raw);
    if (options.multiple) {
      const current = view().selectedValues;
      commit(
        selectIsSelected(option, current, options.toMatch)
          ? current.filter((value) => !selectMatches(option, value, options.toMatch))
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

  function removeTag(value: SelectValue): void {
    if (options.disabled) return;
    commit(view().selectedValues.filter((item) => item !== value));
    options.onRemoveTag(value);
  }

  return {
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,

    update(next) {
      options = next;
    },

    // 选择器没有全局监听，也不量尺寸：外部点击由 MPopper 上报，Escape 走键盘事件冒泡。
    // 这一对留成空壳只是为了凑齐控制器的形状，两个壳的胶水才能一视同仁地用
    connect() {},
    disconnect() {},

    setRoot(el) {
      root = el;
    },
    setTrigger(el) {
      trigger = el;
    },
    setSearch(el) {
      search = el;
    },
    setList(el) {
      list = el;
    },

    scrollActiveIntoView() {
      list?.querySelector(".m-select__option--active")?.scrollIntoView({ block: "nearest" });
    },

    setOpen,
    setActiveIndex(index) {
      store.set({ activeIndex: index });
    },
    choose,
    removeTag,

    clear() {
      commit(options.multiple ? [] : undefined);
      options.onClear();
      focusInner();
    },

    onTriggerClick(event) {
      if (options.disabled) return;
      // 已展开时点输入框只是想继续输入，不收起
      if (store.get().open && event.target === search) return;
      setOpen(!store.get().open);
      focusInner();
    },

    onTriggerFocus(event) {
      // 触发区自己拿到焦点时转交给里面的输入框，敲的字才有地方落
      if (event.target === trigger && search) search.focus();
    },

    onSearchInput(event) {
      setQuery((event.target as HTMLInputElement).value);
      if (!store.get().open) setOpen(true);
      store.set({ activeIndex: selectFindEnabled(view().visible, -1, 1) });
    },

    /** 列表滚到底就去拉下一页；拉完由使用方往 options 里追加 */
    onListScroll() {
      const el = list;
      if (!options.fetch || store.get().fetching || !el) return;
      if (el.scrollTop + el.clientHeight < el.scrollHeight - 4) return;
      if (el.scrollHeight === fetchedHeight) return;
      fetchedHeight = el.scrollHeight;
      store.set({ fetching: true });
      void Promise.resolve(options.fetch()).finally(() => store.set({ fetching: false }));
    },

    onKeydown(event) {
      if (options.disabled) return;
      const open = store.get().open;
      const activeIndex = store.get().activeIndex;
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          if (open) store.set({ activeIndex: selectFindEnabled(view().visible, activeIndex, 1) });
          else setOpen(true);
          break;
        case "ArrowUp":
          event.preventDefault();
          if (open) {
            store.set({
              activeIndex: selectFindEnabled(view().visible, activeIndex < 0 ? 0 : activeIndex, -1),
            });
          } else setOpen(true);
          break;
        case "Enter": {
          event.preventDefault();
          if (!open) {
            setOpen(true);
            break;
          }
          const option = view().visible[activeIndex];
          if (option) choose(option);
          break;
        }
        case " ":
          // 有输入框时空格是正常的输入字符，不能拿来开合
          if (!hasSearch()) {
            event.preventDefault();
            setOpen(!open);
          }
          break;
        case "Escape":
          if (open) {
            event.preventDefault();
            // 别让外层的对话框之类也跟着关
            event.stopPropagation();
            setOpen(false);
          }
          break;
        case "Tab":
          setOpen(false);
          break;
        case "Backspace": {
          // 多选时输入框空着再退格，删掉最后一个标签
          if (options.multiple && !store.get().query) {
            const last = view().selectedValues.at(-1);
            if (last !== undefined) removeTag(last);
          }
          break;
        }
      }
    },

    onFocusin(event) {
      if (store.get().focused) return;
      store.set({ focused: true });
      options.onFocus(event);
    },

    onFocusout(event) {
      const next = event.relatedTarget;
      // 焦点还在组件内部（触发区 ↔ 输入框）不算失焦
      if (next instanceof Node && root?.contains(next)) return;
      store.set({ focused: false });
      options.onBlur(event);
    },

    onClickOutside() {
      setOpen(false);
    },
  };
}
