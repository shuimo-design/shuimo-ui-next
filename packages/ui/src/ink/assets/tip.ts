/** 墨尖：毛边的实心小三角，尖朝上。气泡 / 提示的箭头用它，转向靠 CSS rotate */
import { createNoise1D, createRng } from "../random";
import { bleedFilter, fmt, svgDoc, svgToDataUrl, type Point } from "./brush";

export interface InkTipOptions {
  seed?: number;
  /** 底边宽 px，默认 14 */
  width?: number;
  /** 尖到底边的高 px，默认 7 */
  height?: number;
  /** 边缘毛糙程度 0–1，默认 0.5 */
  raggedness?: number;
}

const cache = new Map<string, string>();

/** 把一条边采成若干点，沿法线抖动；底边不抖（要贴在气泡边上，露缝会很显眼） */
function edge(a: Point, b: Point, jitter: number, noise: (x: number) => number, phase: number) {
  const steps = 8;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const pts: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    // 尖端附近收住抖动，不然尖会散开
    const k = jitter * Math.sin(t * Math.PI) ** 0.6 * noise(phase + t * 6);
    pts.push(`${fmt(a[0] + dx * t + nx * k)} ${fmt(a[1] + dy * t + ny * k)}`);
  }
  return pts;
}

export function inkTipUrl(options: InkTipOptions = {}): string {
  const seed = options.seed ?? 1;
  const width = options.width ?? 14;
  const height = options.height ?? 7;
  const raggedness = options.raggedness ?? 0.5;
  const key = `${seed}:${width}:${height}:${raggedness}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rng = createRng(seed * 13 + 5);
  const noise = createNoise1D(rng, 16);
  const jitter = raggedness * Math.min(width, height) * 0.09;
  // 画幅比三角略宽，给晕染留出余量；底边压到画幅最底，叠在气泡边上不露缝
  const pad = 1;
  const apex: Point = [width / 2 + pad, pad];
  const left: Point = [pad, height + pad];
  const right: Point = [width + pad, height + pad];
  const points = [
    ...edge(apex, right, jitter, noise, rng() * 10),
    `${fmt(right[0])} ${fmt(right[1])}`,
    `${fmt(left[0])} ${fmt(left[1])}`,
    ...edge(left, apex, jitter, noise, rng() * 10),
  ].join(" ");
  const svg = svgDoc(
    { width: width + pad * 2, height: height + pad },
    `${bleedFilter("b", seed, { frequency: 0.2, scale: 1.2, blur: 0.2 })}<g filter="url(#b)"><polygon points="${points}" fill="#000"/></g>`,
  );
  const url = svgToDataUrl(svg);
  cache.set(key, url);
  return url;
}
