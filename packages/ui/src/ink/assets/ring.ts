/**
 * 墨圈：一笔画成的圆（禅圆那种起笔重、收笔带尾），圈外散几点飞溅、圈内一两道干笔弧。
 * 旧库头像的圆框就是这个样子，这里改成带 seed 的生成器；当 mask-image 用，墨色由 background 决定。
 * 画幅按 100 单位的盒子外扩 padding，飞溅可以落到盒子外面。
 */
import { createNoise1D, createRng, type Rng } from "../random";
import {
  bleedFilter,
  blobPoints,
  paintBrush,
  samplePath,
  svgDoc,
  svgToDataUrl,
  type Point,
} from "./brush";

export interface InkRingOptions {
  seed?: number;
  /** 盒子边长 px（画幅会比它大 2×padding），默认 96 */
  size?: number;
  /** 笔宽，按 100 单位盒子算，默认 5 */
  strokeWidth?: number;
  /** 圆半径，按 100 单位盒子算，默认 44 */
  radius?: number;
  /** 飞溅多少 0–1，默认 0.6 */
  splatter?: number;
  /** 画幅外扩，按 100 单位盒子算，默认 14 */
  padding?: number;
}

export interface InkRing {
  url: string;
  /** 画幅相对盒子的外扩距离 px */
  padding: number;
  width: number;
  height: number;
}

const BOX = 100;
const cache = new Map<string, InkRing>();

/** 一段圆弧的折线：半径带慢噪声，像手在纸上转圈时的松紧 */
function arc(
  cx: number,
  cy: number,
  r: number,
  from: number,
  sweep: number,
  wobble: number,
  rng: Rng,
): Point[] {
  const noise = createNoise1D(rng, 16);
  const phase = rng() * 10;
  const steps = Math.max(24, Math.round(Math.abs(sweep) / 0.06));
  const pts: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = from + sweep * t;
    const k = r + noise(phase + t * 6) * wobble;
    pts.push([cx + Math.cos(a) * k, cy + Math.sin(a) * k]);
  }
  return pts;
}

/** 主圈的宽度轮廓：起笔按住最重，走到后半段慢慢提，收笔只剩笔尖 */
function ensoProfile(t: number): number {
  const head = t < 0.1 ? 1 + (0.1 - t) * 2.5 : 1;
  const tail = t > 0.78 ? Math.max(0.12, 1 - ((t - 0.78) / 0.22) ** 1.4) : 1;
  return (0.7 + 0.3 * Math.sin(t * Math.PI) ** 0.4) * head * tail;
}

export function inkRingUrl(options: InkRingOptions = {}): InkRing {
  const seed = options.seed ?? 1;
  const size = options.size ?? 96;
  const strokeWidth = options.strokeWidth ?? 5;
  const radius = options.radius ?? 44;
  const splatter = options.splatter ?? 0.6;
  const pad = options.padding ?? 14;
  const key = `${seed}:${size}:${strokeWidth}:${radius}:${splatter}:${pad}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const rng = createRng(seed * 17 + 11);
  const c = BOX / 2;
  const parts: string[] = [];

  // 主圈：从左上起笔，顺时针转一圈再多走一点，尾巴压在起笔上
  const start = -Math.PI * 0.62 + (rng() - 0.5) * 0.4;
  const main = arc(c, c, radius, start, Math.PI * 2.12, 1.4, rng);
  parts.push(
    paintBrush(
      samplePath(main, rng, { wobble: 0.5, spacing: 2 }),
      { strokeWidth, roughness: 0.6, flyingWhite: 0.16, ribbons: 5, profile: ensoProfile },
      rng,
    ),
  );

  // 圈内一两道干笔弧：笔毛散开时留下的细线
  const dryCount = 1 + Math.round(rng());
  for (let i = 0; i < dryCount; i++) {
    const from = rng() * Math.PI * 2;
    const sweep = Math.PI * (0.5 + rng() * 0.6);
    const r = radius - strokeWidth * (0.9 + rng() * 0.6);
    parts.push(
      `<g opacity="0.5">${paintBrush(
        samplePath(arc(c, c, r, from, sweep, 0.8, rng), rng, { wobble: 0.3, spacing: 2 }),
        { strokeWidth: strokeWidth * 0.32, roughness: 0.8, flyingWhite: 0.5, ribbons: 2 },
        rng,
      )}</g>`,
    );
  }

  // 飞溅：集中在一两个方向，离圈越远点越小
  if (splatter > 0) {
    const clusters = [rng() * Math.PI * 2, rng() * Math.PI * 2];
    const count = Math.round(22 * splatter);
    for (let i = 0; i < count; i++) {
      const base = clusters[i % clusters.length]!;
      const a = base + (rng() - 0.5) * 1.3;
      const far = rng() ** 1.6;
      const d = radius + strokeWidth * 0.8 + far * (pad + strokeWidth);
      const rr = (0.4 + rng() ** 2 * 2.4) * (1.1 - far * 0.6);
      const x = c + Math.cos(a) * d;
      const y = c + Math.sin(a) * d;
      parts.push(
        `<polygon points="${blobPoints(x, y, rr, rng, 0.3, 12)}" fill="#000" fill-opacity="${(0.7 + rng() * 0.3).toFixed(2)}"/>`,
      );
    }
  }

  const total = BOX + pad * 2;
  const px = Math.max(8, Math.round(size));
  const svg = svgDoc(
    {
      width: Math.round((px * total) / BOX),
      height: Math.round((px * total) / BOX),
      viewBox: `${-pad} ${-pad} ${total} ${total}`,
    },
    `${bleedFilter("b", seed, { frequency: 0.06, scale: 2.4, blur: 0.3 })}<g filter="url(#b)">${parts.join("")}</g>`,
  );
  const ring: InkRing = {
    url: svgToDataUrl(svg),
    padding: (px * pad) / BOX,
    width: (px * total) / BOX,
    height: (px * total) / BOX,
  };
  if (cache.size >= 100) cache.delete(cache.keys().next().value!);
  cache.set(key, ring);
  return ring;
}
