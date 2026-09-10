/** 墨团：毛边的实心圆。单选圆点、开关滑块、列表项目符号、头像遮罩都用它 */
import { createRng } from "../random";
import { bleedFilter, blobPoints, svgDoc, svgToDataUrl } from "./brush";

export interface InkBlobOptions {
  seed?: number;
  /** 画幅边长 px，默认 24 */
  size?: number;
  /** 毛边程度 0–1，默认 0.12 */
  raggedness?: number;
  /** 半径占画幅的比例，默认 0.42 */
  radius?: number;
  /** 晕染强度，默认 1 */
  bleed?: number;
}

const cache = new Map<string, string>();

export function inkBlobUrl(options: InkBlobOptions = {}): string {
  const seed = options.seed ?? 1;
  const size = options.size ?? 24;
  const raggedness = options.raggedness ?? 0.12;
  const radius = options.radius ?? 0.42;
  const bleed = options.bleed ?? 1;
  const key = `${seed}:${size}:${raggedness}:${radius}:${bleed}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rng = createRng(seed * 7 + 3);
  const c = size / 2;
  const body = `<polygon points="${blobPoints(c, c, size * radius, rng, raggedness, 64)}" fill="#000"/>`;
  const svg = svgDoc(
    { width: size, height: size },
    `${bleedFilter("b", seed, { frequency: 0.08, scale: 2.2 * bleed * (size / 24), blur: 0.3 * bleed })}<g filter="url(#b)">${body}</g>`,
  );
  const url = svgToDataUrl(svg);
  cache.set(key, url);
  return url;
}
