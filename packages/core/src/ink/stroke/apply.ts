/** 笔触边框的生成与落地：纯命令式，不依赖任何框架。 */
import { applyInkVar } from "../registry";
import { generateBrushBorder, svgToDataUrl, type BrushBorderOptions } from "./generate";

export const STROKE_ATTR = "data-ink-stroke";
/** 尺寸按 8px 分桶，同桶复用同一张边框 */
const BUCKET = 8;
const CACHE_LIMIT = 200;
const cache = new Map<string, BrushBorderEntry>();
/** 已经描出过一次的边框（按尺寸桶 + 参数），再出现时直接落墨，不重播描出动画 */
const revealed = new Set<string>();

export interface BrushBorderEntry {
  url: string;
  padding: number;
}

export function bucket(value: number): number {
  return Math.max(BUCKET, Math.ceil(value / BUCKET) * BUCKET);
}

export function staticKey(w: number, h: number, options: BrushBorderOptions): string {
  return `${w}x${h}:${options.seed ?? 1}:${options.strokeWidth ?? 3}:${options.roughness ?? ""}:${options.flyingWhite ?? ""}:${JSON.stringify(options.bleed ?? true)}:${JSON.stringify(options.sides ?? "")}:${JSON.stringify(options.cornerGap ?? 0)}:${options.specks ?? 0}`;
}

/** 生成（或从缓存取）一张 width×height 的笔触边框，返回 CSS url() 可用的 data URL */
export function brushBorderUrl(
  width: number,
  height: number,
  options: BrushBorderOptions = {},
): BrushBorderEntry {
  const w = bucket(width);
  const h = bucket(height);
  const key = `${staticKey(w, h, options)}:${JSON.stringify(options.reveal ?? false)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const border = generateBrushBorder(w, h, options);
  const entry = { url: svgToDataUrl(border.svg), padding: border.padding };
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  cache.set(key, entry);
  return entry;
}

/** 边框图走素材登记（同尺寸的元素共用一条样式规则），外扩距离很短、直接内联 */
export function applyBrushBorder(el: HTMLElement, entry: BrushBorderEntry): void {
  applyInkVar(el, "--m-ink-stroke-border", entry.url);
  el.style.setProperty("--m-ink-stroke-pad", `${entry.padding}px`);
  el.setAttribute(STROKE_ATTR, "");
}

export function clearBrushBorder(el: HTMLElement): void {
  applyInkVar(el, "--m-ink-stroke-border", null);
  el.style.removeProperty("--m-ink-stroke-pad");
  el.removeAttribute(STROKE_ATTR);
}

/** 同一尺寸桶 + 同一参数的边框只描出一次：列表页来回切换不至于满屏重画 */
export function markRevealed(key: string): boolean {
  if (revealed.has(key)) return false;
  revealed.add(key);
  return true;
}
