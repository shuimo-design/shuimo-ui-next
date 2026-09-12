/**
 * 毛边：手工宣纸的边不是被咬出来的缺口，是纸浆在帘子边上越来越薄、纤维一根根散出去。
 * 所以遮罩分三层：
 *   1. 撕口轮廓——每条边一段中点位移的分形曲线（低频起伏 + 越来越细的抖动），内部实心；
 *   2. 轮廓外面一圈半透明的薄纸，模糊掉；
 *   3. 沿轮廓每两三个像素伸出一根细纤维，长短、角度、粗细、深浅都随机，少数特别长。
 * 遮罩按元素实际尺寸生成（组件按 32px 分桶），纤维才是真实的像素尺度；旧做法把 400px 的位移
 * 遮罩横向拉到上千像素，起伏被拉成一个个圆缺口，就是"狗啃"的来源。
 */
import { compactPath, fmt, svgToDataUrl, type Point } from "../assets/brush";
import { createNoise1D, createRng, type Rng } from "../random";

export interface DeckleMaskOptions {
  seed?: number;
  /** 毛边幅度 0–1，默认 0.5 */
  amount?: number;
  /** 遮罩尺寸 px，默认 400 × 400；组件会按元素尺寸传 */
  width?: number;
  height?: number;
}

const cache = new Map<string, string>();

function gaussian(rng: Rng): number {
  const u = Math.max(rng(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/** 一条边的撕口深度曲线：中点位移分形，hurst 越低越碎 */
function tearProfile(
  length: number,
  baseInset: number,
  roughness: number,
  hurst: number,
  rng: Rng,
): number[] {
  let size = 1;
  while (size < length) size *= 2;
  const arr = Array.from({ length: size + 1 }, () => 0);
  arr[0] = baseInset * (0.6 + rng() * 0.7);
  arr[size] = baseInset * (0.6 + rng() * 0.7);
  let stride = size;
  let sigma = baseInset * roughness;
  const decay = Math.pow(2, -hurst);
  while (stride > 1) {
    const half = stride / 2;
    for (let i = half; i < size; i += stride) {
      const avg = (arr[i - half]! + arr[i + half]!) / 2;
      arr[i] = Math.max(0.5, avg + gaussian(rng) * sigma);
    }
    stride = half;
    sigma *= decay;
  }
  arr.length = length + 1;
  return arr;
}

/** 十分之一像素网格上的整数坐标：纤维用相对增量写，增量在整数上做差就不会漂 */
const grid = (v: number) => Math.round(v * 10);
const n = (t: number) => fmt(t / 10);
/** path 数据里负数自带分隔，前面不用再加空格 */
const sep = (s: string) => (s.startsWith("-") ? s : ` ${s}`);

export function deckleMaskUrl(options: DeckleMaskOptions = {}): string {
  const seed = options.seed ?? 1;
  const amount = Math.min(1, Math.max(0, options.amount ?? 0.5));
  const W = Math.max(32, Math.round(options.width ?? 400));
  const H = Math.max(32, Math.round(options.height ?? 400));
  const key = `${seed}:${amount}:${W}x${H}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const rng = createRng(seed * 7 + 2801);
  const jitter = createNoise1D(createRng(seed * 11 + 2803), 256);
  const baseInset = 5 + amount * 9;
  const hurst = Math.max(0.4, 0.85 - amount * 0.35);
  const roughness = 0.35 + amount * 0.55;
  const top = tearProfile(W, baseInset, roughness, hurst, rng);
  const bottom = tearProfile(W, baseInset, roughness, hurst, rng);
  const left = tearProfile(H, baseInset, roughness, hurst, rng);
  const right = tearProfile(H, baseInset, roughness, hurst, rng);

  // 轮廓点顺时针：上边从左到右，右边从上到下，下边从右到左，左边从下到上；带一点高频抖动
  type P = { x: number; y: number; nx: number; ny: number };
  const pts: P[] = [];
  const STEP = 2;
  const fine = (t: number) => jitter(t * 0.35) * 1.2;
  for (let x = 0; x <= W; x += STEP)
    pts.push({ x, y: top[Math.min(x, W)]! + fine(x), nx: 0, ny: -1 });
  for (let y = 0; y <= H; y += STEP)
    pts.push({ x: W - right[Math.min(y, H)]! - fine(y + W), y, nx: 1, ny: 0 });
  for (let x = W; x >= 0; x -= STEP)
    pts.push({ x, y: H - bottom[Math.min(x, W)]! - fine(x + W + H), nx: 0, ny: 1 });
  for (let y = H; y >= 0; y -= STEP)
    pts.push({ x: left[Math.min(y, H)]! + fine(y + 2 * W + H), y, nx: -1, ny: 0 });
  // 轮廓要画两遍（模糊的薄纸圈 + 实心），只写一次放 defs 里引用，坐标用相对增量
  const outline = compactPath(
    pts.map((p) => [p.x, p.y] as Point),
    true,
  );

  // 纤维：按粗细 × 深浅分成几组合并成 path，省体积
  const groups = new Map<string, string[]>();
  const lengthScale = 0.6 + amount * 0.9;
  for (let i = 0; i < pts.length; i += 1) {
    if (rng() > 0.85) continue;
    const p = pts[i]!;
    // 起点略微缩进撕口里面，纤维是从纸里长出来的
    const sx = p.x - p.nx * 1.2 + (rng() - 0.5) * 1.5;
    const sy = p.y - p.ny * 1.2 + (rng() - 0.5) * 1.5;
    const long = rng() < 0.08;
    const len = (1.5 + rng() * 5) * lengthScale * (long ? 2.4 : 1);
    const angle = Math.atan2(p.ny, p.nx) + (rng() - 0.5) * 1;
    const ex = sx + Math.cos(angle) * len;
    const ey = sy + Math.sin(angle) * len;
    // 三成纤维弯一下：控制点往切线方向偏
    const bend = rng() < 0.3 ? (rng() - 0.5) * len * 0.8 : 0;
    const cx = (sx + ex) / 2 + p.ny * bend;
    const cy = (sy + ey) / 2 - p.nx * bend;
    const width = [0.4, 0.65, 0.95][Math.floor(rng() * 3)]!;
    const opacity = [0.35, 0.6, 0.85][Math.floor(rng() * 3)]!;
    const gsx = grid(sx);
    const gsy = grid(sy);
    const d = bend
      ? `M${n(gsx)} ${n(gsy)}q${n(grid(cx) - gsx)}${sep(n(grid(cy) - gsy))}${sep(n(grid(ex) - gsx))}${sep(n(grid(ey) - gsy))}`
      : `M${n(gsx)} ${n(gsy)}l${n(grid(ex) - gsx)}${sep(n(grid(ey) - gsy))}`;
    const k = `${width}|${opacity}`;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(d);
  }
  let fibers = "";
  for (const [k, ds] of groups) {
    const [w, o] = k.split("|");
    fibers += `<path d="${ds.join("")}" fill="none" stroke="#000" stroke-width="${w}" stroke-opacity="${o}" stroke-linecap="round"/>`;
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<defs><filter id="s" x="-2%" y="-2%" width="104%" height="104%"><feGaussianBlur stdDeviation="1.1"/></filter><path id="o" d="${outline}"/></defs>` +
    // 薄纸圈：轮廓外扩 3px 的半透明、模糊
    `<use href="#o" fill="#000" fill-opacity="0.45" stroke="#000" stroke-width="6" stroke-opacity="0.45" stroke-linejoin="round" filter="url(#s)"/>` +
    fibers +
    `<use href="#o" fill="#000"/>` +
    `</svg>`;
  const url = svgToDataUrl(svg);
  cache.set(key, url);
  return url;
}
