/**
 * ink 特效引擎入口。全部是纯算法 + SVG 滤镜，不依赖 canvas / worker / 第三方绘画库；
 * SSR 阶段全部为空操作。
 *
 * 这里一律 `export *`：组件只从这个 barrel 引，不再逐个深入子目录。
 * 深层引入会让"哪些是公开 API"变得模糊，拆包之后更是直接穿透包边界。
 */
import { detectInkTier, type InkTier } from "./tier";
import { ensureInkFilters, type InkFilterOptions, type InkFiltersHandle } from "./bleed";
import { ensureInkAssets, type InkAssetsOptions } from "./assets";
import { prepareInkViewTransition } from "./transition";

export * from "./assets";
export * from "./bleed";
export * from "./paper";
export * from "./parallax";
export * from "./random";
export * from "./registry";
export * from "./reveal";
export * from "./stamp";
export * from "./tier";
export * from "./transition";
// stroke 的 svgToDataUrl 是从 assets/brush 转出来的，两边都 export * 会撞，这里逐个列
export {
  applyBrushBorder,
  brushBorderUrl,
  clearBrushBorder,
  createBrushBorder,
  generateBrushBorder,
  STROKE_ATTR,
  type BrushBorder,
  type BrushBorderController,
  type BrushBorderControllerOptions,
  type BrushBorderEntry,
  type BrushBorderOptions,
} from "./stroke";

export interface InkEngineOptions {
  seed?: number;
  tier?: InkTier;
  filters?: InkFilterOptions;
  /** 素材库（墨点、笔触线、勾叉记号、光标）写成 :root 变量；false 关掉，对象可只关光标 */
  assets?: boolean | Omit<InkAssetsOptions, "seed">;
}

export interface InkEngine {
  readonly seed: number;
  readonly tier: InkTier;
  dispose(): void;
}

/** 挂载全局资源（SVG 滤镜、html 标记）。在浏览器里调用一次；SSR 下返回空实现。 */
export function createInkEngine(options: InkEngineOptions = {}): InkEngine {
  const seed = options.seed ?? Math.floor(Math.random() * 2 ** 31);
  const tier = options.tier ?? detectInkTier();
  let filters: InkFiltersHandle | undefined;
  let disposeAssets: (() => void) | undefined;
  if (typeof document !== "undefined" && tier > 0) {
    filters = ensureInkFilters({ seed, ...options.filters });
    prepareInkViewTransition({ seed });
    if (options.assets !== false) {
      disposeAssets = ensureInkAssets({
        seed,
        ...(typeof options.assets === "object" ? options.assets : {}),
      });
    }
  }
  return {
    seed,
    tier,
    dispose() {
      filters?.dispose();
      filters = undefined;
      disposeAssets?.();
      disposeAssets = undefined;
    },
  };
}
