/**
 * 评分的无框架部分。
 *
 * 分两类：
 * - 纯派生（每格的满 / 半 / 空、class、aria、roving tabindex 的停靠点、每格的墨团遮罩）是纯函数，
 *   由壳在渲染期调（computed / useMemo）；
 * - 悬停预览是有状态的（指针停在哪一格、是左半还是整格），点击落值和键盘调值要量元素、
 *   还要把焦点挪到新的停靠点上，写成控制器。两个壳只绑事件。
 */
import { inkBlobUrl } from "../../ink/assets/blob";
import { createStore } from "../../runtime/store";
import type { Controller } from "../../runtime/controller";
import type { RateSize } from "./types";

export type { RateCharacterScope, RateEmits, RateProps, RateSize, RateSlots } from "./types";

/** 归一化后的几何：格数与步长 */
export interface RateGeometry {
  count: number;
  allowHalf: boolean;
}

/** 一步走多少：允许半格就是 0.5 */
export function rateStep(o: Pick<RateGeometry, "allowHalf">): number {
  return o.allowHalf ? 0.5 : 1;
}

/** 钳制到 [0, count] 并对齐到步长；不是数就当 0 */
export function alignRateValue(value: number | undefined, o: RateGeometry): number {
  if (value === undefined || !Number.isFinite(value)) return 0;
  const step = rateStep(o);
  const snapped = Math.round(Math.min(o.count, Math.max(0, value)) / step) * step;
  return Math.min(o.count, snapped);
}

/** 格子的下标序列：Vue 的 v-for 和 React 的 map 用同一串 key */
export function rateItems(count: number): number[] {
  const n = Math.floor(count);
  if (!Number.isFinite(n) || n <= 0) return [];
  return Array.from({ length: n }, (_, i) => i);
}

/** 第 index 格（从 0 起）代表的值；half 为真且允许半格时是这一格的左半 */
export function rateValueAt(
  index: number,
  half: boolean,
  o: Pick<RateGeometry, "allowHalf">,
): number {
  return o.allowHalf && half ? index + 0.5 : index + 1;
}

/** 有悬停预览就显示预览值，否则显示绑定值 */
export function rateDisplayValue(value: number, hover: number): number {
  return hover > 0 ? hover : value;
}

export type RateItemState = "empty" | "half" | "full";

/** 这一格按显示值该画成满、半还是空 */
export function rateItemState(index: number, display: number): RateItemState {
  if (display >= index + 1) return "full";
  if (display > index) return "half";
  return "empty";
}

/** 悬停预览正指着这一格（整格或它的左半） */
export function rateItemHovered(index: number, hover: number): boolean {
  return hover > index && hover <= index + 1;
}

/** 点击落值：再点当前值且允许清零就归零 */
export function rateNextValue(current: number, picked: number, allowClear: boolean): number {
  return allowClear && picked === current ? 0 : picked;
}

/** 档位文字：按显示值向上取整找对应下标；没有显示值或没配文字就不显示 */
export function rateText(texts: string[] | undefined, display: number): string | undefined {
  if (!texts || display <= 0) return undefined;
  return texts[Math.ceil(display) - 1];
}

/** 禁用和只读都不响应交互 */
export function rateInert(o: { disabled: boolean; readonly: boolean }): boolean {
  return o.disabled || o.readonly;
}

export function rateClasses(o: {
  size: RateSize;
  disabled: boolean;
  readonly: boolean;
  allowHalf: boolean;
}): string[] {
  return [
    "m-rate",
    `m-rate--${o.size}`,
    ...(o.disabled ? ["m-rate--disabled"] : []),
    ...(o.readonly ? ["m-rate--readonly"] : []),
    ...(o.allowHalf ? ["m-rate--half"] : []),
  ];
}

export function rateItemClasses(o: { state: RateItemState; hovered: boolean }): string[] {
  return [
    "m-rate__item",
    `m-rate__item--${o.state}`,
    ...(o.hovered ? ["m-rate__item--hover"] : []),
  ];
}

/**
 * 每格一团毛边墨点，按 seed 和下标派生，同一组里每格略不同。
 * 画幅按 2 倍生成再缩到格子大小，晕染位移才不会把小圆撕散。
 */
export function rateItemInk(seed: number, index: number): Record<string, string> {
  return {
    "--m-rate-mask": `url("${inkBlobUrl({ seed: seed * 31 + index, size: 48, radius: 0.38, raggedness: 0.14 })}")`,
  };
}

/**
 * roving tabindex：整组只有一个 Tab 停靠点——当前值所在的那一格，没有值时是第一格。
 * 禁用时全部退出 Tab 序列，只读仍可聚焦（读屏能念到）。
 */
export function rateTabIndex(index: number, value: number, o: { disabled: boolean }): number {
  if (o.disabled) return -1;
  const stop = value > 0 ? Math.ceil(value) - 1 : 0;
  return index === stop ? 0 : -1;
}

/** 每格的无障碍名字：有档位文字用文字，否则念分值 */
export function rateItemLabel(index: number, texts: string[] | undefined): string {
  return texts?.[index] ?? `${index + 1} 分`;
}

/** 每格的 aria。两个壳直接展开这一份 */
export interface RateItemAria {
  role: "radio";
  "aria-checked": boolean;
  "aria-label": string;
  "aria-posinset": number;
  "aria-setsize": number;
}

export function rateItemAria(
  index: number,
  value: number,
  o: { count: number; texts?: string[] },
): RateItemAria {
  return {
    role: "radio",
    // 半格也算选中了这一格
    "aria-checked": value > 0 && Math.ceil(value) === index + 1,
    "aria-label": rateItemLabel(index, o.texts),
    "aria-posinset": index + 1,
    "aria-setsize": o.count,
  };
}

/** 整组的 aria：值范围和当前值，禁用 / 只读也在这里 */
export interface RateGroupAria {
  role: "radiogroup";
  "aria-valuemin": number;
  "aria-valuemax": number;
  "aria-valuenow": number;
  "aria-valuetext"?: string;
  "aria-disabled"?: true;
  "aria-readonly"?: true;
}

export function rateGroupAria(
  value: number,
  o: { count: number; disabled: boolean; readonly: boolean; texts?: string[] },
): RateGroupAria {
  return {
    role: "radiogroup",
    "aria-valuemin": 0,
    "aria-valuemax": o.count,
    "aria-valuenow": value,
    "aria-valuetext": rateText(o.texts, value),
    "aria-disabled": o.disabled ? true : undefined,
    "aria-readonly": o.readonly ? true : undefined,
  };
}

/**
 * 键盘：左 / 下减一步、右 / 上加一步，Home 归零、End 满分。
 * 不管的键返回 undefined。
 */
export function rateKeyTarget(key: string, current: number, o: RateGeometry): number | undefined {
  const step = rateStep(o);
  switch (key) {
    case "ArrowRight":
    case "ArrowUp":
      return current + step;
    case "ArrowLeft":
    case "ArrowDown":
      return current - step;
    case "Home":
      return 0;
    case "End":
      return o.count;
    default:
      return undefined;
  }
}

/** 指针落在这一格的左半边（允许半格时才有意义）；量不到元素时按整格 */
export function rateHalfAt(el: HTMLElement | null, clientX: number): boolean {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && clientX - rect.left < rect.width / 2;
}

/* ── 悬停 / 落值控制器 ─────────────────────────────────────────── */

export interface RateOptions extends RateGeometry {
  disabled: boolean;
  readonly: boolean;
  allowClear: boolean;
  /** 当前绑定值，壳用 alignRateValue() 对齐好喂进来 */
  value: number;
  /** 点击或键盘落定的新值 */
  onChange: (value: number) => void;
  /** 悬停预览值变化；指针离开时为 0 */
  onHoverChange: (value: number) => void;
}

export interface RateSnapshot {
  /** 悬停预览值，0 表示没在悬停 */
  readonly hover: number;
}

export interface RateController extends Controller<RateSnapshot, RateOptions> {
  /** 每格元素的 ref 回调：量左右半边、键盘调值后把焦点挪过去 */
  setItem(index: number, el: HTMLElement | null): void;
  /** 挂在每格的 pointermove 上：预览这一格（或它的左半） */
  onPointerMove(index: number, event: PointerEvent): void;
  /** 挂在根的 pointerleave 上：撤掉预览 */
  onPointerLeave(): void;
  /** 挂在每格的 click 上：落值或清零 */
  onClick(index: number, event: MouseEvent): void;
  onKeyDown(index: number, event: KeyboardEvent): void;
}

const SERVER_SNAPSHOT: RateSnapshot = { hover: 0 };

export function createRate(initial: RateOptions): RateController {
  const store = createStore<RateSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  const items: (HTMLElement | null)[] = [];

  function setHover(next: number): void {
    if (store.get().hover === next) return;
    store.set({ hover: next });
    options.onHoverChange(next);
  }

  /** 指针指着的那个值 */
  function pointed(index: number, clientX: number): number {
    return rateValueAt(index, rateHalfAt(items[index] ?? null, clientX), options);
  }

  function commit(next: number): void {
    const aligned = alignRateValue(next, options);
    if (aligned === options.value) return;
    options.onChange(aligned);
  }

  return {
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,

    update(next) {
      options = next;
    },

    // 没有全局监听、不量尺寸：这一对留成空壳只是为了凑齐控制器的形状
    connect() {},
    disconnect() {
      if (store.get().hover !== 0) store.set({ hover: 0 });
    },

    setItem(index, el) {
      items[index] = el;
    },

    onPointerMove(index, event) {
      if (rateInert(options)) return;
      setHover(pointed(index, event.clientX));
    },

    onPointerLeave() {
      setHover(0);
    },

    onClick(index, event) {
      if (rateInert(options)) return;
      commit(rateNextValue(options.value, pointed(index, event.clientX), options.allowClear));
    },

    onKeyDown(index, event) {
      if (rateInert(options)) return;
      const target = rateKeyTarget(event.key, options.value, options);
      if (target === undefined) return;
      event.preventDefault();
      const aligned = alignRateValue(target, options);
      commit(aligned);
      // 停靠点跟着值走：焦点挪到新值所在的那一格，下一次方向键才从它出发
      const stop = aligned > 0 ? Math.ceil(aligned) - 1 : 0;
      if (stop !== index) items[stop]?.focus();
    },
  };
}
