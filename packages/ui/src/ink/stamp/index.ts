/**
 * 印章生成：排版 → 外形 → 磨损 → 滤镜，输出给 MStamp 模板用的几何和滤镜定义。
 * 文字本身不在这里拼字符串——用户文本必须走模板里的 <text>，不能进 v-html。
 *
 * 阳章：文字和边框是印泥色；阴章：整块印泥，文字和界格用 mask 抠成透明，纸色从底下透出来。
 */
import { createRng } from "../random";
import { erodeRings } from "./erosion";
import { inkFilter, textFilter } from "./filters";
import {
  FALLBACK_METRIC,
  layoutStamp,
  type GlyphMeasurer,
  type StampCell,
  type StampDirection,
} from "./layout";
import {
  buildBorder,
  ringToPath,
  ringsToPath,
  type PolygonOrientation,
  type StampShape,
} from "./shape";

export type StampMode = "yin" | "yang";
export type StampCorner = "none" | "round";

export interface StampOptions {
  /** 印文：字符串自动分列；数组每项一列，从右往左 */
  text: string | string[];
  /** 印章高度（px），默认 120 */
  size?: number;
  /** 阳文（朱文）还是阴文（白文），默认阳文 */
  mode?: StampMode;
  shape?: StampShape;
  /** 宽高比，rect / ellipse / polygon 用 */
  aspect?: number;
  /** 多边形边数 */
  sides?: number;
  orientation?: PolygonOrientation;
  seed?: number;
  /** 边框厚度（px），默认 size × 3.5% */
  border?: number;
  corner?: StampCorner;
  cornerRadius?: number;
  /** 边框磨损 0 ~ 1 */
  roughness?: number;
  /** 刀刻 0 ~ 1：文字边缘的崩口和石屑 */
  carving?: number;
  /** 印泥 0 ~ 1：没压实的白斑和边缘起毛 */
  bleed?: number;
  padding?: number;
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  /** 字符串印文分几列，默认按字数取近似方形 */
  columns?: number;
  stretch?: boolean;
  cellHeightMode?: "uniform" | "fit";
  offsetX?: number;
  offsetY?: number;
  direction?: StampDirection;
  /** 阴章里列与列、行与行之间的界格 */
  gridLines?: boolean;
  gridLineWidth?: number;
  /** 滤镜 / mask 的 id 前缀，同页多枚印章要不一样 */
  id: string;
  measure?: GlyphMeasurer;
}

export interface StampGridLine {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface StampRender {
  width: number;
  height: number;
  mode: StampMode;
  fontSize: number;
  cells: StampCell[];
  /** <defs> 里的滤镜（不含用户文字） */
  defs: string;
  ids: { clip: string; mask: string };
  /** 各层用的 filter 属性值，没开就是 undefined */
  filters: { ink?: string; text?: string };
  /** 阳章：外圈 + 内圈（evenodd 成环）；阴章：外圈实心 */
  borderPath: string;
  /** 文字裁切用的平滑内圈（阳章）/ 外圈（阴章） */
  clipPath: string;
  gridLines: StampGridLine[];
  /** 无障碍用的文本（按阅读顺序） */
  label: string;
}

const SALT_SHAPE = 0x5ea1;
const SALT_EROSION = 0xe70510;

/** 字符串印文分列：竖排从右往左、每列从上往下，列数默认取近似方形 */
export function splitColumns(text: string | string[], columns?: number): string[][] {
  if (Array.isArray(text)) return text.map((col) => Array.from(col));
  const chars = Array.from(text);
  const n = chars.length;
  if (n === 0) return [];
  const cols = Math.max(1, columns ?? defaultColumns(n));
  const rows = Math.ceil(n / cols);
  const out: string[][] = [];
  for (let i = 0; i < n; i++) {
    const c = Math.floor(i / rows);
    (out[c] ??= []).push(chars[i]!);
  }
  return out;
}

function defaultColumns(n: number): number {
  if (n <= 1) return 1;
  if (n === 2 || n === 4) return 2;
  return Math.ceil(Math.sqrt(n));
}

export function generateStamp(o: StampOptions): StampRender {
  const size = Math.max(8, o.size ?? 120);
  const mode = o.mode ?? "yang";
  const shape = o.shape ?? "auto";
  const seed = o.seed ?? 1;
  const direction = o.direction ?? "ttb-rtl";
  const columns = splitColumns(o.text, o.columns);
  const thickness = o.border ?? Math.max(1.5, size * 0.035);
  const padding = o.padding ?? size * 0.04;
  const gap = o.gap ?? size * 0.01;

  const layout = layoutStamp({
    columns,
    measure: o.measure ?? (() => FALLBACK_METRIC),
    size,
    shape,
    aspect: o.aspect,
    thickness,
    padding,
    rowGap: o.rowGap ?? gap,
    columnGap: o.columnGap ?? gap,
    stretch: o.stretch,
    cellHeightMode: o.cellHeightMode,
    offsetX: o.offsetX,
    offsetY: o.offsetY,
    direction,
  });
  const { width, height, fontSize } = layout;

  const corner = o.corner ?? "round";
  const cornerRadius = corner === "none" ? 0 : (o.cornerRadius ?? Math.min(width, height) * 0.04);
  const border = buildBorder(shape, {
    width,
    height,
    thickness,
    cornerRadius,
    sides: o.sides,
    orientation: o.orientation,
    rng: createRng(seed ^ SALT_SHAPE),
  });
  const refSize = Math.max(width, height);
  const roughness = o.roughness ?? 0.5;
  const baseRings = mode === "yin" ? [border.outer] : [border.outer, border.inner];
  const rings =
    roughness > 0
      ? erodeRings(
          baseRings,
          { roughness, thickness, size: refSize },
          createRng(seed ^ SALT_EROSION),
        )
      : baseRings;

  const bleed = clamp01(o.bleed ?? 0.7);
  const carving = clamp01(o.carving ?? 0.8);
  const defs: string[] = [];
  const filters: StampRender["filters"] = {};
  // 滤镜区域按几何给绝对坐标：印泥位移最多推 thickness 的 0.7，刀刻位移不到 2px，各留 4px 余量
  const pad = Math.max(4, thickness);
  const whole = { x: -pad, y: -pad, width: width + pad * 2, height: height + pad * 2 };
  const textRegion = (() => {
    // 撑满时字可能略超出格子，环形排字的字是旋转的，都按整章算
    if (layout.cells.length === 0 || o.stretch || direction === "circular") return whole;
    let x1 = Infinity;
    let y1 = Infinity;
    let x2 = -Infinity;
    let y2 = -Infinity;
    for (const c of layout.cells) {
      x1 = Math.min(x1, c.x);
      y1 = Math.min(y1, c.y);
      x2 = Math.max(x2, c.x + c.w);
      y2 = Math.max(y2, c.y + c.h);
    }
    const p = Math.max(4, fontSize * 0.08);
    return { x: x1 - p, y: y1 - p, width: x2 - x1 + p * 2, height: y2 - y1 + p * 2 };
  })();
  if (bleed > 0) {
    const inkId = `${o.id}-ink`;
    defs.push(inkFilter({ id: inkId, seed, intensity: bleed, thickness, fontSize, region: whole }));
    filters.ink = `url(#${inkId})`;
  }
  if (carving > 0 && layout.cells.length > 0) {
    const textId = `${o.id}-text`;
    defs.push(
      textFilter({
        id: textId,
        seed,
        intensity: carving,
        fontSize,
        strong: mode === "yin",
        region: textRegion,
      }),
    );
    filters.text = `url(#${textId})`;
  }

  const gridLines: StampGridLine[] = [];
  if (mode === "yin" && o.gridLines) {
    const lw = o.gridLineWidth ?? Math.max(1, fontSize * 0.06);
    const { columnEdges, rowEdges } = layout;
    for (let j = 0; j < columnEdges.length - 1; j++) {
      const a = columnEdges[j]!;
      const b = columnEdges[j + 1]!;
      gridLines.push({ x: (a.x + a.w + b.x) / 2 - lw / 2, y: 0, w: lw, h: height });
    }
    for (let r = 0; r < rowEdges.length - 1; r++) {
      const a = rowEdges[r]!;
      const b = rowEdges[r + 1]!;
      gridLines.push({ x: 0, y: (a.y + a.h + b.y) / 2 - lw / 2, w: width, h: lw });
    }
  }

  return {
    width,
    height,
    mode,
    fontSize,
    cells: layout.cells,
    defs: defs.join(""),
    ids: { clip: `${o.id}-clip`, mask: `${o.id}-mask` },
    filters,
    borderPath: ringsToPath(rings),
    clipPath: ringToPath(mode === "yin" ? border.outer : border.inner),
    gridLines,
    label: columns.map((c) => c.join("")).join(" "),
  };
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export { createGlyphMeasurer, loadStampFont } from "./measure";
export {
  FALLBACK_METRIC,
  PROBE_SIZE,
  type GlyphMeasurer,
  type GlyphMetric,
  type StampCell,
  type StampDirection,
  type StampLayout,
} from "./layout";
export type { PolygonOrientation, StampShape } from "./shape";
