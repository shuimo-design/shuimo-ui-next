/**
 * 「一笔」原语：把任意折线采样成带法线的中心线，再画成变宽、带飞白的墨带多边形。
 * 所有素材（边框、分割线、勾选记号、山脊）都从这里长出来。颜色一律画黑，
 * 使用方当 alpha 遮罩，墨色由 CSS 变量决定。
 */
import { createNoise1D, type Rng } from "../random";

export type Point = [number, number];

export interface BrushPath {
  /** 采样后的中心线 */
  center: Point[];
  /** 每个中心点处的单位法线 */
  normal: Point[];
  /** 含出头的总长 px */
  length: number;
}

export interface SamplePathOptions {
  /** 手抖幅度 px，默认 0 */
  wobble?: number;
  /** 首尾出头 px，默认 0 */
  overshoot?: number;
  /** 采样间距 px，默认 6 */
  spacing?: number;
}

function polylineLength(points: Point[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(points[i]![0] - points[i - 1]![0], points[i]![1] - points[i - 1]![1]);
  }
  return length;
}

/** 折线按弧长均匀重采样，并给每个点算切线法线；可选出头与手抖 */
export function samplePath(points: Point[], rng: Rng, options: SamplePathOptions = {}): BrushPath {
  const wobble = options.wobble ?? 0;
  const overshoot = options.overshoot ?? 0;
  const spacing = options.spacing ?? 6;
  const src = points.map((p) => [p[0], p[1]] as Point);
  if (overshoot > 0 && src.length >= 2) {
    const [a, b] = [src[0]!, src[1]!];
    const [y, z] = [src[src.length - 2]!, src[src.length - 1]!];
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const l2 = Math.hypot(z[0] - y[0], z[1] - y[1]) || 1;
    src[0] = [a[0] - ((b[0] - a[0]) / l1) * overshoot, a[1] - ((b[1] - a[1]) / l1) * overshoot];
    src[src.length - 1] = [
      z[0] + ((z[0] - y[0]) / l2) * overshoot,
      z[1] + ((z[1] - y[1]) / l2) * overshoot,
    ];
  }
  const total = polylineLength(src) || 1;
  const steps = Math.max(14, Math.min(200, Math.round(total / spacing)));
  const phase = rng() * Math.PI * 2;
  const freq = 1 + rng() * 1.5;
  const noise = createNoise1D(rng, 32);

  // 弧长 → 点
  const cum: number[] = [0];
  for (let i = 1; i < src.length; i++)
    cum.push(cum[i - 1]! + Math.hypot(src[i]![0] - src[i - 1]![0], src[i]![1] - src[i - 1]![1]));
  let seg = 0;
  const raw: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const d = (i / steps) * total;
    while (seg < src.length - 2 && cum[seg + 1]! < d) seg++;
    const a = src[seg]!;
    const b = src[seg + 1]!;
    const span = cum[seg + 1]! - cum[seg]! || 1;
    const u = Math.min(1, Math.max(0, (d - cum[seg]!) / span));
    raw.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  const center: Point[] = [];
  const normal: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const p0 = raw[Math.max(0, i - 1)]!;
    const p1 = raw[Math.min(steps, i + 1)]!;
    const tx = p1[0] - p0[0];
    const ty = p1[1] - p0[1];
    const tl = Math.hypot(tx, ty) || 1;
    const nx = -ty / tl;
    const ny = tx / tl;
    const t = i / steps;
    const w = (Math.sin(t * Math.PI * freq + phase) * 0.6 + noise(t * 6) * 0.5) * wobble;
    const p = raw[i]!;
    center.push([p[0] + nx * w, p[1] + ny * w]);
    normal.push([nx, ny]);
  }
  return { center, normal, length: total };
}

/** 一笔的宽度轮廓：起笔略按、中段匀、收笔轻收 */
export function calligraphicProfile(t: number): number {
  const taper = Math.sin(t * Math.PI) ** 0.3;
  const head = t < 0.12 ? 1 + (0.12 - t) * 1.6 : 1;
  return (0.55 + 0.45 * taper) * head;
}

/** 匀宽轮廓：分割线、轨道这类不要明显起收笔的线 */
export function evenProfile(t: number): number {
  return 0.85 + 0.15 * Math.sin(t * Math.PI) ** 0.2;
}

export interface BrushOptions {
  /** 笔宽 px */
  strokeWidth: number;
  /** 边缘噪声 0–1，默认 0.5 */
  roughness?: number;
  /** 飞白 0–1，默认 0.12 */
  flyingWhite?: number;
  /** 墨带条数，默认 4 */
  ribbons?: number;
  /** 宽度轮廓，默认 calligraphicProfile */
  profile?: (t: number) => number;
}

export function fmt(n: number): string {
  return tenths(Math.round(n * 10));
}

/**
 * 十分之一像素为单位的整数 → 最短写法："12.0"→"12"、"0.5"→".5"、"-0"→"0"。
 * 素材里七成半的字节是坐标数字，这一步不改任何位置、只省字符
 */
function tenths(t: number): string {
  if (t === 0) return "0";
  const neg = t < 0;
  const abs = Math.abs(t);
  const int = Math.floor(abs / 10);
  const frac = abs % 10;
  const body = frac === 0 ? `${int}` : int === 0 ? `.${frac}` : `${int}.${frac}`;
  return neg ? `-${body}` : body;
}

/**
 * 一串点写成最紧凑的 path 数据：起点用绝对坐标 M，之后全用相对增量 l（增量在十分之一像素网格上做整数差，
 * 不会累积漂移，落点和逐个写绝对坐标完全一样）；负数前面不用分隔符。close 为 true 补 z（等价于 polygon）。
 * 一条 300px 的笔触线这样写比 polygon points 少一半字节
 */
export function compactPath(points: Point[], close: boolean): string {
  if (points.length === 0) return "";
  const [x0, y0] = points[0] ?? [0, 0];
  let px = Math.round(x0 * 10);
  let py = Math.round(y0 * 10);
  let d = `M${tenths(px)} ${tenths(py)}`;
  if (points.length > 1) d += "l";
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i] ?? [0, 0];
    const cx = Math.round(x * 10);
    const cy = Math.round(y * 10);
    const dx = tenths(cx - px);
    const dy = tenths(cy - py);
    d += `${i > 1 && !dx.startsWith("-") ? " " : ""}${dx}${dy.startsWith("-") ? "" : " "}${dy}`;
    px = cx;
    py = cy;
  }
  return close ? `${d}z` : d;
}

/**
 * 把一笔画成若干墨带：每条墨带是宽度区间 [a, b] 上的多边形，
 * 外侧墨带按飞白概率沿绝对长度断开（约每 30px 一个起伏），断口更多出现在笔的后半段。
 */
export function paintBrush(path: BrushPath, options: BrushOptions, rng: Rng): string {
  const { strokeWidth } = options;
  const roughness = options.roughness ?? 0.5;
  const flyingWhite = options.flyingWhite ?? 0.12;
  const ribbons = options.ribbons ?? 4;
  const profile = options.profile ?? calligraphicProfile;
  const n = path.center.length;
  const edgeNoiseL = createNoise1D(rng, 32);
  const edgeNoiseR = createNoise1D(rng, 32);
  const widthNoise = createNoise1D(rng, 16);
  const left: number[] = [];
  const right: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const base = (strokeWidth / 2) * profile(t) * (1 + roughness * 0.3 * widthNoise(t * 4));
    const jitter = roughness * strokeWidth * 0.22;
    left.push(Math.max(0.2, base + edgeNoiseL(t * 14) * jitter));
    right.push(Math.max(0.2, base + edgeNoiseR(t * 14) * jitter));
  }
  const parts: string[] = [];
  for (let k = 0; k < ribbons; k++) {
    const a = -1 + (2 * k) / ribbons;
    const b = -1 + (2 * (k + 1)) / ribbons;
    const gapNoise = createNoise1D(rng, 24);
    const alpha = 0.82 + rng() * 0.18;
    const outer = k === 0 || k === ribbons - 1 ? 1 : 0.35;
    let run: number[] = [];
    const flush = () => {
      if (run.length < 2) {
        run = [];
        return;
      }
      const l: Point[] = [];
      const r: Point[] = [];
      for (const i of run) {
        const [cx, cy] = path.center[i]!;
        const [nx, ny] = path.normal[i]!;
        const offA = a < 0 ? -left[i]! * -a : right[i]! * a;
        const offB = b < 0 ? -left[i]! * -b : right[i]! * b;
        l.push([cx + nx * offA, cy + ny * offA]);
        r.push([cx + nx * offB, cy + ny * offB]);
      }
      // 墨带是闭合多边形，写成相对坐标的 path 比 polygon 省一半字节，画出来一样
      parts.push(
        `<path d="${compactPath([...l, ...r.reverse()], true)}" fill="#000" fill-opacity="${alpha.toFixed(2)}"/>`,
      );
      run = [];
    };
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const dry = flyingWhite * outer * (0.35 + 0.65 * t);
      const gap = gapNoise((t * path.length) / 30) > 1 - dry * 1.7;
      if (gap) flush();
      else run.push(i);
    }
    flush();
  }
  return parts.join("");
}

/** 一团墨：半径被噪声调制的多边形，raggedness 越大边越毛 */
export function blobPoints(
  cx: number,
  cy: number,
  r: number,
  rng: Rng,
  raggedness = 0.12,
  count = 48,
): string {
  const noise = createNoise1D(rng, 16);
  const phase = rng() * 10;
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const k =
      1 +
      noise(phase + (i / count) * 8) * raggedness +
      noise(phase + 50 + (i / count) * 20) * raggedness * 0.4;
    pts.push(`${fmt(cx + Math.cos(a) * r * k)} ${fmt(cy + Math.sin(a) * r * k)}`);
  }
  return pts.join(" ");
}

export interface BleedOptions {
  frequency?: number;
  scale?: number;
  blur?: number;
}

/** 晕染滤镜：feTurbulence 位移 + 微模糊 */
export function bleedFilter(id: string, seed: number, options: BleedOptions = {}): string {
  return (
    `<filter id="${id}" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${options.frequency ?? 0.06}" numOctaves="2" seed="${seed}" result="n"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="${options.scale ?? 2.5}" xChannelSelector="R" yChannelSelector="G" result="d"/>` +
    `<feGaussianBlur in="d" stdDeviation="${options.blur ?? 0.35}"/></filter>`
  );
}

export interface SvgDocOptions {
  width: number;
  height: number;
  viewBox?: string;
  preserveAspectRatio?: string;
}

export function svgDoc(options: SvgDocOptions, inner: string): string {
  const viewBox = options.viewBox ?? `0 0 ${options.width} ${options.height}`;
  const par = options.preserveAspectRatio
    ? ` preserveAspectRatio="${options.preserveAspectRatio}"`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${options.width}" height="${options.height}" viewBox="${viewBox}"${par}>${inner}</svg>`;
}

/** 转成可放进 CSS url() 的 data URL（不用 base64，可读且更小） */
export function svgToDataUrl(svg: string): string {
  const encoded = svg
    .replace(/\s+/g, " ")
    .replace(/"/g, "'")
    .replace(/%/g, "%25")
    .replace(/#/g, "%23")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/&/g, "%26");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}
