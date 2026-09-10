/**
 * 宣纸：一张可平铺的 SVG 纹理，当 background-image 用。
 * 底纹（纸色、颗粒、纤维走向）是一个 feTurbulence 滤镜（stitchTiles 保证无缝）；
 * 上面再叠矢量的纤维折线和颗粒（fiber.ts）。浏览器光栅化一次即缓存，不需要 canvas 或 worker。
 * 洒金单独一层（gold.ts），平铺单元更大，避免金簇重复。
 */
import { svgToDataUrl } from "../assets/brush";
import { fiberLayerSvg } from "./fiber";

export type PaperPreset = "raw" | "processed" | "antique" | "teaStained" | "moonWhite";

export const PAPER_PRESETS: Record<PaperPreset, [number, number, number]> = {
  raw: [255, 253, 248],
  processed: [252, 250, 240],
  antique: [245, 235, 215],
  teaStained: [240, 228, 200],
  moonWhite: [248, 250, 252],
};

export interface PaperTextureOptions {
  seed?: number;
  /** 纸底色 RGB，默认 processed（熟宣） */
  baseColor?: [number, number, number];
  /** 纹理强度 0–1，默认 0.5 */
  grain?: number;
  /**
   * 滤镜金粉：把噪声过阈值得到的细小金点（旧做法，便宜但没有金箔的形）。
   * 真正的洒金用 goldFleckUrl 单独一层。
   */
  goldSpecks?: boolean;
  /** 矢量纤维密度 0 ~ 4，默认 1；0 关掉 */
  fibers?: number;
  /** 矢量颗粒密度 0 ~ 1，默认 0.5；0 关掉 */
  particles?: number;
  /** 平铺单元边长 px，默认 384 */
  size?: number;
}

const textureCache = new Map<string, string>();

/** 宣纸纹理的 data URL，按参数缓存 */
export function paperTextureUrl(options: PaperTextureOptions = {}): string {
  const seed = options.seed ?? 1;
  const [r, g, b] = options.baseColor ?? PAPER_PRESETS.processed;
  const grain = options.grain ?? 0.5;
  const gold = options.goldSpecks ?? false;
  const fibers = options.fibers ?? 1;
  const particles = options.particles ?? 0.5;
  const size = options.size ?? 384;
  const key = `${seed}:${r},${g},${b}:${grain}:${gold}:${fibers}:${particles}:${size}`;
  const hit = textureCache.get(key);
  if (hit) return hit;

  // 纸的颗粒：把噪声压到 1 附近的一小段再相乘，只留下淡淡的明暗
  const grainSlope = (0.18 + 0.3 * grain).toFixed(3);
  const grainIntercept = (1 - 0.09 - 0.15 * grain).toFixed(3);
  // 纤维：横向拉长的低频云状噪声，压得很轻，只留若有若无的纹路
  const fiberSlope = (0.05 + 0.07 * grain).toFixed(3);
  const fiberIntercept = (1 - 0.025 - 0.035 * grain).toFixed(3);
  const goldStage = gold
    ? `<feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="1" seed="${seed + 2}" stitchTiles="stitch" result="n3"/>` +
      `<feColorMatrix in="n3" type="luminanceToAlpha" result="l3"/>` +
      `<feComponentTransfer in="l3" result="thr"><feFuncA type="table" tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0.9"/></feComponentTransfer>` +
      `<feFlood flood-color="#c9a227" result="goldc"/>` +
      `<feComposite in="goldc" in2="thr" operator="in" result="flecks"/>` +
      `<feComposite in="flecks" in2="p2" operator="over"/>`
    : "";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<filter id="p" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
    `<feFlood flood-color="rgb(${r},${g},${b})" result="base"/>` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="${seed}" stitchTiles="stitch" result="n1"/>` +
    `<feColorMatrix in="n1" type="saturate" values="0" result="g1"/>` +
    `<feComponentTransfer in="g1" result="c1"><feFuncR type="linear" slope="${grainSlope}" intercept="${grainIntercept}"/><feFuncG type="linear" slope="${grainSlope}" intercept="${grainIntercept}"/><feFuncB type="linear" slope="${grainSlope}" intercept="${grainIntercept}"/><feFuncA type="table" tableValues="1 1"/></feComponentTransfer>` +
    `<feBlend in="base" in2="c1" mode="multiply" result="p1"/>` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.02 0.09" numOctaves="2" seed="${seed + 1}" stitchTiles="stitch" result="n2"/>` +
    `<feColorMatrix in="n2" type="saturate" values="0" result="g2"/>` +
    `<feComponentTransfer in="g2" result="c2"><feFuncR type="linear" slope="${fiberSlope}" intercept="${fiberIntercept}"/><feFuncG type="linear" slope="${fiberSlope}" intercept="${fiberIntercept}"/><feFuncB type="linear" slope="${fiberSlope}" intercept="${fiberIntercept}"/><feFuncA type="table" tableValues="1 1"/></feComponentTransfer>` +
    `<feBlend in="p1" in2="c2" mode="multiply" result="p2"/>` +
    goldStage +
    `</filter>` +
    `<rect width="${size}" height="${size}" filter="url(#p)"/>` +
    fiberLayerSvg({ seed, size, baseColor: [r, g, b], fibers, particles }) +
    `</svg>`;
  const url = svgToDataUrl(svg);
  textureCache.set(key, url);
  return url;
}

export { deckleMaskUrl, type DeckleMaskOptions } from "./deckle";

export {
  generateGoldFlecks,
  goldFleckUrl,
  goldFlecksSvgInner,
  GOLD_PRESETS,
  resolveGoldColor,
  type GoldCommand,
  type GoldFleck,
  type GoldFleckOptions,
  type GoldPreset,
} from "./gold";
export { fiberLayerSvg, resolvePaperKind, type FiberLayerOptions, type PaperKind } from "./fiber";
