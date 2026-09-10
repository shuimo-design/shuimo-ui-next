/**
 * 格子的四边形几何：四条边各有一个倾斜角，算出四个角点。
 * 倾斜的边绕"能让四边形留在盒子里"的那个端点转，另一端往盒子里收，
 * 这样相邻格子只要错开 h·tanθ 就能拼出一道平行的斜缝（MGrid 的 gapRotate 就靠这个）。
 */
import type { Point } from "../../ink/assets/brush";
import type { CellAngle } from "./types";

export interface CellAngles {
  /** 上 */
  a: number;
  /** 右 */
  b: number;
  /** 下 */
  c: number;
  /** 左 */
  d: number;
}

/** 角度太接近 90° 时 tan 会爆掉，四边形没意义，钳在 ±80° */
const MAX_DEG = 80;

export function parseAngle(value: CellAngle | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const n = typeof value === "number" ? value : Number(String(value).trim().replace(/deg$/i, ""));
  if (!Number.isFinite(n)) return undefined;
  return Math.max(-MAX_DEG, Math.min(MAX_DEG, n));
}

/** points 简写 + a/b/c/d 覆盖，合成四个角度；都没传就是 0 */
export function resolveAngles(input: {
  points?: CellAngle;
  a?: CellAngle;
  b?: CellAngle;
  c?: CellAngle;
  d?: CellAngle;
}): CellAngles {
  let base: [number, number, number, number] = [0, 0, 0, 0];
  if (typeof input.points === "number") {
    const n = parseAngle(input.points) ?? 0;
    base = [n, n, n, n];
  } else if (typeof input.points === "string" && input.points.trim() !== "") {
    const tokens = input.points
      .trim()
      .split(/\s+/)
      .map((t) => parseAngle(t) ?? 0);
    const [t0 = 0, t1 = t0, t2 = t0, t3 = t1] = tokens;
    // 同 CSS：1 个全用，2 个上下 / 左右，3 个上 / 左右 / 下，4 个上右下左
    base = tokens.length === 3 ? [t0, t1, t2, t1] : [t0, t1, t2, t3];
  }
  return {
    a: parseAngle(input.a) ?? base[0],
    b: parseAngle(input.b) ?? base[1],
    c: parseAngle(input.c) ?? base[2],
    d: parseAngle(input.d) ?? base[3],
  };
}

export function isTilted(angles: CellAngles): boolean {
  return angles.a !== 0 || angles.b !== 0 || angles.c !== 0 || angles.d !== 0;
}

function tan(deg: number): number {
  return Math.tan((deg * Math.PI) / 180);
}

type Line = [Point, Point];

/** 两条直线的交点；平行时退回 fallback */
function intersect(l1: Line, l2: Line, fallback: Point): Point {
  const [[x1, y1], [x2, y2]] = l1;
  const [[x3, y3], [x4, y4]] = l2;
  const det = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(det) < 1e-6) return fallback;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / det;
  return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
}

/** 四个角点：左上、右上、右下、左下，盒子坐标系 px */
export function quadPoints(w: number, h: number, angles: CellAngles): [Point, Point, Point, Point] {
  const { a, b, c, d } = angles;
  // 上边：正值右端下沉（钉住左上角），负值左端下沉（钉住右上角）
  const top: Line =
    a >= 0
      ? [
          [0, 0],
          [w, w * tan(a)],
        ]
      : [
          [0, w * tan(-a)],
          [w, 0],
        ];
  // 右边：正值 "/"，下端左移（钉住右上角）；负值 "\"，上端左移（钉住右下角）
  const right: Line =
    b >= 0
      ? [
          [w, 0],
          [w - h * tan(b), h],
        ]
      : [
          [w - h * tan(-b), 0],
          [w, h],
        ];
  // 下边：正值左端上抬（钉住右下角）；负值右端上抬（钉住左下角）
  const bottom: Line =
    c >= 0
      ? [
          [0, h - w * tan(c)],
          [w, h],
        ]
      : [
          [0, h],
          [w, h - w * tan(-c)],
        ];
  // 左边：正值 "/"，上端右移（钉住左下角）；负值 "\"，下端右移（钉住左上角）
  const left: Line =
    d >= 0
      ? [
          [h * tan(d), 0],
          [0, h],
        ]
      : [
          [0, 0],
          [h * tan(-d), h],
        ];
  return [
    intersect(top, left, top[0]),
    intersect(top, right, top[1]),
    intersect(right, bottom, bottom[1]),
    intersect(bottom, left, bottom[0]),
  ];
}

function px(n: number): string {
  return `${Math.round(n * 100) / 100}px`;
}

/** clip-path 用的 polygon() */
export function polygonClip(points: Point[]): string {
  return `polygon(${points.map(([x, y]) => `${px(x)} ${px(y)}`).join(", ")})`;
}

/** 相邻格子要错开的距离：斜缝在高度 h 上横向偏了 h·tan|θ| */
export function tiltShift(h: number, deg: number): number {
  return h * Math.abs(tan(deg));
}
