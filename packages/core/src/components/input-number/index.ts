/**
 * 数字输入框的无框架部分：全部算术都在这里 —— 小数位数、钳制到 min/max、按 precision 取整、
 * 键入时的文本清洗、文本解析、步进时的浮点修正，外加 class 派生和加减号的墨迹素材。
 * Vue 和 React 的数字框各自只剩模板和事件绑定，这里的东西两边一字不差地共用。
 */
import { brushLineUrl } from "../../ink/assets/line";
import { inkMarkUrl } from "../../ink/assets/mark";
import type { BrushBorderOptions } from "../../ink/stroke";
import { FIELD_STROKE } from "../field-stroke";

export type { InputNumberProps } from "./types";

/** 两个按钮的无障碍名称，两个壳必须一致 */
export const INPUT_NUMBER_DECREASE_LABEL = "减少";
export const INPUT_NUMBER_INCREASE_LABEL = "增加";

/** 外框和输入框共用同一套细笔触参数，两者并排时边框粗细一致 */
export function inputNumberBrush(): BrushBorderOptions {
  return FIELD_STROKE;
}

// 水墨皮肤下，加减号换成素材库里一笔写出的记号，按钮与输入区之间隔一道按控件高度生成的短竖笔
const divider = brushLineUrl({ seed: 7, length: 36, thickness: 1.2, vertical: true });

/** 素材与随机种子都是写死的，整个模块只生成一次；返回同一个对象引用 */
const INK_STYLE: Record<string, string> = {
  "--m-input-number-plus": `url("${inkMarkUrl("plus", { seed: 4, strokeWidth: 2.2 })}")`,
  "--m-input-number-minus": `url("${inkMarkUrl("minus", { seed: 4, strokeWidth: 2.2 })}")`,
  "--m-input-number-divider": `url("${divider.url}")`,
  "--m-input-number-divider-band": `${divider.width}px`,
};

export function inputNumberInk(): Record<string, string> {
  return INK_STYLE;
}

/** 取值范围与精度：所有算术函数都吃这一份，省得每个函数各列三个参数 */
export interface NumberBounds {
  /** 默认 -Infinity */
  min?: number;
  /** 默认 Infinity */
  max?: number;
  /** 小数位数；不传则不限制 */
  precision?: number;
}

/** 小数点后有几位；用来把浮点加减的结果修回来（0.1 + 0.2） */
export function decimalsOf(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const text = String(value);
  const dot = text.indexOf(".");
  return dot < 0 ? 0 : text.length - dot - 1;
}

/** 钳制到 min/max 并按 precision 取整 */
export function normalizeNumber(value: number, bounds: NumberBounds = {}): number {
  const { min = -Infinity, max = Infinity, precision } = bounds;
  const clamped = Math.min(max, Math.max(min, value));
  return precision === undefined ? clamped : Number(clamped.toFixed(precision));
}

/** 值 → 显示文本；undefined 是空串 */
export function formatNumber(value: number | undefined, precision?: number): string {
  if (value === undefined) return "";
  return precision === undefined ? String(value) : value.toFixed(precision);
}

/**
 * 键入时的清洗：只留数字 / 一个前置 `-` / 一个 `.`；`.` 开头补 `0.`；去前导 0；按 precision 截断。
 * 允许留下 `-`、`1.` 这类中间态，提交时再由 parseNumberText 收拾。
 */
export function sanitizeNumberText(raw: string, precision?: number): string {
  let out = "";
  let dotted = false;
  for (const ch of raw) {
    if (ch >= "0" && ch <= "9") out += ch;
    else if (ch === "-" && out === "") out += ch;
    else if (ch === "." && !dotted && precision !== 0) {
      dotted = true;
      out += ch;
    }
  }
  out = out.replace(/^(-?)\./, "$10.");
  out = out.replace(/^(-?)0+(?=\d)/, "$1");
  if (precision !== undefined) {
    const dot = out.indexOf(".");
    if (dot >= 0) out = out.slice(0, dot + 1 + precision);
  }
  return out;
}

/** 把文本解析成数：空串（含孤立的 `-`）是 undefined，解析不了是 NaN，其余按 bounds 归一化 */
export function parseNumberText(raw: string, bounds: NumberBounds = {}): number | undefined {
  let s = raw.endsWith(".") ? raw.slice(0, -1) : raw;
  if (s === "-") s = "";
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? normalizeNumber(n, bounds) : Number.NaN;
}

/**
 * 按钮 / 方向键增减一步后的新值。
 * 基数优先取输入框里正在键入的文本（用户改了还没提交也要能接着加），
 * 取不到才回退到绑定值；没有绑定值就从归一化后的 0 起步。
 * 相加前把两边的小数位数取大者，用 toFixed 修掉 0.1 + 0.2 这类浮点误差。
 */
export function stepNumber(o: {
  /** 输入框当前文本 */
  text: string;
  /** 当前绑定值 */
  value: number | undefined;
  /** 步长，默认 1 */
  step?: number;
  direction: 1 | -1;
  bounds?: NumberBounds;
}): number {
  const step = o.step ?? 1;
  const bounds = o.bounds ?? {};
  const typed = parseNumberText(o.text, bounds);
  const base =
    typed === undefined || Number.isNaN(typed) ? (o.value ?? normalizeNumber(0, bounds)) : typed;
  const digits = Math.max(decimalsOf(base), decimalsOf(step));
  return normalizeNumber(Number((base + o.direction * step).toFixed(digits)), bounds);
}

/** 到底了就把按钮按灰；绑定值是 undefined 时两边都还能按（从 0 起步） */
export function inputNumberStepDisabled(o: {
  direction: 1 | -1;
  value: number | undefined;
  disabled?: boolean;
  readonly?: boolean;
  min?: number;
  max?: number;
}): boolean {
  if (o.disabled || o.readonly) return true;
  if (o.value === undefined) return false;
  return o.direction === 1 ? o.value >= (o.max ?? Infinity) : o.value <= (o.min ?? -Infinity);
}

/** aria-valuemin / aria-valuemax：无穷大不该写到属性上 */
export function inputNumberAriaBound(value: number | undefined): number | undefined {
  return value !== undefined && Number.isFinite(value) ? value : undefined;
}

export function inputNumberClasses(o: {
  disabled?: boolean;
  readonly?: boolean;
  focused: boolean;
  controls?: boolean;
}): string[] {
  return [
    "m-input-number",
    ...(o.disabled ? ["m-input-number--disabled"] : []),
    ...(o.readonly ? ["m-input-number--readonly"] : []),
    ...(o.focused ? ["m-input-number--focused"] : []),
    ...(o.controls ? ["m-input-number--controls"] : []),
  ];
}
