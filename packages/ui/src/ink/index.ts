/**
 * ink 特效引擎入口。全部是纯算法 + SVG 滤镜，不依赖 canvas / worker / 第三方绘画库；
 * SSR 阶段全部为空操作。
 */
import { detectInkTier, type InkTier } from "./tier";
import { ensureInkFilters, type InkFilterOptions, type InkFiltersHandle } from "./bleed";
import { ensureInkAssets, type InkAssetsOptions } from "./assets";
import { prepareInkViewTransition } from "./transition";

export { detectInkTier, type InkTier };
export { ensureInkFilters, INK_FILTERS_ID, INK_READY_CLASS, type InkFilterOptions } from "./bleed";
export {
  deckleMaskUrl,
  fiberLayerSvg,
  generateGoldFlecks,
  GOLD_PRESETS,
  goldFleckUrl,
  PAPER_PRESETS,
  paperTextureUrl,
  resolvePaperKind,
  type DeckleMaskOptions,
  type FiberLayerOptions,
  type GoldFleck,
  type GoldFleckOptions,
  type GoldPreset,
  type PaperKind,
  type PaperPreset,
  type PaperTextureOptions,
} from "./paper";
export {
  createParallax,
  type ParallaxController,
  type ParallaxLayerTarget,
  type ParallaxOptions,
} from "./parallax";
export {
  applyBrushBorder,
  brushBorderUrl,
  clearBrushBorder,
  generateBrushBorder,
  STROKE_ATTR,
  svgToDataUrl,
  useBrushBorder,
  type BrushBorder,
  type BrushBorderOptions,
  type UseBrushBorderOptions,
} from "./stroke";
export {
  brushLineUrl,
  ensureInkAssets,
  inkBadgeUrl,
  inkBlobUrl,
  inkCircleUrl,
  inkCursorUrl,
  inkEnsoUrl,
  inkLatticeUrl,
  inkMarkUrl,
  inkRidgeUrl,
  inkRingUrl,
  inkScaleUrl,
  inkSceneSvg,
  inkShapeUrl,
  inkSplashUrl,
  inkTipUrl,
  inkWashUrl,
  type BrushLineOptions,
  type InkAssetsOptions,
  type InkBadgeKind,
  type InkBadgeOptions,
  type InkBlobOptions,
  type InkCircleOptions,
  type InkCursorKind,
  type InkEnsoOptions,
  type InkLatticeCorner,
  type InkLatticeOptions,
  type InkMarkKind,
  type InkMarkOptions,
  type InkRidgeOptions,
  type InkRingOptions,
  type InkScaleOptions,
  type InkShapeOptions,
  type InkTipOptions,
  type InkWashOptions,
} from "./assets";
export {
  revealElement,
  useInkReveal,
  vInkReveal,
  wipeMaskUrl,
  type InkRevealOptions,
  type WipeMaskOptions,
} from "./reveal";
export {
  createGlyphMeasurer,
  generateStamp,
  loadStampFont,
  splitColumns,
  type GlyphMeasurer,
  type GlyphMetric,
  type StampCell,
  type StampCorner,
  type StampDirection,
  type StampMode,
  type StampOptions,
  type StampRender,
  type StampShape,
} from "./stamp";
export {
  prepareInkViewTransition,
  startInkViewTransition,
  supportsViewTransition,
  type InkViewTransitionOptions,
} from "./transition";

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
