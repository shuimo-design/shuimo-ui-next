/**
 * 纤维与颗粒：按 shuimo-core 宣纸的思路移植成矢量层，叠在滤镜底纹上。
 * - 纤维：在一个方向场里从锚点向前后两头生长的细折线，大部分锚点往几个"团"里靠（宣纸的纤维是成束的）
 * - 颗粒：细小的椭圆，只落在噪声过零线附近（纤维交错处才有渣）
 * 输出的是一个平铺单元里的 SVG 片段，越界的纤维在对边补一份，接缝处不断。
 */
import { createNoise2D, createRng, type Rng } from "../random";

export type PaperKind = "raw" | "halfSized" | "sized";

/** 生宣 / 半熟 / 熟宣的手感参数：纤维对比、长度、颗粒对比、吸墨性 */
interface PaperProfile {
  warmth: number;
  fiberContrast: number;
  fiberLength: number;
  grainSoftness: number;
  particleContrast: number;
  absorbency: number;
}

const PROFILES: Record<PaperKind, PaperProfile> = {
  raw: {
    warmth: 0.12,
    fiberContrast: 1.2,
    fiberLength: 1.18,
    grainSoftness: 0.78,
    particleContrast: 0.88,
    absorbency: 1.1,
  },
  halfSized: {
    warmth: 0.2,
    fiberContrast: 1,
    fiberLength: 1,
    grainSoftness: 1,
    particleContrast: 0.96,
    absorbency: 0.88,
  },
  sized: {
    warmth: 0.34,
    fiberContrast: 0.82,
    fiberLength: 0.9,
    grainSoftness: 1.14,
    particleContrast: 1.04,
    absorbency: 0.65,
  },
};

const KIND_ANCHORS: { color: [number, number, number]; kind: PaperKind }[] = [
  { color: [255, 253, 248], kind: "raw" },
  { color: [248, 250, 252], kind: "raw" },
  { color: [252, 250, 240], kind: "halfSized" },
  { color: [245, 235, 215], kind: "sized" },
  { color: [240, 228, 200], kind: "sized" },
];

/** 按底色离哪个预设最近判断是生宣还是熟宣 */
export function resolvePaperKind(base: [number, number, number]): PaperKind {
  let best = KIND_ANCHORS[0]!;
  let bestDist = Infinity;
  for (const a of KIND_ANCHORS) {
    const d = Math.hypot(base[0] - a.color[0], base[1] - a.color[1], base[2] - a.color[2]);
    if (d < bestDist) {
      bestDist = d;
      best = a;
    }
  }
  return best.kind;
}

export interface FiberLayerOptions {
  seed: number;
  /** 平铺单元边长 */
  size: number;
  baseColor: [number, number, number];
  /** 纤维密度 0 ~ 4，默认 1 */
  fibers?: number;
  /** 颗粒密度 0 ~ 1，默认 0.5 */
  particles?: number;
  /** 纤维尺度 0.2 ~ 3，默认 1 */
  fiberScale?: number;
}

type Point = { x: number; y: number };

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function shade(base: [number, number, number], d: [number, number, number]): string {
  return `rgb(${clamp(Math.round(base[0] + d[0]), 0, 255)},${clamp(Math.round(base[1] + d[1]), 0, 255)},${clamp(Math.round(base[2] + d[2]), 0, 255)})`;
}

function gaussian(rng: Rng): number {
  const u = Math.max(rng(), 1e-9);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function angleDiff(a: number, b: number): number {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** 方向场是无向的（差 180° 算同一方向），挑离当前朝向近的那一头，纤维才不会掉头 */
function nearestHeading(undirected: number, current: number): number {
  const a = undirected;
  const b = undirected + Math.PI;
  return Math.abs(angleDiff(a, current)) <= Math.abs(angleDiff(b, current)) ? a : b;
}

function n(v: number): string {
  return (Math.round(v * 10) / 10).toString();
}

/** 越界的折线在对边补一份，最多补三份（角上） */
function wrapOffsets(points: Point[], size: number): Point[] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const dx = maxX > size ? -size : minX < 0 ? size : 0;
  const dy = maxY > size ? -size : minY < 0 ? size : 0;
  const out: Point[] = [{ x: 0, y: 0 }];
  if (dx) out.push({ x: dx, y: 0 });
  if (dy) out.push({ x: 0, y: dy });
  if (dx && dy) out.push({ x: dx, y: dy });
  return out;
}

export function fiberLayerSvg(o: FiberLayerOptions): string {
  const { seed, size, baseColor } = o;
  const fiberDensity = clamp(o.fibers ?? 1, 0, 4);
  const particleDensity = clamp(o.particles ?? 0.5, 0, 1);
  const fiberScale = clamp(o.fiberScale ?? 1, 0.2, 3);
  const profile = PROFILES[resolvePaperKind(baseColor)];
  let out = "";

  if (fiberDensity > 0) {
    const rng = createRng(seed + 809);
    const field = createNoise2D(createRng(seed + 811));
    const area = size * size;
    const mainCount = Math.floor(area * fiberDensity * 0.00012 * profile.fiberContrast);
    const fragmentCount = Math.floor(mainCount * (0.22 + profile.absorbency * 0.08));
    // 主方向略微偏离水平，别像机器压出来的；生宣（吸墨强）方向散一些，熟宣齐一些
    const tilt = (rng() - 0.5) * 0.3;
    const spread = 0.35 + clamp(profile.absorbency - 0.5, 0, 1) * 0.6;
    const fieldFreq = 1 / (62 * fiberScale);
    const direction = (x: number, y: number) => tilt + field(x * fieldFreq, y * fieldFreq) * spread;
    // 纤维团：几个高斯斑，一半以上的锚点往里落
    const clusterCount = Math.max(2, Math.round(area / 48000));
    const sigma = Math.sqrt(area / clusterCount) * 0.32;
    const clusters = Array.from({ length: clusterCount }, () => ({
      x: rng() * size,
      y: rng() * size,
      s: sigma * (0.7 + rng() * 0.6),
    }));
    const anchor = (p: number): Point => {
      if (rng() < p) {
        const c = clusters[Math.floor(rng() * clusters.length)]!;
        return { x: c.x + gaussian(rng) * c.s, y: c.y + gaussian(rng) * c.s };
      }
      return { x: rng() * size, y: rng() * size };
    };
    const grow = (
      a: Point,
      segLen: number,
      forward: number,
      backward: number,
      jitter: number,
    ): Point[] => {
      const start = direction(a.x, a.y);
      const back: Point[] = [];
      let bx = a.x;
      let by = a.y;
      let bh = start + Math.PI;
      for (let i = 0; i < backward; i++) {
        bh = nearestHeading(direction(bx, by), bh) + (rng() - 0.5) * jitter;
        bx += Math.cos(bh) * segLen;
        by += Math.sin(bh) * segLen;
        back.push({ x: bx, y: by });
      }
      back.reverse();
      const pts = [...back, a];
      let fx = a.x;
      let fy = a.y;
      let fh = start;
      for (let i = 0; i < forward; i++) {
        fh = nearestHeading(direction(fx, fy), fh) + (rng() - 0.5) * jitter;
        fx += Math.cos(fh) * segLen;
        fy += Math.sin(fh) * segLen;
        pts.push({ x: fx, y: fy });
      }
      return pts;
    };
    const warmthLift = profile.warmth * 18;
    const emit = (pts: Point[], width: number, alpha: number, darkness: number) => {
      const color = shade(baseColor, [
        -(darkness - warmthLift),
        -(darkness + 5 - warmthLift * 0.6),
        -(darkness + 14),
      ]);
      for (const off of wrapOffsets(pts, size)) {
        const d = pts
          .map((p, i) => `${i === 0 ? "M" : "L"}${n(p.x + off.x)} ${n(p.y + off.y)}`)
          .join("");
        out += `<path d="${d}" fill="none" stroke="${color}" stroke-opacity="${alpha.toFixed(3)}" stroke-width="${width.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
    };
    for (let i = 0; i < mainCount; i++) {
      const a = anchor(0.58);
      const length = (85 + rng() * 160) * fiberScale * profile.fiberLength;
      const segments = 15 + Math.floor(rng() * 15);
      const forward = Math.floor(segments * (0.42 + rng() * 0.16));
      const pts = grow(a, length / segments, forward, segments - forward, 0.12);
      emit(pts, 0.28 + rng() * 0.42, 0.05 + rng() * 0.08 * profile.fiberContrast, 46);
    }
    for (let i = 0; i < fragmentCount; i++) {
      const a = anchor(0.12);
      const length = (28 + rng() * 54) * fiberScale * profile.fiberLength;
      const segments = 7 + Math.floor(rng() * 7);
      const pts = grow(a, length / segments, segments, 0, 0.3);
      emit(pts, 0.35 + rng() * 0.55, 0.08 + rng() * 0.08 * profile.fiberContrast, 60);
    }
  }

  if (particleDensity > 0) {
    const rng = createRng(seed + 1103);
    const noise = createNoise2D(createRng(seed + 1140));
    const area = size * size;
    const count = Math.floor(area * particleDensity * 0.0016 * profile.particleContrast);
    const cell = 14 + (1 - particleDensity) * 10;
    // 只在噪声过零线附近落渣，密度越高这条带越宽
    const band = 0.12 + particleDensity * 0.18;
    for (let i = 0; i < count; i++) {
      const x = rng() * size;
      const y = rng() * size;
      if (Math.abs(noise(x / cell, y / cell)) > band) continue;
      const fragment = rng() < 0.06 + particleDensity * 0.05;
      const rx = fragment ? 1.6 + rng() * 4.2 : 0.35 + rng() * 1.2;
      const ry = fragment ? 0.5 + rng() * 1.6 : rx;
      const lift = fragment ? -42 : rng() < 0.58 ? -58 : 18;
      const color = shade(baseColor, [
        lift + profile.warmth * 16,
        lift - 4 + profile.warmth * 10,
        lift - 8,
      ]);
      const alpha = (fragment ? 0.08 : 0.05) + (rng() * 0.12) / profile.grainSoftness;
      const rot = Math.round(rng() * 180);
      const margin = rx + 1;
      const offs: Point[] = [{ x: 0, y: 0 }];
      if (x + margin > size) offs.push({ x: -size, y: 0 });
      if (y + margin > size) offs.push({ x: 0, y: -size });
      if (x - margin < 0) offs.push({ x: size, y: 0 });
      if (y - margin < 0) offs.push({ x: 0, y: size });
      for (const off of offs) {
        const cx = n(x + off.x);
        const cy = n(y + off.y);
        const transform = rx === ry ? "" : ` transform="rotate(${rot} ${cx} ${cy})"`;
        out += `<ellipse cx="${cx}" cy="${cy}" rx="${n(rx)}" ry="${n(ry)}" fill="${color}" fill-opacity="${alpha.toFixed(3)}"${transform}/>`;
      }
    }
  }
  return out;
}
