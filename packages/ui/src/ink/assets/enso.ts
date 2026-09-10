/**
 * 禅圈：一笔画出的不封口圆环。起笔在右上、按得重，逆时针绕一圈，
 * 收笔越走越细、在起笔旁边留一道口子（和 ring.ts 的闭合圆环不同）。
 * 日期选择器用它圈住选中的日子。颜色画黑，使用方当 mask，墨色由 CSS 变量决定。
 */
import { createRng } from "../random";
import { bleedFilter, paintBrush, samplePath, svgDoc, svgToDataUrl, type Point } from "./brush";

export interface InkEnsoOptions {
  seed?: number;
  /** 画幅边长 px，默认 32 */
  size?: number;
  /** 笔宽 px（相对画幅），默认 size 的 1/10 */
  strokeWidth?: number;
  /** 开口弧度，默认 0.9（约 50°）；传 0 就画满一圈 */
  gap?: number;
}

const cache = new Map<string, string>();

/** 起笔重按、收笔拖细，比通用的书法轮廓收得更尖 */
function ensoProfile(t: number): number {
  const head = t < 0.15 ? 1 + (0.15 - t) * 2 : 1;
  const tail = 1 - 0.75 * t * t;
  return head * tail;
}

export function inkEnsoUrl(options: InkEnsoOptions = {}): string {
  const seed = options.seed ?? 1;
  const size = options.size ?? 32;
  const strokeWidth = options.strokeWidth ?? size / 10;
  const gap = options.gap ?? 0.9;
  const key = `${seed}:${size}:${strokeWidth}:${gap}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rng = createRng(seed * 13 + 7);
  const c = size / 2;
  // 半径留出笔宽和晕染的余量，毛边不会被画幅裁掉
  const r = c - strokeWidth * 1.4;
  // 起笔在右上方（-70° 附近），随种子略微转一点，几张圈不会一模一样
  const start = -Math.PI * 0.39 + (rng() - 0.5) * 0.3;
  const sweep = Math.PI * 2 - gap;
  const steps = 48;
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = start - (i / steps) * sweep;
    // 手画的圈不正：半径沿途慢慢变化，收笔那段往里收一点
    const wobble = 1 + Math.sin(a * 2 + seed) * 0.03 - (i / steps) * 0.04;
    points.push([c + Math.cos(a) * r * wobble, c + Math.sin(a) * r * wobble]);
  }
  const path = samplePath(points, rng, { wobble: strokeWidth * 0.18, spacing: 2 });
  const body = paintBrush(
    path,
    { strokeWidth, roughness: 0.6, flyingWhite: 0.16, ribbons: 4, profile: ensoProfile },
    rng,
  );
  const svg = svgDoc(
    { width: size, height: size },
    `${bleedFilter("b", seed, { frequency: 0.1, scale: 1.6 * (size / 32), blur: 0.3 })}<g filter="url(#b)">${body}</g>`,
  );
  const url = svgToDataUrl(svg);
  cache.set(key, url);
  return url;
}
