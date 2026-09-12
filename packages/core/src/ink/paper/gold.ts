/**
 * 洒金：按 shuimo-core 的宣纸洒金算法移植。真实的洒金宣一张纸上有成千上万粒金，
 * 绝大多数是金粉（三到五个顶点的小片），少数是金箔碎片（不规则多边形，带弧边），
 * 大片周围再溅几粒卫星金粉；位置一部分均匀散、一部分往几个椭圆簇里靠。
 * 这里输出一张可平铺的 SVG（贴边的金粒在对边补一份），当 background-image 叠在纸纹上。
 */
import { fmt, svgToDataUrl } from "../assets/brush";
import { createRng, type Rng } from "../random";

export type GoldPreset = "gold" | "paleGold" | "roseGold" | "copper" | "silver" | "bronze";

export const GOLD_PRESETS: Record<GoldPreset, [number, number, number]> = {
  gold: [218, 165, 32],
  paleGold: [238, 201, 0],
  roseGold: [183, 110, 121],
  copper: [184, 115, 51],
  silver: [192, 192, 192],
  bronze: [205, 127, 50],
};

export interface GoldFleckOptions {
  seed?: number;
  /** 平铺单元边长 px，默认 768：簇是大尺度特征，单元太小会看出重复 */
  size?: number;
  /** 密度 0 ~ 1，默认 0.15（shuimo-core 单张纸的默认是 0.5，铺整站背景像撒了彩纸） */
  density?: number;
  /** 金粒尺寸范围 px，默认 [1, 7]：金粉为主，偶尔几片金箔 */
  sizeRange?: [number, number];
  /** 金色预设或 RGB，默认 gold */
  color?: GoldPreset | [number, number, number];
  /** 成簇程度 0 ~ 1，默认 0.3 */
  clustering?: number;
}

export type GoldCommand =
  | { type: "M"; x: number; y: number }
  | { type: "L"; x: number; y: number }
  | { type: "Q"; cpx: number; cpy: number; x: number; y: number }
  | { type: "Z" };

export interface GoldFleck {
  commands: GoldCommand[];
  /** 平铺补份的偏移；第一份总是 (0, 0) */
  copies: { x: number; y: number }[];
  color: [number, number, number];
  alpha: number;
  /** 大片金箔（true）还是金粉 */
  flake: boolean;
}

interface Cluster {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  angle: number;
  sizeBias: number;
  toneBias: number;
}

interface Accepted {
  x: number;
  y: number;
  size: number;
}

const TWO_PI = Math.PI * 2;
const SEED_GOLD = 2203;
const DEFAULT_DENSITY = 0.15;
const DEFAULT_SIZE_RANGE: [number, number] = [1, 7];

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** 金箔碎片：5 ~ 11 个顶点，半径、切向、径向都抖，三成的边换成弧线 */
function flakeCommands(x: number, y: number, size: number, rng: Rng): GoldCommand[] {
  const pointCount = 5 + Math.floor(rng() * 7);
  const weights = Array.from({ length: pointCount }, () => 0.4 + rng());
  const total = weights.reduce((s, v) => s + v, 0);
  let angle = rng() * TWO_PI;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < pointCount; i++) {
    angle += (weights[i]! / total) * TWO_PI;
    const radius = size * (0.34 + rng() * 0.9);
    const tangent = (rng() - 0.5) * size * 0.45;
    const radial = (rng() - 0.5) * size * 0.22;
    points.push({
      x: x + Math.cos(angle) * (radius + radial) + Math.cos(angle + Math.PI / 2) * tangent,
      y: y + Math.sin(angle) * (radius + radial) + Math.sin(angle + Math.PI / 2) * tangent,
    });
  }
  const first = points[0]!;
  const commands: GoldCommand[] = [{ type: "M", x: first.x, y: first.y }];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const p = points[i]!;
    if (rng() < 0.35) {
      commands.push({
        type: "Q",
        cpx: (prev.x + p.x) / 2 + (rng() - 0.5) * size * 0.24,
        cpy: (prev.y + p.y) / 2 + (rng() - 0.5) * size * 0.24,
        x: p.x,
        y: p.y,
      });
    } else {
      commands.push({ type: "L", x: p.x, y: p.y });
    }
  }
  commands.push({ type: "Z" });
  return commands;
}

/** 金粉：3 ~ 5 条直边、接近圆，数量成千上万所以要便宜 */
function dustCommands(x: number, y: number, size: number, rng: Rng): GoldCommand[] {
  const pointCount = 3 + Math.floor(rng() * 3);
  const start = rng() * TWO_PI;
  const commands: GoldCommand[] = [];
  for (let i = 0; i < pointCount; i++) {
    const theta = start + (i / pointCount) * TWO_PI + (rng() - 0.5) * 0.6;
    const radius = size * (0.65 + rng() * 0.55);
    const px = x + Math.cos(theta) * radius;
    const py = y + Math.sin(theta) * radius;
    commands.push(i === 0 ? { type: "M", x: px, y: py } : { type: "L", x: px, y: py });
  }
  commands.push({ type: "Z" });
  return commands;
}

/** 贴边的金粒在对边（和对角）补一份，平铺时接缝处不会缺半粒 */
function wrapCopies(
  x: number,
  y: number,
  size: number,
  margin: number,
): { x: number; y: number }[] {
  const copies = [{ x: 0, y: 0 }];
  const right = x + margin > size;
  const bottom = y + margin > size;
  const left = x - margin < 0;
  const top = y - margin < 0;
  if (right) copies.push({ x: -size, y: 0 });
  if (bottom) copies.push({ x: 0, y: -size });
  if (left) copies.push({ x: size, y: 0 });
  if (top) copies.push({ x: 0, y: size });
  if (right && bottom) copies.push({ x: -size, y: -size });
  if (right && top) copies.push({ x: -size, y: size });
  if (left && bottom) copies.push({ x: size, y: -size });
  if (left && top) copies.push({ x: size, y: size });
  return copies;
}

function wrap(v: number, max: number): number {
  return v < 0 ? v + max : v >= max ? v - max : v;
}

function createClusters(
  size: number,
  sizeMax: number,
  clustering: number,
  rng: Rng,
  totalCount: number,
): Cluster[] {
  const weight = clamp(clustering * 1.15 + 0.08, 0.08, 1);
  const clustered = Math.round(totalCount * (0.28 + weight * 0.5));
  if (clustered <= 0) return [];
  const resolutionScale = Math.sqrt((size * size) / (800 * 600));
  const avgPerCluster = mix(2.4, 7.8 + Math.log2(resolutionScale + 1.5), weight);
  const count = Math.max(1, Math.round(clustered / avgPerCluster));
  const spacing = Math.sqrt((size * size) / count);
  const minRadius = Math.max(sizeMax * 2.2, size * 0.025);
  const maxRadius = Math.max(minRadius + 1, size * (0.08 + weight * 0.16));
  return Array.from({ length: count }, () => {
    const radiusBase = clamp(
      spacing * (0.12 + weight * 0.14) * (0.72 + rng() * 0.86),
      minRadius,
      maxRadius,
    );
    const elliptic = 0.55 + rng() * 1.35;
    return {
      x: rng() * size,
      y: rng() * size,
      radiusX: radiusBase * elliptic,
      radiusY: radiusBase / elliptic,
      angle: rng() * TWO_PI,
      sizeBias: 0.84 + rng() * 0.42,
      toneBias: 0.84 + rng() * 0.38,
    };
  });
}

/** 大片之间保持距离，挤在一起的按成簇程度小概率放行 */
function accept(
  list: Accepted[],
  x: number,
  y: number,
  size: number,
  tile: number,
  clustering: number,
  rng: Rng,
): boolean {
  const resolutionScale = Math.sqrt((tile * tile) / (800 * 600));
  const relax = clamp(1.15 - resolutionScale * 0.14, 0.72, 1.15);
  const base = size * (0.8 + rng() * 0.45) * relax;
  for (let i = list.length - 1; i >= 0; i--) {
    const o = list[i]!;
    if (Math.abs(o.x - x) > base * 3 || Math.abs(o.y - y) > base * 3) continue;
    const minDistance = ((o.size + size) * 0.34 + base) * 0.5;
    if (Math.hypot(o.x - x, o.y - y) < minDistance) return rng() < 0.12 + clustering * 0.08;
  }
  return true;
}

function samplePosition(
  tile: number,
  clusters: Cluster[],
  useCluster: boolean,
  rng: Rng,
): { x: number; y: number; cluster: Cluster | null } {
  if (!useCluster || clusters.length === 0)
    return { x: rng() * tile, y: rng() * tile, cluster: null };
  const c = clusters[Math.floor(rng() * clusters.length)]!;
  const theta = rng() * TWO_PI;
  const radial = Math.pow(rng(), 0.52 + rng() * 0.36);
  const lx = Math.cos(theta) * c.radiusX * radial;
  const ly = Math.sin(theta) * c.radiusY * radial;
  const streak = (rng() - 0.5) * Math.max(c.radiusX, c.radiusY) * 0.18;
  const rx =
    lx * Math.cos(c.angle) - ly * Math.sin(c.angle) + Math.cos(c.angle + Math.PI / 2) * streak;
  const ry =
    lx * Math.sin(c.angle) + ly * Math.cos(c.angle) + Math.sin(c.angle + Math.PI / 2) * streak;
  return { x: wrap(c.x + rx, tile), y: wrap(c.y + ry, tile), cluster: c };
}

function tint(color: [number, number, number], brightness: number): [number, number, number] {
  return [
    clamp(Math.round(color[0] * brightness), 0, 255),
    clamp(Math.round(color[1] * brightness), 0, 255),
    clamp(Math.round(color[2] * brightness * 0.92), 0, 255),
  ];
}

export function resolveGoldColor(color: GoldFleckOptions["color"]): [number, number, number] {
  if (Array.isArray(color)) return color;
  return GOLD_PRESETS[color ?? "gold"];
}

/** 生成一个平铺单元里的全部金粒（纯几何，不碰 DOM） */
export function generateGoldFlecks(options: GoldFleckOptions = {}): GoldFleck[] {
  const seed = options.seed ?? 1;
  const tile = options.size ?? 768;
  const density = clamp(options.density ?? DEFAULT_DENSITY, 0, 1);
  if (density <= 0) return [];
  const [rawMin, rawMax] = options.sizeRange ?? DEFAULT_SIZE_RANGE;
  const minSize = clamp(rawMin, 0.5, 32);
  const maxSize = clamp(rawMax, minSize, 48);
  const goldColor = resolveGoldColor(options.color);
  const clustering = clamp(options.clustering ?? 0.3, 0, 1);

  const rng = createRng(seed + SEED_GOLD);
  const area = tile * tile;
  const resolutionScale = Math.sqrt(area / (800 * 600));
  const lowResBoost = clamp(1.18 - resolutionScale * 0.18, 1, 1.18);
  const totalCount = Math.max(
    Math.round(80 * density),
    Math.floor(area * density * 0.003 * lowResBoost),
  );
  const wrapMargin = maxSize * 2.2;
  const clusters = createClusters(tile, maxSize, clustering, rng, totalCount);
  const weight = clamp(clustering * 1.15 + 0.08, 0.08, 1);
  // 大头是均匀散开的，簇只是让局部密一点，不结成团
  const isolatedRatio = clamp(0.9 - weight * 0.35, 0.55, 0.9);
  const lowResSizeBoost = clamp(1.18 - resolutionScale * 0.12, 1, 1.18);
  const flakeThreshold = minSize + (maxSize - minSize) * 0.18;

  // 尺寸单独一条随机流：位置重试不影响尺寸分布。u^4.2 的偏态让约 8% 落到金箔档
  const sizeRng = createRng(seed + SEED_GOLD + 20001);
  const sizes = Array.from({ length: totalCount }, () => {
    const ratio = Math.pow(sizeRng(), 4.2);
    const raw = mix(minSize, maxSize, ratio) * lowResSizeBoost * (0.82 + sizeRng() * 0.32);
    return { size: raw, flake: raw >= flakeThreshold };
  });

  const flecks: GoldFleck[] = [];
  const bigAccepted: Accepted[] = [];
  for (let index = 0; index < totalCount; index++) {
    const { size: targetSize, flake } = sizes[index]!;
    let x = 0;
    let y = 0;
    let toneBias = 1;
    let sizeBias = 1;
    let ok = false;
    const maxAttempts = flake ? 8 : 1;
    for (let attempt = 0; attempt < maxAttempts && !ok; attempt++) {
      const useCluster = clusters.length > 0 && rng() > isolatedRatio;
      const sampled = samplePosition(tile, clusters, useCluster, rng);
      x = sampled.x;
      y = sampled.y;
      if (sampled.cluster) {
        toneBias = sampled.cluster.toneBias;
        sizeBias = sampled.cluster.sizeBias;
      } else {
        toneBias = 0.92 + rng() * 0.2;
        sizeBias = 0.94 + rng() * 0.12;
      }
      ok = !flake || accept(bigAccepted, x, y, targetSize, tile, clustering, rng);
    }
    if (!ok) continue;
    const size = targetSize * sizeBias;
    if (flake) bigAccepted.push({ x, y, size });
    const brightness = (0.78 + rng() * 0.32) * toneBias;
    const boost = rng() < 0.16 ? 1.18 : 1;
    const local = createRng(seed + SEED_GOLD + index * 7);
    flecks.push({
      commands: flake ? flakeCommands(x, y, size, local) : dustCommands(x, y, size, local),
      copies: wrapCopies(x, y, tile, wrapMargin),
      color: tint(goldColor, brightness * boost),
      alpha: flake ? 0.82 + rng() * 0.16 : 0.68 + rng() * 0.22,
      flake,
    });
  }

  // 卫星金粉：大片周围溅几粒，像金箔碎裂时崩出去的
  const satRng = createRng(seed + SEED_GOLD + 70001);
  bigAccepted.forEach((big, i) => {
    if (big.size < flakeThreshold * 1.6) return;
    const count = 2 + Math.floor(satRng() * 4);
    for (let s = 0; s < count; s++) {
      const theta = satRng() * TWO_PI;
      const dist = big.size * (1.2 + satRng() * 2.6);
      const sx = wrap(big.x + Math.cos(theta) * dist, tile);
      const sy = wrap(big.y + Math.sin(theta) * dist, tile);
      const ssize = 0.45 + satRng() * 0.95;
      const brightness = 0.78 + satRng() * 0.22;
      const local = createRng(seed + SEED_GOLD + 70001 + i * 29 + s * 13);
      flecks.push({
        commands: dustCommands(sx, sy, ssize, local),
        copies: wrapCopies(sx, sy, tile, wrapMargin),
        color: tint(goldColor, brightness),
        alpha: 0.6 + satRng() * 0.25,
        flake: false,
      });
    }
  });
  return flecks;
}

/** 十分之一像素网格上的整数坐标；相对增量在整数上做差，不会累积漂移 */
const grid = (v: number) => Math.round(v * 10);
const n = (t: number) => fmt(t / 10);

/** 金粒的 path：起点绝对、之后全是相对增量（l / q），比逐个写绝对坐标省四成字节，落点一样 */
function commandsToPath(commands: GoldCommand[], dx: number, dy: number): string {
  let d = "";
  let px = 0;
  let py = 0;
  for (const c of commands) {
    switch (c.type) {
      case "M": {
        px = grid(c.x + dx);
        py = grid(c.y + dy);
        d += `M${n(px)} ${n(py)}`;
        break;
      }
      case "L": {
        const x = grid(c.x + dx);
        const y = grid(c.y + dy);
        d += `l${n(x - px)} ${n(y - py)}`;
        px = x;
        py = y;
        break;
      }
      case "Q": {
        const x = grid(c.x + dx);
        const y = grid(c.y + dy);
        d += `q${n(grid(c.cpx + dx) - px)} ${n(grid(c.cpy + dy) - py)} ${n(x - px)} ${n(y - py)}`;
        px = x;
        py = y;
        break;
      }
      default:
        d += "Z";
    }
  }
  return d;
}

/** 洒金层的 SVG 内容（不含 <svg> 外壳），同色同透明度的金粒合并成一条 path 省体积 */
export function goldFlecksSvgInner(flecks: GoldFleck[]): string {
  const groups = new Map<string, string[]>();
  for (const f of flecks) {
    const key = `${f.color[0]},${f.color[1]},${f.color[2]}|${f.alpha.toFixed(2)}`;
    const list = groups.get(key) ?? [];
    for (const copy of f.copies) list.push(commandsToPath(f.commands, copy.x, copy.y));
    groups.set(key, list);
  }
  let out = "";
  for (const [key, paths] of groups) {
    const [rgb, alpha] = key.split("|");
    out += `<path fill="rgb(${rgb})" fill-opacity="${alpha}" d="${paths.join("")}"/>`;
  }
  return out;
}

const cache = new Map<string, string>();

/** 洒金层的 data URL，透明底、可平铺，叠在纸纹上面 */
export function goldFleckUrl(options: GoldFleckOptions = {}): string {
  const tile = options.size ?? 768;
  const color = resolveGoldColor(options.color).join(",");
  const key = `${options.seed ?? 1}:${tile}:${options.density ?? DEFAULT_DENSITY}:${(options.sizeRange ?? DEFAULT_SIZE_RANGE).join("-")}:${color}:${options.clustering ?? 0.3}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}" viewBox="0 0 ${tile} ${tile}">` +
    goldFlecksSvgInner(generateGoldFlecks(options)) +
    `</svg>`;
  const url = svgToDataUrl(svg);
  cache.set(key, url);
  return url;
}
