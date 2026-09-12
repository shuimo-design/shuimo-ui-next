/**
 * 印章外形：把方 / 长方 / 圆 / 椭圆 / 多边形都算成一圈顶点（外圈 + 内圈），
 * 后面磨损、裁切、界格都在这组顶点上做，不区分形状。
 */
import type { Rng } from "../random";

export type Point = [number, number];
export type Ring = Point[];

export type StampShape = "auto" | "square" | "rect" | "circle" | "ellipse" | "polygon";
export type PolygonOrientation = "flat-top" | "point-top";

export interface BorderRings {
  outer: Ring;
  inner: Ring;
  thickness: number;
}

export interface BorderOptions {
  width: number;
  height: number;
  thickness: number;
  /** 圆角半径，0 为直角；每个角再随机 ±20%，刻出来的章四角本来就不一样 */
  cornerRadius?: number;
  /** 多边形边数（shape 为 polygon 时用），最少 3 */
  sides?: number;
  /** 多边形朝向：flat-top 一条边水平在上，point-top 一个顶点朝上 */
  orientation?: PolygonOrientation;
  rng?: Rng;
}

export function buildBorder(shape: StampShape, opts: BorderOptions): BorderRings {
  switch (shape) {
    case "circle":
    case "ellipse":
      return ellipseBorder(opts);
    case "polygon":
      return polygonBorder(opts, opts.sides ?? 6, opts.orientation ?? "flat-top");
    default:
      return rectBorder(opts);
  }
}

type CornerRadii = [number, number, number, number];

function randomizeCornerRadii(base: number, rng?: Rng): CornerRadii {
  if (base <= 0 || !rng) return [base, base, base, base];
  const jitter = () => base * (0.8 + rng() * 0.4);
  return [jitter(), jitter(), jitter(), jitter()];
}

function arcPoints(
  ring: Ring,
  cx: number,
  cy: number,
  r: number,
  startA: number,
  endA: number,
  segs: number,
): void {
  for (let i = 0; i <= segs; i++) {
    const a = startA + ((endA - startA) * i) / segs;
    ring.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
}

/** 顺时针（屏幕坐标）的圆角矩形；四角半径都是 0 时退化成四个顶点 */
function roundedRectRing(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  radii: CornerRadii,
  segs: number,
): Ring {
  const half = Math.min(x2 - x1, y2 - y1) / 2;
  const [rtl, rtr, rbr, rbl] = radii.map((v) => Math.max(0, Math.min(v, half))) as CornerRadii;
  if (rtl + rtr + rbr + rbl <= 0) {
    return [
      [x1, y1],
      [x2, y1],
      [x2, y2],
      [x1, y2],
    ];
  }
  const ring: Ring = [];
  arcPoints(ring, x1 + rtl, y1 + rtl, rtl, Math.PI, Math.PI * 1.5, segs);
  arcPoints(ring, x2 - rtr, y1 + rtr, rtr, Math.PI * 1.5, Math.PI * 2, segs);
  arcPoints(ring, x2 - rbr, y2 - rbr, rbr, 0, Math.PI * 0.5, segs);
  arcPoints(ring, x1 + rbl, y2 - rbl, rbl, Math.PI * 0.5, Math.PI, segs);
  return ring;
}

export function rectBorder(opts: BorderOptions): BorderRings {
  const { width: w, height: h, thickness } = opts;
  const segs = 8;
  const radii = randomizeCornerRadii(opts.cornerRadius ?? 0, opts.rng);
  const outer = roundedRectRing(0, 0, w, h, radii, segs);
  const innerRadii = radii.map((v) => Math.max(0, v - thickness)) as CornerRadii;
  const inner = roundedRectRing(
    thickness,
    thickness,
    w - thickness,
    h - thickness,
    innerRadii,
    segs,
  );
  return { outer, inner, thickness };
}

export function ellipseBorder(opts: BorderOptions): BorderRings {
  const { width: w, height: h, thickness } = opts;
  const segments = 96;
  const cx = w / 2;
  const cy = h / 2;
  const rxInner = Math.max(0, cx - thickness);
  const ryInner = Math.max(0, cy - thickness);
  const outer: Ring = [];
  const inner: Ring = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2 - Math.PI / 2;
    outer.push([cx + Math.cos(a) * cx, cy + Math.sin(a) * cy]);
    inner.push([cx + Math.cos(a) * rxInner, cy + Math.sin(a) * ryInner]);
  }
  return { outer, inner, thickness };
}

/** 正多边形顶点落在内切椭圆上，宽高不等时就是拉长的多边形；内圈沿半径整体缩进 thickness */
export function polygonBorder(
  opts: BorderOptions,
  sides: number,
  orientation: PolygonOrientation,
): BorderRings {
  const { width: w, height: h, thickness } = opts;
  const n = Math.max(3, Math.floor(sides));
  const cx = w / 2;
  const cy = h / 2;
  const baseRotation = -Math.PI / 2;
  const rotation = orientation === "flat-top" ? baseRotation + Math.PI / n : baseRotation;
  const rxInner = Math.max(0, cx - thickness);
  const ryInner = Math.max(0, cy - thickness);
  const outer: Ring = [];
  const inner: Ring = [];
  for (let i = 0; i < n; i++) {
    const a = rotation + (i / n) * Math.PI * 2;
    outer.push([cx + Math.cos(a) * cx, cy + Math.sin(a) * cy]);
    inner.push([cx + Math.cos(a) * rxInner, cy + Math.sin(a) * ryInner]);
  }
  return { outer, inner, thickness };
}

export function ringBBox(ring: Ring): { x1: number; y1: number; x2: number; y2: number } {
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const [x, y] of ring) {
    if (x < x1) x1 = x;
    if (x > x2) x2 = x;
    if (y < y1) y1 = y;
    if (y > y2) y2 = y;
  }
  return { x1, y1, x2, y2 };
}

export function fmt(v: number): string {
  if (Math.abs(v) < 1e-6) return "0";
  if (Math.round(v) === v) return String(Math.round(v));
  return v.toFixed(2);
}

export function ringToPath(ring: Ring): string {
  if (ring.length === 0) return "";
  const first = ring[0]!;
  let s = `M${fmt(first[0])} ${fmt(first[1])}`;
  for (let i = 1; i < ring.length; i++) {
    const p = ring[i]!;
    s += `L${fmt(p[0])} ${fmt(p[1])}`;
  }
  return `${s}Z`;
}

export function ringsToPath(rings: Ring[]): string {
  return rings.map(ringToPath).filter(Boolean).join(" ");
}
