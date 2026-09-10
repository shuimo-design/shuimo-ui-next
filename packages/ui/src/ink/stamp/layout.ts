/**
 * 印章排版：先按字的墨迹框（不是 em 框）算每列该多宽、整章该多大，再把每个字摆进格子。
 * 竖排从右往左读；所有字共用一个字号，笔画粗细才一致——各自撑满格子的话瘦字会被放大、笔画变粗。
 */
import type { StampShape } from "./shape";

/** 探测字号：所有度量都在这个字号下量，排版时按比例缩放 */
export const PROBE_SIZE = 100;

export interface GlyphMetric {
  /** 探测字号下的墨迹宽高 */
  w: number;
  h: number;
  /** 墨迹相对锚点（text-anchor=middle、alphabetic 基线）的四向距离 */
  left: number;
  right: number;
  ascent: number;
  descent: number;
}

/** 量不到（SSR、字体没到）时按方块字的常规比例兜底 */
export const FALLBACK_METRIC: GlyphMetric = {
  w: 86,
  h: 86,
  left: 43,
  right: 43,
  ascent: 80,
  descent: 6,
};

export type GlyphMeasurer = (ch: string) => GlyphMetric;

export type StampDirection = "ttb-rtl" | "circular";

export interface StampLayoutOptions {
  /** 每列的字，列按从右到左给，每列从上到下 */
  columns: string[][];
  measure: GlyphMeasurer;
  /** 印章高度 */
  size: number;
  shape: StampShape;
  /** 宽高比（rect / ellipse / polygon 用） */
  aspect?: number;
  thickness: number;
  padding: number;
  rowGap: number;
  columnGap: number;
  /** 每个字非等比撑满格子（九叠篆那种） */
  stretch?: boolean;
  /** 行高分配：uniform 等分，fit 按各行最高墨迹分 */
  cellHeightMode?: "uniform" | "fit";
  /** 文字在框内的偏移，-1 ~ 1 */
  offsetX?: number;
  offsetY?: number;
  direction?: StampDirection;
}

export interface StampCell {
  char: string;
  /** 所在格子 */
  x: number;
  y: number;
  w: number;
  h: number;
  /** 字画在原点、字号 PROBE_SIZE，这个 transform 把它摆进格子 */
  transform: string;
  column: number;
  row: number;
}

export interface StampLayout {
  width: number;
  height: number;
  /** 实际渲染字号（撑满时取平均） */
  fontSize: number;
  cells: StampCell[];
  /** 文字区域 */
  area: { x: number; y: number; w: number; h: number };
  /** 各列（视觉顺序，从左到右）的左边界和宽 */
  columnEdges: { x: number; w: number }[];
  /** 各行的上边界和高 */
  rowEdges: { y: number; h: number }[];
}

export function layoutStamp(o: StampLayoutOptions): StampLayout {
  const columns = o.columns.filter((c) => c.length > 0);
  if (columns.length === 0) {
    const side = Math.max(1, o.size);
    return {
      width: side,
      height: side,
      fontSize: side * 0.5,
      cells: [],
      area: { x: 0, y: 0, w: side, h: side },
      columnEdges: [],
      rowEdges: [],
    };
  }
  if ((o.direction ?? "ttb-rtl") === "circular") return layoutCircular(columns.flat(), o);

  const { size, thickness, padding, rowGap, columnGap } = o;
  const numCols = columns.length;
  const maxRows = Math.max(...columns.map((c) => c.length));
  const metricsByCol = columns.map((col) => col.map((ch) => o.measure(ch)));
  const allMetrics = metricsByCol.flat();

  // 第一遍：按 size 当高度、让最高的字占格子 96%，定出共用字号和每列的墨迹宽
  const innerH = Math.max(1, size - thickness * 2 - padding * 2);
  const availInnerH = Math.max(1, innerH - rowGap * (maxRows - 1));
  const cellH = availInnerH / maxRows;
  const globalMaxPh = Math.max(...allMetrics.map((m) => m.h));
  const rowMaxPh: number[] = Array.from({ length: maxRows }, () => 0);
  for (const col of metricsByCol) {
    col.forEach((m, r) => {
      if (m.h > rowMaxPh[r]!) rowMaxPh[r] = m.h;
    });
  }
  const sumRowMaxPh = rowMaxPh.reduce((s, v) => s + v, 0);
  const fit = o.cellHeightMode === "fit" && sumRowMaxPh > 0;
  let rowHeights: number[];
  let fontSize: number;
  if (fit) {
    rowHeights = rowMaxPh.map((ph) => (availInnerH * ph) / sumRowMaxPh);
    fontSize = (availInnerH * 0.96 * PROBE_SIZE) / sumRowMaxPh;
  } else {
    rowHeights = Array.from({ length: maxRows }, () => cellH);
    fontSize = (cellH * 0.96 * PROBE_SIZE) / globalMaxPh;
  }
  const scale = fontSize / PROBE_SIZE;
  let columnWidths = metricsByCol.map((ms) => {
    const maxInkW = Math.max(...ms.map((m) => m.w)) * scale;
    return Math.max(1, maxInkW / 0.96);
  });
  const textInnerW = columnWidths.reduce((s, w) => s + w, 0) + (numCols - 1) * columnGap;
  const textFitW = textInnerW + thickness * 2 + padding * 2;

  // 外框尺寸：方 / 圆 / 多边形和带 aspect 的长方 / 椭圆一律按 size 定死，字往里缩；
  // auto 和不带 aspect 的长方 / 椭圆才贴着文字走
  let sealW: number;
  let sealH: number;
  switch (o.shape) {
    case "square":
    case "circle":
      sealW = size;
      sealH = size;
      break;
    case "rect":
    case "ellipse":
      sealH = size;
      sealW = o.aspect == null ? textFitW : sealH * Math.max(0.1, o.aspect);
      break;
    case "polygon":
      sealH = size;
      sealW = sealH * Math.max(0.1, o.aspect ?? 1);
      break;
    default:
      sealW = textFitW;
      sealH = size;
  }

  const shapeForcesDims =
    o.shape === "square" ||
    o.shape === "circle" ||
    o.shape === "polygon" ||
    ((o.shape === "rect" || o.shape === "ellipse") && o.aspect != null);
  const stretch = fit ? false : (o.stretch ?? shapeForcesDims);

  // 圆和椭圆里矩形网格顶不到边：文字区域取内切矩形再放大一点，溢出的由裁切兜住
  const innerWActual = Math.max(1, sealW - thickness * 2 - padding * 2);
  const innerHActual = Math.max(1, sealH - thickness * 2 - padding * 2);
  let regionW = innerWActual;
  let regionH = innerHActual;
  if (o.shape === "circle" || o.shape === "ellipse") {
    const a = innerWActual / 2;
    const b = innerHActual / 2;
    const grAspect = textInnerW / innerH;
    const denom = (grAspect * grAspect) / (a * a) + 1 / (b * b);
    const inscH = denom > 0 ? 2 / Math.sqrt(denom) : innerHActual;
    const inscW = grAspect * inscH;
    const overflow = stretch ? 1.25 : 1.08;
    regionW = Math.min(innerWActual, inscW * overflow);
    regionH = Math.min(innerHActual, inscH * overflow);
  }

  let areaW = textInnerW;
  let areaH = innerH;
  if (shapeForcesDims) {
    // 强制尺寸的形状：格子平分区域，字号取所有字里最紧的那个方向，谁都不溢出
    const filledCellW = Math.max(1, (regionW - columnGap * (numCols - 1)) / numCols);
    const availFilledH = Math.max(1, regionH - rowGap * (maxRows - 1));
    rowHeights = fit
      ? rowMaxPh.map((ph) => (availFilledH * ph) / sumRowMaxPh)
      : Array.from({ length: maxRows }, () => availFilledH / maxRows);
    let bestScale = Infinity;
    metricsByCol.forEach((ms) =>
      ms.forEach((m, r) => {
        const s = Math.min((filledCellW * 0.96) / m.w, (rowHeights[r]! * 0.96) / m.h);
        if (s < bestScale) bestScale = s;
      }),
    );
    if (Number.isFinite(bestScale) && bestScale > 0) fontSize = bestScale * PROBE_SIZE;
    columnWidths = Array.from({ length: numCols }, () => filledCellW);
    areaW = regionW;
    areaH = regionH;
  } else if (o.shape === "ellipse") {
    const k = Math.min(regionW / textInnerW, regionH / innerH, 1);
    if (k < 1 && k > 0) {
      rowHeights = rowHeights.map((h) => h * k);
      fontSize *= k;
      columnWidths = columnWidths.map((w) => w * k);
      areaW = columnWidths.reduce((s, w) => s + w, 0) + columnGap * (numCols - 1);
      areaH = rowHeights.reduce((s, h) => s + h, 0) + rowGap * (maxRows - 1);
    }
  }

  const area = { x: (sealW - areaW) / 2, y: (sealH - areaH) / 2, w: areaW, h: areaH };
  const offsetX = o.offsetX ?? 0;
  const offsetY = o.offsetY ?? 0;
  if (offsetX !== 0 || offsetY !== 0) {
    area.x += ((offsetX + 1) / 2 - 0.5) * area.w * 0.1;
    area.y += ((offsetY + 1) / 2 - 0.5) * area.h * 0.1;
  }

  // 网格：列宽按文字列（第 0 列在最右）反过来排到视觉位置
  const gridW = columnWidths.reduce((s, w) => s + w, 0) + columnGap * (numCols - 1);
  const gridH = rowHeights.reduce((s, h) => s + h, 0) + rowGap * (maxRows - 1);
  const ox = area.x + (area.w - gridW) / 2;
  const oy = area.y + (area.h - gridH) / 2;
  const columnEdges: { x: number; w: number }[] = [];
  let xCur = ox;
  for (let j = 0; j < numCols; j++) {
    const w = columnWidths[numCols - 1 - j]!;
    columnEdges.push({ x: xCur, w });
    xCur += w + columnGap;
  }
  const rowEdges: { y: number; h: number }[] = [];
  let yCur = oy;
  for (let r = 0; r < maxRows; r++) {
    const h = rowHeights[r]!;
    rowEdges.push({ y: yCur, h });
    yCur += h + rowGap;
  }

  const cells: StampCell[] = [];
  columns.forEach((col, c) => {
    const edge = columnEdges[numCols - 1 - c]!;
    col.forEach((ch, r) => {
      const rowEdge = rowEdges[r]!;
      const m = metricsByCol[c]![r]!;
      const cell = { x: edge.x, y: rowEdge.y, w: edge.w, h: rowEdge.h };
      const k = fontSize / PROBE_SIZE;
      const kx = stretch ? (cell.w * 0.96) / m.w : k;
      const ky = stretch ? (cell.h * 0.96) / m.h : k;
      cells.push({
        char: ch,
        ...cell,
        transform: glyphTransform(cell.x + cell.w / 2, cell.y + cell.h / 2, 0, kx, ky, m),
        column: c,
        row: r,
      });
    });
  });

  return { width: sealW, height: sealH, fontSize, cells, area, columnEdges, rowEdges };
}

/** 环形排列：从正上方顺时针，字头朝外 */
function layoutCircular(chars: string[], o: StampLayoutOptions): StampLayout {
  const side = Math.max(1, o.size);
  const sealW = side * (o.aspect ?? 1);
  const sealH = side;
  const inner = Math.min(sealW, sealH) - o.thickness * 2 - o.padding * 2;
  const outerR = Math.max(1, inner / 2);
  // 格子取半径的 55% 和相邻两字弧长的 90% 里较小的（字少时大、字多时不挤），再把环贴到边框内侧
  const cellSize = Math.min(outerR * 0.55, ((Math.PI * 2 * outerR * 0.7) / chars.length) * 0.9);
  const ringR = outerR - cellSize / 2 - outerR * 0.04;
  const metrics = chars.map((ch) => o.measure(ch));
  let bestScale = Infinity;
  for (const m of metrics) {
    const s = Math.min((cellSize * 0.96) / m.w, (cellSize * 0.96) / m.h);
    if (s < bestScale) bestScale = s;
  }
  const k = Number.isFinite(bestScale) ? bestScale : cellSize / PROBE_SIZE;
  const cx = sealW / 2;
  const cy = sealH / 2;
  const cells = chars.map((ch, i) => {
    const angle = -Math.PI / 2 + (i / chars.length) * Math.PI * 2;
    const x = cx + Math.cos(angle) * ringR;
    const y = cy + Math.sin(angle) * ringR;
    return {
      char: ch,
      x: x - cellSize / 2,
      y: y - cellSize / 2,
      w: cellSize,
      h: cellSize,
      transform: glyphTransform(x, y, ((angle + Math.PI / 2) * 180) / Math.PI, k, k, metrics[i]!),
      column: i,
      row: 0,
    };
  });
  return {
    width: sealW,
    height: sealH,
    fontSize: k * PROBE_SIZE,
    cells,
    area: { x: cx - outerR, y: cy - outerR, w: outerR * 2, h: outerR * 2 },
    columnEdges: [],
    rowEdges: [],
  };
}

/** 把画在原点、字号 PROBE_SIZE 的字挪到 (cx, cy)：先把墨迹中心对到原点，再缩放、旋转、平移 */
function glyphTransform(
  cx: number,
  cy: number,
  rotateDeg: number,
  kx: number,
  ky: number,
  m: GlyphMetric,
): string {
  const icx = (m.right - m.left) / 2;
  const icy = (m.descent - m.ascent) / 2;
  const rotate = rotateDeg ? ` rotate(${n(rotateDeg)})` : "";
  return `translate(${n(cx)} ${n(cy)})${rotate} scale(${n(kx, 4)} ${n(ky, 4)}) translate(${n(-icx)} ${n(-icy)})`;
}

function n(v: number, digits = 2): string {
  const s = v.toFixed(digits);
  return s.replace(/\.?0+$/, "") || "0";
}
