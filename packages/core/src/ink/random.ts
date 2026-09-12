/** 可复现的随机数：同 seed 同序列。mulberry32，够快也够散 */
export type Rng = () => number;

export function createRng(seed: number): Rng {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 一维平滑噪声，取值 [-1, 1]，整数格点上取随机值、之间用 smoothstep 插值 */
export function createNoise1D(rng: Rng, size = 64): (x: number) => number {
  const table = Array.from({ length: size }, () => rng() * 2 - 1);
  return (x) => {
    const i = Math.floor(x);
    const f = x - i;
    const a = table[((i % size) + size) % size]!;
    const b = table[(((i + 1) % size) + size) % size]!;
    const u = f * f * (3 - 2 * f);
    return a + (b - a) * u;
  };
}

/** 二维梯度噪声（Perlin 改良版），取值约 [-1, 1]；置换表用 rng 打乱，同 seed 同图 */
export function createNoise2D(rng: Rng): (x: number, y: number) => number {
  const base = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = base[i]!;
    base[i] = base[j]!;
    base[j] = t;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = base[i & 255]!;
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (t: number, a: number, b: number) => a + t * (b - a);
  const grad = (h: number, x: number, y: number) => {
    switch (h & 7) {
      case 0:
        return x + y;
      case 1:
        return -x + y;
      case 2:
        return x - y;
      case 3:
        return -x - y;
      case 4:
        return x;
      case 5:
        return -x;
      case 6:
        return y;
      default:
        return -y;
    }
  };
  return (px, py) => {
    const xi = Math.floor(px);
    const yi = Math.floor(py);
    const x = px - xi;
    const y = py - yi;
    const X = xi & 255;
    const Y = yi & 255;
    const u = fade(x);
    const v = fade(y);
    const a = perm[X]! + Y;
    const b = perm[X + 1]! + Y;
    const n00 = grad(perm[a]!, x, y);
    const n10 = grad(perm[b]!, x - 1, y);
    const n01 = grad(perm[a + 1]!, x, y - 1);
    const n11 = grad(perm[b + 1]!, x - 1, y - 1);
    return lerp(v, lerp(u, n00, n10), lerp(u, n01, n11));
  };
}
