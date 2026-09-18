/**
 * 自动完成的无框架部分。
 *
 * 输入框里的文字就是 v-model；下拉只是按这段文字筛出来的候选。和选择器一样，
 * 真正碰 DOM 的只有三处：把焦点送回输入框、把高亮项滚进视野、点在外框空白处时把焦点送进输入框。
 * 其余全是数据运算——过滤、键盘上下键跳过禁用项、Enter / Esc / Tab 各自该做什么、
 * 「什么时候该弹、什么时候该收」——两个壳算出来的结果必须逐项相同。
 *
 * 分两类：
 * - 纯派生（过滤、class、aria、要不要弹）是纯函数，由壳在渲染期调；
 * - 有状态的（展开、聚焦、高亮项、search 的防抖定时器）写成控制器。
 *   候选项可能在 search 事件之后才换（filter=false 的用法），所以「该不该弹」在每轮渲染
 *   落地后的 flush() 里再对一遍：列表空了就收、新候选到了就弹。
 */
import type { BrushBorderOptions } from "../../ink/stroke";
import type { Controller } from "../../runtime/controller";
import { createStore } from "../../runtime/store";
import { FIELD_STROKE } from "../field-stroke";
import type { AutoCompleteFilter, AutoCompleteOption } from "./types";

export type {
  AutoCompleteEmits,
  AutoCompleteExpose,
  AutoCompleteFilter,
  AutoCompleteOption,
  AutoCompleteOptionScope,
  AutoCompletePlacement,
  AutoCompleteProps,
  AutoCompleteSlots,
} from "./types";

/* ── 文案与笔触参数 ───────────────────────────────────────────── */

export const AUTO_COMPLETE_CLEAR_LABEL = "清空";
/** search 事件的默认防抖毫秒数 */
export const AUTO_COMPLETE_DEBOUNCE = 0;
/** 下拉笔触边框的默认种子 */
export const AUTO_COMPLETE_SEED = 3;

/** 输入框和其他表单控件共用一套细笔触参数，同一张表单里边框粗细才一致 */
export const AUTO_COMPLETE_TRIGGER_BRUSH: BrushBorderOptions = FIELD_STROKE;

/** 下拉面板被传送到 body，边框要套在面板容器自己身上；种子由 seed prop 给 */
export function autoCompleteDropdownBrush(seed: number): BrushBorderOptions {
  return { strokeWidth: 2, seed };
}

/* ── 纯派生 ───────────────────────────────────────────────────── */

/** 下拉里显示的文字：没给 label 就显示 value */
export function autoCompleteLabel(option: AutoCompleteOption): string {
  return option.label ?? option.value;
}

/**
 * 某一项是否匹配输入：默认前缀匹配、大小写不敏感，value 和 label 谁对上都算
 * （选中后输入框里是 value，下拉里看到的是 label，用户照着哪个敲都该找得到）；false 表示不过滤
 */
export function autoCompleteMatches(
  input: string,
  option: AutoCompleteOption,
  filter: boolean | AutoCompleteFilter,
): boolean {
  if (filter === false) return true;
  if (typeof filter === "function") return filter(input, option);
  const prefix = input.trim().toLowerCase();
  return (
    option.value.toLowerCase().startsWith(prefix) ||
    (option.label !== undefined && option.label.toLowerCase().startsWith(prefix))
  );
}

/** 过滤之后、真正渲染出来的那些 */
export function autoCompleteVisible(
  options: readonly AutoCompleteOption[],
  input: string,
  filter: boolean | AutoCompleteFilter,
): AutoCompleteOption[] {
  return options.filter((option) => autoCompleteMatches(input, option, filter));
}

/** 有匹配项就弹；没有的话只在给了 emptyText 时弹出那行字 */
export function autoCompleteShouldOpen(o: { count: number; emptyText: string }): boolean {
  return o.count > 0 || o.emptyText !== "";
}

/** 从 from 起按 step 方向找第一个可选项的下标，循环；一个能选的都没有就是 -1 */
export function autoCompleteFindEnabled(
  items: readonly AutoCompleteOption[],
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

export function autoCompleteClasses(o: {
  open: boolean;
  focused: boolean;
  disabled: boolean;
}): string[] {
  return [
    "m-auto-complete",
    ...(o.open ? ["m-auto-complete--open"] : []),
    ...(o.focused ? ["m-auto-complete--focused"] : []),
    ...(o.disabled ? ["m-auto-complete--disabled"] : []),
  ];
}

export function autoCompleteOptionClasses(o: { active: boolean; disabled: boolean }): string[] {
  return [
    "m-auto-complete__option",
    ...(o.active ? ["m-auto-complete__option--active"] : []),
    ...(o.disabled ? ["m-auto-complete__option--disabled"] : []),
  ];
}

export function autoCompleteShowClear(o: {
  clearable: boolean;
  disabled: boolean;
  value: string;
}): boolean {
  return o.clearable && !o.disabled && o.value.length > 0;
}

export function autoCompleteOptionId(listboxId: string, index: number): string {
  return `${listboxId}-${index}`;
}

/** aria-activedescendant：没展开或没高亮项时不写 */
export function autoCompleteActiveId(
  listboxId: string,
  o: { open: boolean; activeIndex: number },
): string | undefined {
  return o.open && o.activeIndex >= 0 ? autoCompleteOptionId(listboxId, o.activeIndex) : undefined;
}

/* ── 控制器 ───────────────────────────────────────────────────── */

export interface AutoCompleteSnapshot {
  readonly open: boolean;
  readonly focused: boolean;
  /** 高亮的那一项在 visible 里的下标；-1 表示没有 */
  readonly activeIndex: number;
}

export interface AutoCompleteOptions {
  options: readonly AutoCompleteOption[];
  filter: boolean | AutoCompleteFilter;
  /** 当前 v-model / value，也就是输入框里的文字 */
  value: string;
  disabled: boolean;
  /** search 事件的防抖毫秒数 */
  debounce: number;
  /** 没有匹配项时显示的文字；空串就不弹 */
  emptyText: string;
  /** 请求写回新文字（壳负责写 v-model / setState） */
  onCommit: (value: string) => void;
  /** 输入或清空后的文字（防抖之后） */
  onSearch: (input: string) => void;
  onSelect: (option: AutoCompleteOption) => void;
  onFocus: (event: FocusEvent) => void;
  onBlur: (event: FocusEvent) => void;
  onClear: () => void;
}

export interface AutoCompleteController extends Controller<
  AutoCompleteSnapshot,
  AutoCompleteOptions
> {
  /** 组件根元素：判断焦点是不是还在组件里面 */
  setRoot(el: HTMLElement | null): void;
  /** 输入框 */
  setInput(el: HTMLInputElement | null): void;
  /** 选项列表的滚动容器 */
  setList(el: HTMLElement | null): void;
  /** 把高亮的那一项滚进视野；壳在 DOM 更新后调（Vue 的 flush: "post" / React 的 useEffect） */
  scrollActiveIntoView(): void;
  setOpen(next: boolean): void;
  setActiveIndex(index: number): void;
  choose(option: AutoCompleteOption): void;
  clear(): void;
  focus(): void;
  blur(): void;
  /** 点在外框空白处也把焦点送进输入框 */
  onTriggerMousedown(event: MouseEvent): void;
  onInput(event: Event): void;
  onKeydown(event: KeyboardEvent): void;
  onFocusin(event: FocusEvent): void;
  onFocusout(event: FocusEvent): void;
  /** 点在下拉与输入框之外 */
  onClickOutside(): void;
}

const SERVER_SNAPSHOT: AutoCompleteSnapshot = { open: false, focused: false, activeIndex: -1 };

/** 后缀区里的清空按钮；点在它上面时不抢焦点 */
const CLEAR_SELECTOR = ".m-auto-complete__clear";

export function createAutoComplete(initial: AutoCompleteOptions): AutoCompleteController {
  const store = createStore<AutoCompleteSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  let root: HTMLElement | null = null;
  let input: HTMLInputElement | null = null;
  let list: HTMLElement | null = null;
  let connected = false;
  /**
   * 用户正在输、还没用 Esc / Tab / 选中 / 失焦收起下拉：
   * 这个标记在，候选项换了（filter=false 时 search 之后才到）就该重新弹出来
   */
  let typing = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const visibleFor = (value: string) => autoCompleteVisible(options.options, value, options.filter);
  const visible = () => visibleFor(options.value);
  const shouldOpen = (count: number) =>
    autoCompleteShouldOpen({ count, emptyText: options.emptyText });

  function setOpen(next: boolean): void {
    if (store.get().open === next) return;
    store.set(next ? { open: true } : { open: false, activeIndex: -1 });
  }

  /** 收起并放弃「正在输」的意图：之后候选项再变也不自动弹 */
  function dismiss(): void {
    typing = false;
    setOpen(false);
  }

  /** search 走防抖：0 就当场发 */
  function scheduleSearch(value: string): void {
    clearTimeout(timer);
    timer = undefined;
    if (options.debounce <= 0) {
      options.onSearch(value);
      return;
    }
    timer = setTimeout(() => {
      timer = undefined;
      options.onSearch(value);
    }, options.debounce);
  }

  function choose(option: AutoCompleteOption): void {
    if (option.disabled || options.disabled) return;
    options.onCommit(option.value);
    options.onSelect(option);
    dismiss();
    input?.focus();
  }

  return {
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,

    update(next) {
      options = next;
    },

    connect() {
      connected = true;
    },
    disconnect() {
      connected = false;
      clearTimeout(timer);
      timer = undefined;
    },

    /**
     * 每轮渲染落地后对一遍开合：候选项是 props，可能在 search 之后才换，
     * 输入那一刻算出来的「该不该弹」到这里可能已经不对了
     */
    flush() {
      if (!connected) return;
      const { open, focused, activeIndex } = store.get();
      const items = visible();
      const should = shouldOpen(items.length);
      if (open && !should) setOpen(false);
      else if (!open && typing && focused && should) setOpen(true);
      // 列表变短了，高亮不能指到列表外面
      if (activeIndex >= items.length) store.set({ activeIndex: -1 });
    },

    setRoot(el) {
      root = el;
    },
    setInput(el) {
      input = el;
    },
    setList(el) {
      list = el;
    },

    scrollActiveIntoView() {
      list?.querySelector(".m-auto-complete__option--active")?.scrollIntoView({ block: "nearest" });
    },

    setOpen,
    setActiveIndex(index) {
      store.set({ activeIndex: index });
    },
    choose,

    clear() {
      if (options.disabled) return;
      options.onCommit("");
      options.onClear();
      scheduleSearch("");
      dismiss();
      input?.focus();
    },

    focus() {
      input?.focus();
    },
    blur() {
      input?.blur();
    },

    onTriggerMousedown(event) {
      const target = event.target;
      if (options.disabled || !input || !(target instanceof Element)) return;
      // 点在输入框自己身上浏览器已经会聚焦；点在清空按钮上不接管
      if (target === input || target.closest(CLEAR_SELECTOR)) return;
      event.preventDefault();
      input.focus();
    },

    onInput(event) {
      if (options.disabled) return;
      const next = (event.target as HTMLInputElement).value;
      options.onCommit(next);
      scheduleSearch(next);
      typing = true;
      // 先按新文字算一遍；候选项要等 search 之后才换的，flush 会再对一遍
      setOpen(shouldOpen(visibleFor(next).length));
      store.set({ activeIndex: -1 });
    },

    onKeydown(event) {
      if (options.disabled) return;
      const { open, activeIndex } = store.get();
      const items = visible();
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          if (open) store.set({ activeIndex: autoCompleteFindEnabled(items, activeIndex, 1) });
          else if (items.length > 0) {
            typing = true;
            setOpen(true);
            store.set({ activeIndex: autoCompleteFindEnabled(items, -1, 1) });
          }
          break;
        case "ArrowUp":
          event.preventDefault();
          if (open) {
            store.set({
              activeIndex: autoCompleteFindEnabled(items, activeIndex < 0 ? 0 : activeIndex, -1),
            });
          } else if (items.length > 0) {
            typing = true;
            setOpen(true);
            store.set({ activeIndex: autoCompleteFindEnabled(items, 0, -1) });
          }
          break;
        case "Enter": {
          // 没高亮项时不拦：回车该交给表单
          const option = open ? items[activeIndex] : undefined;
          if (!option) break;
          event.preventDefault();
          choose(option);
          break;
        }
        case "Escape":
          if (open) {
            event.preventDefault();
            // 别让外层的对话框之类也跟着关
            event.stopPropagation();
            dismiss();
          }
          break;
        case "Tab":
          dismiss();
          break;
      }
    },

    onFocusin(event) {
      if (store.get().focused) return;
      store.set({ focused: true });
      options.onFocus(event);
      // 聚焦就把匹配的候选亮出来；一项都没有时不弹，也不弹 emptyText
      if (!options.disabled && visible().length > 0) setOpen(true);
    },

    onFocusout(event) {
      const next = event.relatedTarget;
      // 焦点还在组件内部不算失焦
      if (next instanceof Node && root?.contains(next)) return;
      store.set({ focused: false });
      dismiss();
      options.onBlur(event);
    },

    onClickOutside() {
      dismiss();
    },
  };
}
