import { onBeforeUnmount, onMounted, watch, type Ref } from "vue";
import { useElementSize } from "@vueuse/core";
import type { BrushBorderOptions } from "./generate";
import "./stroke.css";

export type { BrushBorder, BrushBorderOptions } from "./generate";

export const STROKE_ATTR = "data-ink-stroke";
/** 尺寸按 8px 分桶，同桶复用同一张边框 */
const BUCKET = 8;
const CACHE_LIMIT = 200;
const cache = new Map<string, { url: string; padding: number }>();

let generateModule: Promise<typeof import("./generate")> | undefined;
function loadGenerate() {
  generateModule ??= import("./generate");
  return generateModule;
}

function bucket(value: number): number {
  return Math.max(BUCKET, Math.ceil(value / BUCKET) * BUCKET);
}

/** 生成（或从缓存取）一张 width×height 的笔触边框，返回 CSS url() 可用的 data URL */
export async function brushBorderUrl(
  width: number,
  height: number,
  options: BrushBorderOptions = {},
): Promise<{ url: string; padding: number }> {
  const w = bucket(width);
  const h = bucket(height);
  const key = `${w}x${h}:${options.seed ?? 1}:${options.strokeWidth ?? 3}:${options.roughness ?? ""}:${options.flyingWhite ?? ""}:${options.renderer ?? ""}:${options.texture ?? ""}:${JSON.stringify(options.bleed ?? true)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { generateBrushBorder, svgToDataUrl } = await loadGenerate();
  const border = generateBrushBorder(w, h, options);
  const entry = { url: svgToDataUrl(border.svg), padding: border.padding };
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  cache.set(key, entry);
  return entry;
}

export function applyBrushBorder(el: HTMLElement, entry: { url: string; padding: number }) {
  el.style.setProperty("--m-ink-stroke-border", `url("${entry.url}")`);
  el.style.setProperty("--m-ink-stroke-pad", `${entry.padding}px`);
  el.setAttribute(STROKE_ATTR, "");
}

export function clearBrushBorder(el: HTMLElement) {
  el.style.removeProperty("--m-ink-stroke-border");
  el.style.removeProperty("--m-ink-stroke-pad");
  el.removeAttribute(STROKE_ATTR);
}

export interface UseBrushBorderOptions extends BrushBorderOptions {
  /** 关掉时不生成也不打标记；默认跟随 html.m-ink-ready */
  enabled?: Ref<boolean> | boolean;
}

function isInkReady(): boolean {
  return (
    typeof document !== "undefined" && document.documentElement.classList.contains("m-ink-ready")
  );
}

/**
 * 给元素挂笔触边框：监听尺寸，按桶生成并写入 CSS 变量，样式见 stroke.css。
 * 只在客户端 onMounted 后工作，SSR 安全。
 */
export function useBrushBorder(
  target: Ref<HTMLElement | null>,
  options: UseBrushBorderOptions = {},
) {
  const { width, height } = useElementSize(target);
  let token = 0;

  function enabled(): boolean {
    const flag = options.enabled;
    if (flag === undefined) return isInkReady();
    return typeof flag === "boolean" ? flag : flag.value;
  }

  async function update() {
    const el = target.value;
    if (!el) return;
    if (!enabled() || width.value === 0 || height.value === 0) {
      clearBrushBorder(el);
      return;
    }
    const current = ++token;
    const entry = await brushBorderUrl(width.value, height.value, options);
    if (current !== token || target.value !== el) return;
    applyBrushBorder(el, entry);
  }

  onMounted(() => {
    watch(
      [width, height, () => (typeof options.enabled === "object" ? options.enabled.value : null)],
      update,
      {
        immediate: true,
      },
    );
  });
  onBeforeUnmount(() => {
    token++;
    if (target.value) clearBrushBorder(target.value);
  });

  return { update };
}
