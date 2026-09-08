/**
 * 墨晕：全局注入一次 SVG 滤镜，组件用 `filter: url(#m-ink-bleed)` 引用。
 * 参数走 CSS 变量做不到（SVG 滤镜属性不吃 var()），所以按强度档位注入几套。
 * 注入完成后给 <html> 加 `m-ink-ready`，m.ink 层的样式都以它为前提，避免引用不存在的滤镜。
 */
export const INK_FILTERS_ID = "m-ink-filters";
export const INK_READY_CLASS = "m-ink-ready";

export interface InkFilterOptions {
  /** feTurbulence seed，同 seed 同纹理 */
  seed?: number;
  /** 位移强度 px，默认 2.5 */
  scale?: number;
  /** 噪声频率，默认 0.035 */
  frequency?: number;
}

const SVG_NS = "http://www.w3.org/2000/svg";

function el(name: string, attrs: Record<string, string | number>): SVGElement {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

function buildFilter(
  id: string,
  { seed = 7, scale = 2.5, frequency = 0.035 }: InkFilterOptions,
  blur: number,
): SVGElement {
  const filter = el("filter", {
    id,
    x: "-8%",
    y: "-8%",
    width: "116%",
    height: "116%",
    "color-interpolation-filters": "sRGB",
  });
  filter.append(
    el("feTurbulence", {
      type: "fractalNoise",
      baseFrequency: frequency,
      numOctaves: 3,
      seed,
      result: "noise",
    }),
    el("feDisplacementMap", {
      in: "SourceGraphic",
      in2: "noise",
      scale,
      xChannelSelector: "R",
      yChannelSelector: "G",
      result: "displaced",
    }),
    el("feGaussianBlur", { in: "displaced", stdDeviation: blur }),
  );
  return filter;
}

export interface InkFiltersHandle {
  readonly element: SVGSVGElement;
  dispose(): void;
}

/** 幂等：已存在则复用 */
export function ensureInkFilters(options: InkFilterOptions = {}): InkFiltersHandle {
  const existing = document.getElementById(INK_FILTERS_ID);
  if (existing instanceof SVGSVGElement) {
    return { element: existing, dispose: () => disposeFilters(existing) };
  }
  const svg = el("svg", {
    id: INK_FILTERS_ID,
    width: 0,
    height: 0,
    "aria-hidden": "true",
    focusable: "false",
    style: "position:absolute;width:0;height:0;overflow:hidden",
  }) as SVGSVGElement;
  const defs = el("defs", {});
  // 三档：轻（文字/边框）、中（按钮、标签）、重（转场遮罩）
  defs.append(
    buildFilter("m-ink-bleed-light", { ...options, scale: (options.scale ?? 2.5) * 0.5 }, 0.15),
    buildFilter("m-ink-bleed", options, 0.3),
    buildFilter("m-ink-bleed-heavy", { ...options, scale: (options.scale ?? 2.5) * 3 }, 0.8),
  );
  svg.append(defs);
  document.body.prepend(svg);
  document.documentElement.classList.add(INK_READY_CLASS);
  return { element: svg, dispose: () => disposeFilters(svg) };
}

function disposeFilters(svg: SVGSVGElement) {
  svg.remove();
  document.documentElement.classList.remove(INK_READY_CLASS);
}
