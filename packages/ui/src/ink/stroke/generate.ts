/**
 * 笔触边框：沿矩形四边各走一笔（assets/brush 的「一笔」原语），拼成一份 SVG 文档。
 * 颜色一律画黑，使用方当 alpha 遮罩（mask-image），墨色由 CSS 的 --m-ink 决定。
 */
import { createRng } from "../random";
import {
  bleedFilter,
  fmt,
  paintBrush,
  samplePath,
  svgDoc,
  svgToDataUrl,
  type BleedOptions,
  type Point,
} from "../assets/brush";

export { svgToDataUrl };

export interface BrushBorderOptions {
  seed?: number;
  /** 笔宽 px，默认 3 */
  strokeWidth?: number;
  /** 边缘噪声 0–1，默认 0.5 */
  roughness?: number;
  /** 飞白 0–1，默认 0.12 */
  flyingWhite?: number;
  /** 拐角出头长度 px，默认 = strokeWidth */
  overshoot?: number;
  /** 手抖幅度 px，默认 strokeWidth * 0.25 */
  wobble?: number;
  /** 在 SVG 内嵌一层晕染滤镜（feTurbulence 位移 + 微模糊），默认开 */
  bleed?: boolean | BleedOptions;
  /** 落墨：按笔顺沿路径描出（SMIL，图片加载即播放）。true = 1.2s */
  reveal?: boolean | { duration?: number; delay?: number };
  /** 只画哪几条边，缺省的边不画；不传四边全画 */
  sides?: { top?: boolean; right?: boolean; bottom?: boolean; left?: boolean };
  /** 每条边在拐角处留空的长度 px，默认 0；角上要压角饰（回纹）时用，线在角饰处停笔。
   *  一个数 = 四角八处都留这么多；四角各不相同的角饰用对象，每个角给 [横边留空, 竖边留空] */
  cornerGap?: number | CornerGaps;
  /** 沿线洒的细小墨点密度 0–2，默认 0；旧版底图框线边上那些干笔溅出的点 */
  specks?: number;
}

/** 每个角上两条边各自的留空：横边（上 / 下）在前，竖边（左 / 右）在后 */
export interface CornerGaps {
  tl?: [horizontal: number, vertical: number];
  tr?: [horizontal: number, vertical: number];
  br?: [horizontal: number, vertical: number];
  bl?: [horizontal: number, vertical: number];
}

export interface BrushBorder {
  svg: string;
  /** 画幅相对元素盒子的外扩距离 px */
  padding: number;
  width: number;
  height: number;
}

export function generateBrushBorder(
  width: number,
  height: number,
  options: BrushBorderOptions = {},
): BrushBorder {
  const strokeWidth = options.strokeWidth ?? 3;
  const overshoot = options.overshoot ?? strokeWidth;
  const wobble = options.wobble ?? strokeWidth * 0.25;
  const padding = Math.ceil(strokeWidth * 1.5 + overshoot + wobble);
  const seed = options.seed ?? 1;
  const roughness = options.roughness ?? 0.5;
  const flyingWhite = options.flyingWhite ?? 0.12;
  const rng = createRng(seed);

  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  // 拐角留空不能超过短边的三分之一，否则线就没了
  const gapLimit = Math.min(w, h) / 3;
  const gapOf = (corner: keyof CornerGaps, axis: 0 | 1) => {
    const g = options.cornerGap ?? 0;
    return Math.min(typeof g === "number" ? g : (g[corner]?.[axis] ?? 0), gapLimit);
  };
  // 笔顺：上、右、下、左；一律向右 / 向下画，方向一致便于描出动画
  const sample = (a: Point, b: Point) => samplePath([a, b], rng, { wobble, overshoot });
  // 四边都先采样再筛掉不画的：随机数消耗顺序不变，同 seed 下画出来的边和四边全画时一致
  const sides = options.sides;
  const all: { edge: ReturnType<typeof sample>; on: boolean }[] = [
    { edge: sample([gapOf("tl", 0), 0], [w - gapOf("tr", 0), 0]), on: sides?.top ?? true },
    { edge: sample([w, gapOf("tr", 1)], [w, h - gapOf("br", 1)]), on: sides?.right ?? true },
    { edge: sample([gapOf("bl", 0), h], [w - gapOf("br", 0), h]), on: sides?.bottom ?? true },
    { edge: sample([0, gapOf("tl", 1)], [0, h - gapOf("bl", 1)]), on: sides?.left ?? true },
  ];
  const edges = all.filter((e) => e.on).map((e) => e.edge);
  const reveal = options.reveal
    ? revealMasks(
        edges.map((e) => e.center),
        strokeWidth + wobble * 2,
        seed,
        options.reveal,
      )
    : undefined;
  const strokes = edges
    .map((e, index) => {
      const body = paintBrush(e, { strokeWidth, roughness, flyingWhite }, rng);
      return reveal ? `<g mask="url(#${reveal.ids[index]})">${body}</g>` : body;
    })
    .join("");
  // 洒点：沿每条线随机撒一些小圆点，落在线的两侧一两个笔宽内，大小不一、浓淡不一
  const specks = options.specks ?? 0;
  let dots = "";
  if (specks > 0)
    for (const e of edges) {
      const count = Math.round((e.length / 36) * specks);
      for (let i = 0; i < count; i++) {
        const idx = Math.min(e.center.length - 1, Math.floor(rng() * e.center.length));
        const p = e.center[idx]!;
        const n = e.normal[idx]!;
        const off = (rng() - 0.5) * 2 * strokeWidth * 2.4;
        const r = 0.35 + rng() * 0.9;
        dots += `<circle cx="${fmt(p[0] + n[0] * off)}" cy="${fmt(p[1] + n[1] * off)}" r="${fmt(r)}" fill="#000" fill-opacity="${(0.45 + rng() * 0.45).toFixed(2)}"/>`;
      }
    }

  const bleed = options.bleed ?? true;
  const filterId = `b${seed}`;
  const filter = bleed ? bleedFilter(filterId, seed, typeof bleed === "object" ? bleed : {}) : "";
  const vw = w + padding * 2;
  const vh = h + padding * 2;
  // 元素尺寸按 8px 分桶，画幅宽高比和元素不完全一致：必须 none，否则浏览器等比缩放并居中，竖笔会被挤进内侧
  const svg = svgDoc(
    {
      width: vw,
      height: vh,
      viewBox: `${-padding} ${-padding} ${vw} ${vh}`,
      preserveAspectRatio: "none",
    },
    `${filter}${reveal?.defs ?? ""}<g${bleed ? ` filter="url(#${filterId})"` : ""}>${strokes}${dots}</g>`,
  );
  return { svg, padding, width: vw, height: vh };
}

function pathLength(points: Point[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(points[i]![0] - points[i - 1]![0], points[i]![1] - points[i - 1]![1]);
  }
  return length;
}

/**
 * 按笔顺描出：每条边一个 <mask>，里面是沿中心线的宽描边 path，用 SMIL 把 dashoffset 从全长扫到 0。
 * 各边按长度分配时长、依次起笔。图片一加载就播放，所以只在首次落笔时用带 reveal 的版本。
 */
function revealMasks(
  edges: Point[][],
  maskWidth: number,
  seed: number,
  reveal: boolean | { duration?: number; delay?: number },
): { defs: string; ids: string[] } {
  const total = typeof reveal === "object" ? (reveal.duration ?? 1200) : 1200;
  const startDelay = typeof reveal === "object" ? (reveal.delay ?? 0) : 0;
  const lengths = edges.map(pathLength);
  const sum = lengths.reduce((a, b) => a + b, 0) || 1;
  let begin = startDelay;
  const ids: string[] = [];
  const masks = edges.map((points, index) => {
    const id = `r${seed}-${index}`;
    ids.push(id);
    const length = lengths[index]!;
    const duration = (total * length) / sum;
    const d = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${fmt(x)} ${fmt(y)}`).join(" ");
    const mask =
      `<mask id="${id}" maskUnits="userSpaceOnUse" x="-1000" y="-1000" width="4000" height="4000">` +
      `<path d="${d}" fill="none" stroke="#fff" stroke-width="${fmt(maskWidth * 2.5)}" stroke-linecap="round" stroke-linejoin="round" ` +
      `stroke-dasharray="${fmt(length)}" stroke-dashoffset="${fmt(length)}">` +
      `<animate attributeName="stroke-dashoffset" from="${fmt(length)}" to="0" begin="${(begin / 1000).toFixed(3)}s" dur="${Math.max(0.05, duration / 1000).toFixed(3)}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>` +
      `</path></mask>`;
    begin += duration;
    return mask;
  });
  return { defs: `<defs>${masks.join("")}</defs>`, ids };
}
