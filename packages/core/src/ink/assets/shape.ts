/**
 * 整块外形：标签、按钮底、头像这类要"整个填满"的形状。
 * 矩形四边用噪声撕成毛边、四角略切，再晕染；当 mask-image 用，颜色由背景决定。
 * 按 8px 分桶缓存，配 useInkShape 跟随元素尺寸。
 */
import { createNoise1D, createRng } from "../random";
import { bleedFilter, compactPath, svgDoc, svgToDataUrl, type Point } from "./brush";

export interface InkShapeOptions {
  seed?: number;
  /** 毛边程度 0–1，默认 0.5 */
  raggedness?: number;
  /** 四角切掉的比例（相对短边），默认 0.18 */
  corner?: number;
  /** 左右两端做成笔锋（一头略尖），默认 false */
  taper?: boolean;
}

export interface InkShape {
  url: string;
  /** 画幅相对元素盒子的外扩距离 px */
  padding: number;
  width: number;
  height: number;
}

const BUCKET = 8;
const cache = new Map<string, InkShape>();

export function generateInkShape(
  width: number,
  height: number,
  options: InkShapeOptions = {},
): InkShape {
  const seed = options.seed ?? 1;
  const raggedness = options.raggedness ?? 0.5;
  const corner = Math.min(0.45, options.corner ?? 0.18);
  const taper = options.taper ?? false;
  const rng = createRng(seed * 13 + 5);
  const w = Math.max(8, Math.round(width));
  const h = Math.max(8, Math.round(height));
  const short = Math.min(w, h);
  const amp = short * 0.06 * raggedness;
  const padding = Math.ceil(amp * 2 + 2);
  const cut = short * corner;
  const noise = createNoise1D(rng, 32);
  const phase = rng() * 20;

  // 顺时针走一圈：每条边按弧长采样，法线方向加噪声偏移；角上用 cut 切成斜角
  const pts: Point[] = [];
  const perimeter = 2 * (w + h);
  const steps = Math.max(48, Math.min(240, Math.round(perimeter / 5)));
  for (let i = 0; i < steps; i++) {
    const d = (i / steps) * perimeter;
    let x: number;
    let y: number;
    let nx: number;
    let ny: number;
    if (d < w) {
      x = d;
      y = 0;
      nx = 0;
      ny = -1;
    } else if (d < w + h) {
      x = w;
      y = d - w;
      nx = 1;
      ny = 0;
    } else if (d < 2 * w + h) {
      x = w - (d - w - h);
      y = h;
      nx = 0;
      ny = 1;
    } else {
      x = 0;
      y = h - (d - 2 * w - h);
      nx = -1;
      ny = 0;
    }
    // 角：45° 斜切。上下边上离角 dx 以内的点往里压 (cut - dx)，左右边同理
    const dx = Math.min(x, w - x);
    const dy = Math.min(y, h - y);
    if (dx < cut && dy < cut) {
      if (ny !== 0) y += (y < h / 2 ? 1 : -1) * (cut - dx) * 0.8;
      else x += (x < w / 2 ? 1 : -1) * (cut - dy) * 0.8;
    }
    let off =
      noise(phase + (d / perimeter) * 24) * amp +
      noise(phase + 40 + (d / perimeter) * 90) * amp * 0.35;
    if (taper) {
      // 左右两端：上下边缘向中线收，像一笔横扫的起收
      const ex = Math.min(x, w - x) / short;
      if (ex < 0.5 && ny !== 0) off -= (0.5 - ex) * short * 0.12;
    }
    pts.push([x + nx * off, y + ny * off]);
  }
  const vw = w + padding * 2;
  const vh = h + padding * 2;
  const svg = svgDoc(
    {
      width: vw,
      height: vh,
      viewBox: `${-padding} ${-padding} ${vw} ${vh}`,
      preserveAspectRatio: "none",
    },
    `${bleedFilter("b", seed, { frequency: 0.05, scale: 3 + raggedness * 3, blur: 0.4 })}<g filter="url(#b)"><path d="${compactPath(pts, true)}" fill="#000"/></g>`,
  );
  return { url: svgToDataUrl(svg), padding, width: vw, height: vh };
}

function bucket(value: number): number {
  return Math.max(BUCKET, Math.ceil(value / BUCKET) * BUCKET);
}

/** 按 8px 分桶取缓存 */
export function inkShapeUrl(
  width: number,
  height: number,
  options: InkShapeOptions = {},
): InkShape {
  const w = bucket(width);
  const h = bucket(height);
  const key = `${w}x${h}:${options.seed ?? 1}:${options.raggedness ?? 0.5}:${options.corner ?? 0.18}:${options.taper ?? false}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const shape = generateInkShape(w, h, options);
  if (cache.size >= 200) cache.delete(cache.keys().next().value!);
  cache.set(key, shape);
  return shape;
}
