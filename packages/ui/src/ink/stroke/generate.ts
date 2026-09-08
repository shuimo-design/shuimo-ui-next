/**
 * 笔触边框：沿矩形四边各走一笔 naturalBrushStroke，拼成一份 SVG 文档。
 * 颜色一律画黑，使用方当 alpha 遮罩（mask-image），墨色由 CSS 的 --m-ink 决定。
 * 这个文件会静态引 shuimo-core 的 drawing/foundation 子路径，只能被动态 import。
 */
import { noise, prng } from "@jobinjia/shuimo-core/foundation";
import { naturalBrushStroke, stroke as shanshuiStroke } from "@jobinjia/shuimo-core/drawing";

export interface BrushBorderOptions {
  seed?: number;
  /** 笔宽 px，默认 3 */
  strokeWidth?: number;
  /** 边缘噪声 0–1，默认 0.5 */
  roughness?: number;
  /** 飞白 0–1，默认 0.25 */
  flyingWhite?: number;
  /** 拐角出头长度 px，默认 = strokeWidth */
  overshoot?: number;
  /** 手抖幅度 px，默认 strokeWidth * 0.25 */
  wobble?: number;
  /** 笔锋纹理线数量（Brush 的 texture），默认 0：边框不要那条细描边 */
  texture?: number;
  /** 渲染器：brush = 书法笔（naturalBrushStroke），shanshui = 山水线（stroke），默认 brush */
  renderer?: "brush" | "shanshui";
  /** 在 SVG 内嵌一层晕染滤镜（feTurbulence 位移 + 微模糊），默认开 */
  bleed?: boolean | { frequency?: number; scale?: number; blur?: number };
  /** 落墨：按笔顺沿路径描出（SMIL，图片加载即播放）。true = 1.2s */
  reveal?: boolean | { duration?: number; delay?: number };
}

export interface BrushBorder {
  svg: string;
  /** 画幅相对元素盒子的外扩距离 px */
  padding: number;
  width: number;
  height: number;
}

type Point = [number, number];

function edge(from: Point, to: Point, wobble: number, overshoot: number): Point[] {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  // 法线方向，用来加手抖
  const nx = -uy;
  const ny = ux;
  const steps = Math.max(6, Math.min(48, Math.round(length / 12)));
  const start: Point = [from[0] - ux * overshoot, from[1] - uy * overshoot];
  const total = length + overshoot * 2;
  const phase = prng.random() * Math.PI * 2;
  const freq = 1 + prng.random() * 1.5;
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const d = t * total;
    const w = (Math.sin(t * Math.PI * freq + phase) * 0.6 + (prng.random() - 0.5) * 0.8) * wobble;
    points.push([start[0] + ux * d + nx * w, start[1] + uy * d + ny * w]);
  }
  return points;
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

  prng.seed(seed);
  noise.reset();

  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const corners: Point[] = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ];
  const roughness = options.roughness ?? 0.5;
  const renderer = options.renderer ?? "brush";
  const draw = (points: Point[]): string =>
    renderer === "shanshui"
      ? shanshuiStroke(points, {
          wid: strokeWidth,
          col: "rgba(0,0,0,0.9)",
          noi: roughness,
          out: 1,
          // 默认是 sin 梭形，边框要接近匀宽，只在两端收一点
          fun: (x: number) => 0.7 + 0.3 * Math.sin(x * Math.PI) ** 0.4,
        })
      : naturalBrushStroke(points, {
          width: strokeWidth,
          color: "rgba(0,0,0,0.92)",
          noise: roughness,
          flyingWhite: options.flyingWhite ?? 0.12,
          texture: options.texture ?? 0,
          // 边框比正文淡会显得虚，墨量调高一档（默认 0.9 → 0.4）
          inkStart: 1,
          inkEnd: 0.65,
        });
  // 四条边一律向右 / 向下画。shuimo-core 的 Brush 对相邻两段方向角做算术平均，
  // 向左的笔画方向角在 ±π 附近会平均成 0，法线翻转，画出串珠伪影（待上游修）。
  const edges = [
    edge(corners[0]!, corners[1]!, wobble, overshoot),
    edge(corners[1]!, corners[2]!, wobble, overshoot),
    edge(corners[3]!, corners[2]!, wobble, overshoot),
    edge(corners[0]!, corners[3]!, wobble, overshoot),
  ];
  const reveal = options.reveal
    ? revealMasks(edges, strokeWidth + wobble * 2, seed, options.reveal)
    : undefined;
  const strokes = edges
    .map((points, index) => {
      const body = draw(points);
      return reveal ? `<g mask="url(#${reveal.ids[index]})">${body}</g>` : body;
    })
    .join("");

  const bleed = options.bleed ?? true;
  const bleedOpts = typeof bleed === "object" ? bleed : {};
  const filterId = `b${seed}`;
  const filter = bleed
    ? `<filter id="${filterId}" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${bleedOpts.frequency ?? 0.06}" numOctaves="2" seed="${seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${bleedOpts.scale ?? 2.5}" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="${bleedOpts.blur ?? 0.35}"/></filter>`
    : "";
  const vw = w + padding * 2;
  const vh = h + padding * 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${vw}" height="${vh}" viewBox="${-padding} ${-padding} ${vw} ${vh}">${filter}${reveal?.defs ?? ""}<g${bleed ? ` filter="url(#${filterId})"` : ""}>${strokes}</g></svg>`;
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
    const d = points
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" ");
    const mask =
      `<mask id="${id}" maskUnits="userSpaceOnUse" x="-1000" y="-1000" width="4000" height="4000">` +
      `<path d="${d}" fill="none" stroke="#fff" stroke-width="${(maskWidth * 2.5).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" ` +
      `stroke-dasharray="${length.toFixed(1)}" stroke-dashoffset="${length.toFixed(1)}">` +
      `<animate attributeName="stroke-dashoffset" from="${length.toFixed(1)}" to="0" begin="${(begin / 1000).toFixed(3)}s" dur="${Math.max(0.05, duration / 1000).toFixed(3)}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>` +
      `</path></mask>`;
    begin += duration;
    return mask;
  });
  return { defs: `<defs>${masks.join("")}</defs>`, ids };
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
