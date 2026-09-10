/**
 * 水墨素材库：全部是带种子的 SVG 生成函数，输出 data URL 当 mask-image / background 用。
 * ensureInkAssets 把固定尺寸的那些写成 :root 上的 CSS 变量，组件的 m.ink 层直接引用。
 */
export {
  bleedFilter,
  blobPoints,
  calligraphicProfile,
  evenProfile,
  paintBrush,
  samplePath,
  svgDoc,
  svgToDataUrl,
  type BleedOptions,
  type BrushOptions,
  type BrushPath,
  type Point,
  type SamplePathOptions,
} from "./brush";
export { brushLineUrl, type BrushLine, type BrushLineOptions } from "./line";
export { inkMarkUrl, type InkMarkKind, type InkMarkOptions } from "./mark";
export { inkBlobUrl, type InkBlobOptions } from "./blob";
export { generateInkShape, inkShapeUrl, type InkShape, type InkShapeOptions } from "./shape";
export { inkWashUrl, type InkWashOptions } from "./wash";
export { inkRidgeUrl, type InkRidge, type InkRidgeOptions } from "./ridge";
export { inkBadgeUrl, type InkBadgeKind, type InkBadgeOptions } from "./badge";
export { inkLatticeUrl, type InkLatticeCorner, type InkLatticeOptions } from "./lattice";
export { inkCursorUrl, type InkCursorKind, type InkCursorOptions } from "./cursor";
export {
  brushPolygonUrl,
  generateBrushPolygon,
  type BrushPolygon,
  type BrushPolygonOptions,
} from "./polygon";
export { inkTipUrl, type InkTipOptions } from "./tip";
export { inkTagFrame, type InkTagFrame } from "./tag";
export { inkRingUrl, type InkRing, type InkRingOptions } from "./ring";
export { inkCircleUrl, type InkCircleOptions } from "./circle";
export { inkEnsoUrl, type InkEnsoOptions } from "./enso";
export { inkScaleUrl, type InkScale, type InkScaleOptions } from "./scale";
export { inkSplashUrl, type InkSplashOptions } from "./splash";
export { inkSceneSvg, INK_SCENE_HEIGHT, INK_SCENE_WIDTH, type InkSceneOptions } from "./scene";

import { brushLineUrl } from "./line";
import { inkBlobUrl } from "./blob";
import { inkCursorUrl } from "./cursor";
import { inkMarkUrl, type InkMarkKind } from "./mark";
import { inkWashUrl } from "./wash";

export interface InkAssetsOptions {
  seed?: number;
  /** 是否替换光标，默认 true */
  cursors?: boolean;
}

const MARKS: InkMarkKind[] = [
  "check",
  "minus",
  "plus",
  "cross",
  "chevronDown",
  "chevronRight",
  "dot",
];

function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/** 把固定尺寸素材写成 :root 变量：--m-ink-mark-*、--m-ink-dot、--m-ink-line-h/v、--m-ink-wash、--m-cursor-* */
export function ensureInkAssets(options: InkAssetsOptions = {}): () => void {
  if (typeof document === "undefined") return () => {};
  const seed = options.seed ?? 1;
  const root = document.documentElement.style;
  const names: string[] = [];
  const set = (name: string, value: string) => {
    root.setProperty(name, value);
    names.push(name);
  };
  for (const kind of MARKS)
    set(`--m-ink-mark-${kebab(kind)}`, `url("${inkMarkUrl(kind, { seed })}")`);
  set("--m-ink-dot", `url("${inkBlobUrl({ seed })}")`);
  set("--m-ink-line-h", `url("${brushLineUrl({ seed }).url}")`);
  set("--m-ink-line-v", `url("${brushLineUrl({ seed, vertical: true }).url}")`);
  set("--m-ink-wash", `url("${inkWashUrl({ seed })}")`);
  if (options.cursors ?? true) {
    set("--m-cursor-auto", `url("${inkCursorUrl("auto", { seed })}") 6 3, auto`);
    set("--m-cursor-pointer", `url("${inkCursorUrl("pointer", { seed })}") 6 3, pointer`);
    set("--m-cursor-disabled", `url("${inkCursorUrl("disabled", { seed })}") 6 3, not-allowed`);
  }
  return () => {
    for (const name of names) root.removeProperty(name);
  };
}
