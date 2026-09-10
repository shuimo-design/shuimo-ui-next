/**
 * 墨圈（细）：一笔绕出来的空心圆，单选框的外圈用它。
 * 从左上起笔顺时针绕一圈，收笔处略过起点叠一小段，像手画的圆那样有个接头；
 * 笔宽起笔略按、绕到对侧最饱、回到接头处收细。颜色一律画黑，当 mask-image 用。
 * 和 ring.ts 的禅圆不同：不带飞溅、不带尾巴，画幅就是盒子本身，适合 20px 左右的小控件。
 */
import { createRng } from "../random";
import { bleedFilter, paintBrush, samplePath, svgDoc, svgToDataUrl, type Point } from "./brush";

export interface InkCircleOptions {
  seed?: number;
  /** 画幅边长 px，默认 40 */
  size?: number;
  /** 笔宽 px，默认 size * 0.11 */
  thickness?: number;
  /** 边缘噪声 0–1，默认 0.5 */
  raggedness?: number;
  /** 手抖幅度 px，默认 thickness * 0.18 */
  wobble?: number;
  /** 收笔越过起点的弧度，默认 0.35（约 20°） */
  overlap?: number;
}

const cache = new Map<string, string>();

/** 一圈的宽度轮廓：起笔略按，绕到对侧最饱，回到接头处收细 */
function circleProfile(t: number): number {
  const head = t < 0.08 ? 1 + (0.08 - t) * 2.5 : 1;
  return (0.72 + 0.38 * Math.sin(t * Math.PI) ** 0.8) * head;
}

export function inkCircleUrl(options: InkCircleOptions = {}): string {
  const seed = options.seed ?? 1;
  const size = options.size ?? 40;
  const thickness = options.thickness ?? size * 0.11;
  const raggedness = options.raggedness ?? 0.5;
  const wobble = options.wobble ?? thickness * 0.18;
  const overlap = options.overlap ?? 0.35;
  const key = `${seed}:${size}:${thickness}:${raggedness}:${wobble}:${overlap}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const rng = createRng(seed * 11 + 7);
  const c = size / 2;
  // 半径要给最宽处的笔画、手抖和晕染位移留出余量，否则外沿被画幅裁平
  const r = c - thickness * 0.7 - wobble * 2 - 1.5;
  // 起笔在左上（约 10 点钟方向），随种子略偏
  const start = -Math.PI * 0.72 + (rng() - 0.5) * 0.4;
  const sweep = Math.PI * 2 + overlap;
  const segments = 72;
  const pts: Point[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = start + (i / segments) * sweep;
    pts.push([c + Math.cos(a) * r, c + Math.sin(a) * r]);
  }
  const path = samplePath(pts, rng, { wobble, spacing: 2 });
  const body = paintBrush(
    path,
    { strokeWidth: thickness, roughness: raggedness, flyingWhite: 0.06, profile: circleProfile },
    rng,
  );
  const svg = svgDoc(
    { width: size, height: size },
    `${bleedFilter("b", seed, { frequency: 0.08, scale: 1.6 * (size / 40), blur: 0.3 })}<g filter="url(#b)">${body}</g>`,
  );
  const url = svgToDataUrl(svg);
  cache.set(key, url);
  return url;
}
