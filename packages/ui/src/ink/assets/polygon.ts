/**
 * 笔触多边形：沿任意闭合多边形的每条边各走一笔，拼成一份 SVG。
 * 给倾斜的格子（MCell 的斜边）、菱形卡片这类矩形笔触边框（ink/stroke）套不上的外形用。
 * 颜色一律画黑，使用方当 mask-image，墨色由 CSS 变量决定。
 */
import { createRng } from "../random";
import {
  bleedFilter,
  paintBrush,
  samplePath,
  svgDoc,
  svgToDataUrl,
  type BleedOptions,
  type Point,
} from "./brush";

export interface BrushPolygonOptions {
  seed?: number;
  /** 笔宽 px，默认 3 */
  strokeWidth?: number;
  /** 边缘噪声 0–1，默认 0.5 */
  roughness?: number;
  /** 飞白 0–1，默认 0.12 */
  flyingWhite?: number;
  /** 拐角出头长度 px，默认 = strokeWidth */
  overshoot?: number;
  /** 手抖幅度 px，默认 strokeWidth * 0.25 */
  wobble?: number;
  /** 在 SVG 内嵌一层晕染滤镜，默认开 */
  bleed?: boolean | BleedOptions;
}

export interface BrushPolygon {
  url: string;
  /** 画幅相对 width×height 盒子的外扩距离 px */
  padding: number;
  width: number;
  height: number;
}

const cache = new Map<string, BrushPolygon>();
const CACHE_LIMIT = 200;

/**
 * 在 width×height 的盒子里按 points（盒子坐标系，px）画一圈笔触。
 * 顶点可以落在盒子外面（斜边出头），画幅会按 padding 外扩，使用方用 inset 负值把 ::before 撑出去。
 */
export function generateBrushPolygon(
  points: Point[],
  width: number,
  height: number,
  options: BrushPolygonOptions = {},
): { svg: string; padding: number; width: number; height: number } {
  const strokeWidth = options.strokeWidth ?? 3;
  const overshoot = options.overshoot ?? strokeWidth;
  const wobble = options.wobble ?? strokeWidth * 0.25;
  const seed = options.seed ?? 1;
  const roughness = options.roughness ?? 0.5;
  const flyingWhite = options.flyingWhite ?? 0.12;
  const rng = createRng(seed);

  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  // 顶点越出盒子多少，画幅就多留多少，再加笔宽 / 出头 / 手抖的余量
  let overflow = 0;
  for (const [x, y] of points) {
    overflow = Math.max(overflow, -x, -y, x - w, y - h);
  }
  const padding = Math.ceil(overflow + strokeWidth * 1.5 + overshoot + wobble);

  const strokes: string[] = [];
  for (let i = 0; i < points.length; i++) {
    let a = points[i]!;
    let b = points[(i + 1) % points.length]!;
    // 一律向右 / 向下画：方向一致，各边的起收笔看起来才像同一只手写的
    if (b[0] < a[0] || (b[0] === a[0] && b[1] < a[1])) [a, b] = [b, a];
    const path = samplePath([a, b], rng, { wobble, overshoot });
    strokes.push(paintBrush(path, { strokeWidth, roughness, flyingWhite }, rng));
  }

  const bleed = options.bleed ?? true;
  const filterId = `b${seed}`;
  const filter = bleed ? bleedFilter(filterId, seed, typeof bleed === "object" ? bleed : {}) : "";
  const vw = w + padding * 2;
  const vh = h + padding * 2;
  // 使用方把它拉到元素的 100%，尺寸分桶后画幅比例和元素不完全一致，必须 none
  const svg = svgDoc(
    {
      width: vw,
      height: vh,
      viewBox: `${-padding} ${-padding} ${vw} ${vh}`,
      preserveAspectRatio: "none",
    },
    `${filter}<g${bleed ? ` filter="url(#${filterId})"` : ""}>${strokes.join("")}</g>`,
  );
  return { svg, padding, width: vw, height: vh };
}

/** 生成（或取缓存）一张笔触多边形，顶点四舍五入到整像素后作缓存键 */
export function brushPolygonUrl(
  points: Point[],
  width: number,
  height: number,
  options: BrushPolygonOptions = {},
): BrushPolygon {
  const key = `${Math.round(width)}x${Math.round(height)}:${points.map(([x, y]) => `${Math.round(x)},${Math.round(y)}`).join(";")}:${options.seed ?? 1}:${options.strokeWidth ?? 3}:${options.roughness ?? ""}:${options.flyingWhite ?? ""}:${JSON.stringify(options.bleed ?? true)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const polygon = generateBrushPolygon(points, width, height, options);
  const entry = {
    url: svgToDataUrl(polygon.svg),
    padding: polygon.padding,
    width: polygon.width,
    height: polygon.height,
  };
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  cache.set(key, entry);
  return entry;
}
