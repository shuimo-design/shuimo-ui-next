/**
 * ink 特效引擎入口。主包不引 shuimo-core；worker 文件按需加载，SSR 阶段全部为空操作。
 */
import { detectInkTier, type InkTier } from "./tier";
import { ensureInkFilters, type InkFilterOptions, type InkFiltersHandle } from "./bleed";

export { detectInkTier, type InkTier };
export { ensureInkFilters, INK_FILTERS_ID, INK_READY_CLASS, type InkFilterOptions } from "./bleed";
export { inkWorkersKey, type InkWorkerFactories } from "./context";
export {
  createPaperRenderer,
  type PaperOptions,
  type PaperRenderer,
  type PaperRendererOptions,
} from "./paper";
export {
  createLandscapeRenderer,
  type LandscapeLayer,
  type LandscapeLayerSvg,
  type LandscapeOptions,
  type LandscapeRenderer,
  type LandscapeRendererOptions,
  type LandscapeResult,
} from "./landscape";
export {
  createParallax,
  type ParallaxController,
  type ParallaxLayerTarget,
  type ParallaxOptions,
} from "./parallax";

export interface InkEngineOptions {
  seed?: number;
  tier?: InkTier;
  filters?: InkFilterOptions;
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
  if (typeof document !== "undefined" && tier > 0) {
    filters = ensureInkFilters({ seed, ...options.filters });
  }
  return {
    seed,
    tier,
    dispose() {
      filters?.dispose();
      filters = undefined;
    },
  };
}
