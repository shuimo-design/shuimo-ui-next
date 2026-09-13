/**
 * 滑块的无框架部分。这个组件几乎全是数值运算——步长对齐、按坐标折算值、找最近的把手、
 * 键盘七个键各自的增减——一行都不该在壳里重写，两个框架算出来的值必须逐位相同。
 *
 * 分两类：
 * - 纯派生（对齐、比例、样式、文案、aria）是纯函数，由壳在渲染期调（computed / useMemo）；
 * - 拖拽是有状态的（正在拖哪个把手、按下时的值、拖动中最后写出去的值），写成控制器。
 */
import { brushLineUrl } from "../../ink/assets/line";
import { createStore } from "../../runtime/store";
import type { Controller } from "../../runtime/controller";
import type { SliderValue } from "./types";

export type { SliderEmits, SliderModel, SliderProps, SliderValue } from "./types";

/** range 时两个把手的无障碍名字；单把手不加名字，读屏会念外面的 label */
export const SLIDER_RANGE_LABELS = ["起点", "终点"] as const;

/** 轨道、把手的几何都按 props 算，这里是归一化后的那一份 */
export interface SliderGeometry {
  min: number;
  max: number;
  step: number;
  range: boolean;
}

/** 数字字面量的小数位数：0.25 → 2。用来决定对齐后保留几位，免得浮点误差露出来 */
function decimalsOf(value: number): number {
  const text = String(value);
  const dot = text.indexOf(".");
  return dot < 0 ? 0 : text.length - dot - 1;
}

/** 钳制到 [min, max] 并对齐到 step 格点；max 不在格点上时仍可到达 */
export function alignSliderValue(value: number, o: SliderGeometry): number {
  if (!Number.isFinite(value)) return o.min;
  const clamped = Math.min(o.max, Math.max(o.min, value));
  const digits = Math.max(decimalsOf(o.step), decimalsOf(o.min));
  const snapped = Number((o.min + Math.round((clamped - o.min) / o.step) * o.step).toFixed(digits));
  return Math.min(o.max, snapped);
}

/** 当前各把手的值：单把手一项，range 两项且已排好序 */
export function sliderValues(raw: SliderValue | undefined, o: SliderGeometry): number[] {
  if (o.range) {
    const [a, b] = Array.isArray(raw) ? raw : [o.min, typeof raw === "number" ? raw : o.min];
    const lo = alignSliderValue(a, o);
    const hi = alignSliderValue(b, o);
    return [Math.min(lo, hi), Math.max(lo, hi)];
  }
  return [alignSliderValue(Array.isArray(raw) ? (raw[0] ?? o.min) : (raw ?? o.min), o)];
}

/** 值在区间里的位置 0–1 */
export function sliderRatio(value: number, o: Pick<SliderGeometry, "min" | "max">): number {
  const span = o.max - o.min;
  return span > 0 ? (value - o.min) / span : 0;
}

/** 珠子始终整个落在轨道里：位置按"轨道宽 - 珠子宽"算，和旧版一致 */
export function sliderThumbLeft(
  value: number,
  o: Pick<SliderGeometry, "min" | "max">,
): Record<string, string> {
  return { left: `calc(${sliderRatio(value, o)} * (100% - var(--m-slider-thumb)))` };
}

/** 珠子中心到轨道左端的距离 */
function thumbCenter(value: number, o: Pick<SliderGeometry, "min" | "max">): string {
  return `calc(${sliderRatio(value, o)} * (100% - var(--m-slider-thumb)) + var(--m-slider-thumb) / 2)`;
}

/** 已选中那一段：单把手从左端起，range 从起点珠子中心起 */
export function sliderTrackStyle(values: number[], o: SliderGeometry): Record<string, string> {
  const end = thumbCenter(values[o.range ? 1 : 0] ?? o.min, o);
  return o.range
    ? { left: thumbCenter(values[0] ?? o.min, o), right: `calc(100% - ${end})` }
    : { left: "0", right: `calc(100% - ${end})` };
}

/** 信息行里的百分比：旧版只显示位置百分比，保留两位小数 */
export function sliderPercentText(values: number[], o: SliderGeometry): string {
  return values.map((v) => `${(sliderRatio(v, o) * 100).toFixed(2)}%`).join(" ~ ");
}

export function sliderTooltipText(value: number, format?: (value: number) => string): string {
  return format ? format(value) : String(value);
}

export function sliderClasses(o: { disabled: boolean; range: boolean }): string[] {
  return [
    "m-slider",
    ...(o.disabled ? ["m-slider--disabled"] : []),
    ...(o.range ? ["m-slider--range"] : []),
  ];
}

/**
 * 轨道那一抹：按默认宽度 200px 生成，起笔在左、越往右越细；
 * m.ink 层按画幅高铺、横向拉到实际宽度。整个模块只生成一次。
 */
const RAIL_LINE = brushLineUrl({ seed: 5, length: 200, thickness: 8, taper: 0.5, endPad: 4 });

export function sliderInkStyle(): Record<string, string> {
  return {
    "--m-slider-line-mask": `url("${RAIL_LINE.url}")`,
    "--m-slider-line-band": `${RAIL_LINE.height}px`,
  };
}

/** 把手上的 aria。两个壳直接展开这一份，属性名和取值才不会各写各的 */
export interface SliderThumbAria {
  role: "slider";
  "aria-label"?: string;
  "aria-valuenow": number;
  "aria-valuemin": number;
  "aria-valuemax": number;
  "aria-valuetext"?: string;
  "aria-disabled"?: true;
  "aria-orientation": "horizontal";
}

export function sliderThumbAria(
  index: number,
  values: number[],
  o: SliderGeometry & { disabled: boolean; formatTooltip?: (value: number) => string },
): SliderThumbAria {
  const value = values[index] ?? o.min;
  return {
    role: "slider",
    "aria-label": o.range ? SLIDER_RANGE_LABELS[index] : undefined,
    "aria-valuenow": value,
    // range 时两个把手不能交叉，可达范围各自被对方截断
    "aria-valuemin": o.range && index === 1 ? (values[0] ?? o.min) : o.min,
    "aria-valuemax": o.range && index === 0 ? (values[1] ?? o.max) : o.max,
    "aria-valuetext": o.formatTooltip ? o.formatTooltip(value) : undefined,
    "aria-disabled": o.disabled ? true : undefined,
    "aria-orientation": "horizontal",
  };
}

/** 禁用时把手退出 Tab 序列，但仍留在 DOM 里供读屏浏览 */
export function sliderTabIndex(disabled: boolean): number {
  return disabled ? -1 : 0;
}

/**
 * 七个键各自要走到哪个值；不管这个键的返回 undefined。
 * PageUp / PageDown 一次走十格，Home / End 直达两端——和旧库一致。
 */
export function sliderKeyTarget(
  key: string,
  current: number,
  o: SliderGeometry,
): number | undefined {
  switch (key) {
    case "ArrowRight":
    case "ArrowUp":
      return current + o.step;
    case "ArrowLeft":
    case "ArrowDown":
      return current - o.step;
    case "PageUp":
      return current + o.step * 10;
    case "PageDown":
      return current - o.step * 10;
    case "Home":
      return o.min;
    case "End":
      return o.max;
    default:
      return undefined;
  }
}

/* ── 拖拽控制器 ──────────────────────────────────────────────── */

export interface SliderOptions extends SliderGeometry {
  disabled: boolean;
  /** 当前各把手的值，壳用 sliderValues() 算好喂进来 */
  values: number[];
  /** 拖动过程中每次值变化 */
  onInput: (value: SliderValue) => void;
  /** 松手 / 键盘调整后的最终值 */
  onChange: (value: SliderValue) => void;
}

export interface SliderSnapshot {
  /** 正在拖的把手下标，-1 表示没在拖。只驱动一个 --active 类名 */
  readonly active: number;
}

export interface SliderController extends Controller<SliderSnapshot, SliderOptions> {
  /**
   * 指针事件挂在哪个元素上的 ref 回调。指针捕获要对着这个元素做，不能用事件的 currentTarget：
   * React 把监听装在根容器上，原生事件的 currentTarget 是根容器而不是这一层。
   */
  setBody(el: HTMLElement | null): void;
  /** 轨道元素的 ref 回调：按坐标折算值要量它的宽度 */
  setRail(el: HTMLElement | null): void;
  /** 把手元素的 ref 回调：按下时要把焦点送过去，折算值时要减掉半个珠子 */
  setThumb(index: number, el: HTMLElement | null): void;
  onPointerDown(event: PointerEvent): void;
  onPointerMove(event: PointerEvent): void;
  /** pointerup 和 pointercancel 共用 */
  onPointerUp(event: PointerEvent): void;
  onKeyDown(index: number, event: KeyboardEvent): void;
}

const SERVER_SNAPSHOT: SliderSnapshot = { active: -1 };

export function createSlider(initial: SliderOptions): SliderController {
  const store = createStore<SliderSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  let body: HTMLElement | null = null;
  let rail: HTMLElement | null = null;
  const thumbs: (HTMLElement | null)[] = [];
  /** 正在拖的把手下标，-1 表示没在拖 */
  let active = -1;
  /** 按下时的值，松手时对比决定要不要发 change */
  let pressedValue: SliderValue | undefined;
  /** 拖动中最后写出去的值；父组件回写 props 是异步的，松手时不能靠 props 取 */
  let draggedValue: SliderValue | undefined;

  function valueAt(index: number): number {
    return options.values[index] ?? options.min;
  }

  function snapshotValue(): SliderValue {
    return options.range ? [valueAt(0), valueAt(1)] : valueAt(0);
  }

  /** 写入某个把手的值；range 时两个把手不能交叉。没变化时返回 undefined */
  function setValue(index: number, raw: number): SliderValue | undefined {
    let next = alignSliderValue(raw, options);
    if (options.range) {
      const other = valueAt(1 - index);
      next = index === 0 ? Math.min(next, other) : Math.max(next, other);
    }
    if (next === valueAt(index)) return undefined;
    const out: SliderValue = options.range
      ? index === 0
        ? [next, valueAt(1)]
        : [valueAt(0), next]
      : next;
    options.onInput(out);
    return out;
  }

  function valueFromClientX(clientX: number): number {
    const rect = rail?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return options.min;
    // 珠子不越出轨道，所以可用行程是"轨道宽 - 珠子宽"，指针位置要减掉半个珠子
    const thumb = thumbs[0]?.offsetWidth ?? 0;
    const travel = Math.max(1, rect.width - thumb);
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left - thumb / 2) / travel));
    return options.min + ratio * (options.max - options.min);
  }

  /** 点在空白处时归哪个把手管：落在两者之外的一侧就给那一侧，落在中间给更近的那个 */
  function nearestIndex(value: number): number {
    if (!options.range) return 0;
    const [lo, hi] = [valueAt(0), valueAt(1)];
    if (value <= lo) return 0;
    if (value >= hi) return 1;
    return value - lo <= hi - value ? 0 : 1;
  }

  function setActive(index: number): void {
    active = index;
    store.set({ active: index });
  }

  return {
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,

    update(next) {
      options = next;
    },

    // 滑块没有全局监听，也不量尺寸：指针捕获挂在 setBody() 给的那个元素上，
    // 这一对留成空壳只是为了凑齐控制器的形状，两个壳的胶水才能一视同仁地用
    connect() {},
    disconnect() {
      if (active >= 0) setActive(-1);
    },

    setBody(el) {
      body = el;
    },
    setRail(el) {
      rail = el;
    },
    setThumb(index, el) {
      thumbs[index] = el;
    },

    onPointerDown(event) {
      if (options.disabled || event.button !== 0) return;
      const thumb = (event.target as Element).closest<HTMLElement>(".m-slider__thumb");
      const raw = valueFromClientX(event.clientX);
      const index = thumb ? Number(thumb.dataset.index) : nearestIndex(raw);
      event.preventDefault();
      pressedValue = snapshotValue();
      draggedValue = undefined;
      setActive(index);
      // 按在把手上是纯拖拽的起手，值不动；按在空白处先跳过去
      if (!thumb) draggedValue = setValue(index, raw);
      thumbs[index]?.focus();
      body?.setPointerCapture(event.pointerId);
    },

    onPointerMove(event) {
      if (active < 0) return;
      draggedValue = setValue(active, valueFromClientX(event.clientX)) ?? draggedValue;
    },

    onPointerUp(event) {
      if (active < 0) return;
      if (body?.hasPointerCapture(event.pointerId)) body.releasePointerCapture(event.pointerId);
      setActive(-1);
      // 整个拖拽过程只发一次 change，且值真的变了才发
      if (
        draggedValue !== undefined &&
        JSON.stringify(draggedValue) !== JSON.stringify(pressedValue)
      ) {
        options.onChange(draggedValue);
      }
      pressedValue = undefined;
      draggedValue = undefined;
    },

    onKeyDown(index, event) {
      if (options.disabled) return;
      const target = sliderKeyTarget(event.key, valueAt(index), options);
      if (target === undefined) return;
      event.preventDefault();
      const out = setValue(index, target);
      // 键盘每一下都是一次完整调整，立刻就是最终值
      if (out !== undefined) options.onChange(out);
    },
  };
}
