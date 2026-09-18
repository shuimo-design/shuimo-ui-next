/**
 * 朱砂日：一轮边缘微毛、中心实、外圈略化开的圆，山水横幅的日头用它。
 * 只画黑色当遮罩，颜色由 CSS 变量（印泥色）决定；同 seed 同一轮日。
 */
import { createRng } from "../random";
import { bleedFilter, blobPoints, svgDoc, svgToDataUrl } from "./brush";

export interface InkSunOptions {
  seed?: number;
  /** 画幅边长 px，默认 120 */
  size?: number;
  /** 边缘毛糙程度 0–1，默认 0.05；日头要圆，别调太大 */
  raggedness?: number;
}

const cache = new Map<string, string>();

export function inkSunUrl(options: InkSunOptions = {}): string {
  const seed = options.seed ?? 1;
  const size = options.size ?? 120;
  const raggedness = options.raggedness ?? 0.05;
  const key = `${seed}:${size}:${raggedness}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rng = createRng(seed * 41 + 5);
  const c = size / 2;
  // 留出晕染余量：盘面半径取画幅的 0.4
  const r = size * 0.4;
  const defs =
    `<radialGradient id="g"><stop offset="0" stop-color="#000"/><stop offset="0.78" stop-color="#000" stop-opacity="0.92"/>` +
    `<stop offset="1" stop-color="#000" stop-opacity="0.55"/></radialGradient>` +
    bleedFilter("b", seed, { frequency: 0.04, scale: 3, blur: 0.6 });
  const disc = `<polygon points="${blobPoints(c, c, r, rng, raggedness, 64)}" fill="url(#g)"/>`;
  const url = svgToDataUrl(
    svgDoc({ width: size, height: size }, `<defs>${defs}</defs><g filter="url(#b)">${disc}</g>`),
  );
  cache.set(key, url);
  return url;
}
