/**
 * 远山：几层山脊线剪影，噪声叠出峰谷，远层淡而糊、近层深而清。
 * 不追求前一版那种上万条线的水墨山水，只给纸面一个远景。当 background-image / mask-image 贴在底部。
 *
 * 传 `side` 就变成旧站宣纸底部那种「靠一侧的一组远山」：主峰偏向外侧、往页面中间渐低并化进雾里；
 * `crest` 沿山脊多勾一道浓墨锯齿线、峰顶垂几道皴笔，是旧图那组 webp 的观感。
 *
 * 遮挡：山是淡墨，直接叠会透出后面那座。同一张图里，远层的遮罩会按近层的轮廓抠掉；
 * 跨图（多张山当视差层）靠 `silhouette`——同一组山的实心剪影，先用它铺一层纸色再上墨，近山就压住了远山。
 */
import { createNoise1D, createRng, type Rng } from "../random";
import { compactPath, fmt, svgDoc, svgToDataUrl, type Point } from "./brush";

export interface InkRidgeOptions {
  seed?: number;
  /** 画幅宽 px，默认 1600 */
  width?: number;
  /** 画幅高 px，默认 400 */
  height?: number;
  /** 层数，默认 3 */
  layers?: number;
  /** 最近一层的不透明度，默认 0.32 */
  opacity?: number;
  /** 靠向哪一侧：山体在这一侧最高，往另一侧渐低并化进雾里。不传则铺满整幅 */
  side?: "left" | "right";
  /** 沿山脊勾一道浓墨锯齿线并在峰顶垂几道皴笔，默认关 */
  crest?: boolean;
  /** 山脚雾气占画幅高度的比例 0–1；side / crest 模式下不传按层深取 0.35–0.55，否则沿用旧行为（雾只淡到 0.15 透明度） */
  mist?: number;
  /** 各层层深的取值区间 [远, 近]（0 最远 1 最近），默认 [0, 1]；分成多张图当视差层时用它错开远近 */
  depthRange?: [number, number];
  /** 外侧边缘也化开（只在 side 模式有效）：不贴着容器边放的近层用它，免得露出一条竖直的切口 */
  softOuter?: boolean;
}

export interface InkRidge {
  /** 墨色版：淡墨山体（可带勾线皴笔），当遮罩上墨色 */
  url: string;
  /** 实心剪影版：同一组山、同样的雾气和侧边化开，但山体不透明，用来垫纸色挡住后面的山 */
  silhouette: string;
  width: number;
  height: number;
}

/** 一层山算完的中间结果：轮廓、滤镜和雾气遮罩的 id、墨色版的画法 */
interface RidgeLayer {
  filterId: string;
  maskId: string;
  outline: string;
  /** 墨色版山体（含勾线皴笔） */
  ink: string;
  /** 这一层的雾气渐变（还没包成 mask，包的时候要再塞进近层的抠图） */
  mistGradient: string;
}

const cache = new Map<string, InkRidge>();

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** 山脊线上的局部峰顶：比左右邻点都高（y 更小）且高出山脊平均线的点 */
function peaks(pts: [number, number][], base: number): number[] {
  const out: number[] = [];
  for (let i = 2; i < pts.length - 2; i++) {
    const y = pts[i]![1];
    if (
      y < pts[i - 1]![1] &&
      y < pts[i - 2]![1] &&
      y <= pts[i + 1]![1] &&
      y < pts[i + 2]![1] &&
      y < base - 8
    )
      out.push(i);
  }
  return out;
}

/** 从峰顶往下垂的皴笔：一道带抖动的短折线，向内侧倾斜 */
function crease(
  rng: Rng,
  from: [number, number],
  length: number,
  dir: number,
  strokeWidth: number,
  alpha: number,
): string {
  const segs = 4;
  const slope = 0.35 + rng() * 0.45;
  const pts: Point[] = [from];
  let [x, y] = from;
  for (let k = 1; k <= segs; k++) {
    const step = length / segs;
    y += step;
    x += dir * step * slope + (rng() - 0.5) * step * 0.5;
    pts.push([x, y]);
  }
  const dash = `${fmt(length * 0.45)} ${fmt(strokeWidth * 2)} ${fmt(length * 0.3)} ${fmt(strokeWidth * 3)}`;
  return `<path d="${compactPath(pts, false)}" fill="none" stroke="#000" stroke-opacity="${alpha.toFixed(3)}" stroke-width="${fmt(strokeWidth)}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${dash}"/>`;
}

export function inkRidgeUrl(options: InkRidgeOptions = {}): InkRidge {
  const seed = options.seed ?? 1;
  const width = options.width ?? 1600;
  const height = options.height ?? 400;
  const layers = options.layers ?? 3;
  const opacity = options.opacity ?? 0.32;
  const side = options.side;
  const crest = options.crest ?? false;
  const [depthFrom, depthTo] = options.depthRange ?? [0, 1];
  const softOuter = options.softOuter ?? false;
  const key = `${seed}:${width}:${height}:${layers}:${opacity}:${side ?? ""}:${crest ? 1 : 0}:${options.mist ?? ""}:${depthFrom},${depthTo}:${softOuter ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rng = createRng(seed * 23 + 11);
  const defs: string[] = [];
  const built: RidgeLayer[] = [];
  for (let i = 0; i < layers; i++) {
    // i = 0 最远
    const t = layers === 1 ? 1 : i / (layers - 1);
    const depth = depthFrom + (depthTo - depthFrom) * t;
    const n1 = createNoise1D(rng, 32);
    const n2 = createNoise1D(rng, 32);
    const n3 = createNoise1D(rng, 32);
    const base = height * (0.5 + 0.2 * depth);
    const amp = height * (0.42 - 0.12 * depth);
    const phase = rng() * 30;
    const steps = Math.max(80, Math.round(width / 5));
    // 靠边的一组：主峰落在外侧 25%–55% 处，往内侧按平滑包络压低
    const peakAt = side ? 0.25 + rng() * 0.3 : 0;
    const peakWidth = side ? 0.09 + rng() * 0.06 : 1;
    const peakHeight = side ? 0.5 + rng() * 0.3 : 0;
    const crestNoise = crest ? createNoise1D(rng, 64) : undefined;
    const pts: [number, number][] = [];
    for (let s = 0; s <= steps; s++) {
      const x = (s / steps) * width;
      const u = (s / steps) * (2.5 + depth * 2.5);
      const low = n1(phase + u) * 0.55 + n2(phase + u * 2.1) * 0.3;
      // 高频棱线只加在山体上（low 越高越明显），谷底保持平缓
      const ridge = n3(phase + u * 7) * 0.22 * Math.max(0, low + 0.4);
      let v = low + ridge;
      // 峰拉尖、谷压平：正值取 0.6 次幂变尖，负值压扁
      v = v >= 0 ? v ** 0.6 : -0.5 * (-v) ** 1.4;
      let y = base - v * amp;
      if (side) {
        // d：0 在外侧边缘，1 在内侧（页面中间）
        const d = side === "left" ? s / steps : 1 - s / steps;
        const env = 1 - smoothstep(0.3, 1, d) * 0.9;
        // 主峰用指数衰减而不是高斯：顶是尖的，像旧图那种一笔挑上去的峭峰
        const bump = Math.exp(-Math.abs(d - peakAt) / (peakWidth * 0.8)) * peakHeight;
        y = base + (1 - env) * height * 0.22 - (v * env + bump) * amp;
      }
      pts.push([x, y]);
    }
    const filterId = `r${i}`;
    const blur = (1.6 - 1.3 * depth).toFixed(2);
    defs.push(
      `<filter id="${filterId}" x="-5%" y="-10%" width="110%" height="120%" color-interpolation-filters="sRGB">` +
        `<feTurbulence type="fractalNoise" baseFrequency="0.02 0.06" numOctaves="3" seed="${seed + i}" result="n"/>` +
        `<feDisplacementMap in="SourceGraphic" in2="n" scale="${(5 + 5 * depth).toFixed(1)}" xChannelSelector="R" yChannelSelector="G" result="d"/>` +
        `<feGaussianBlur in="d" stdDeviation="${blur}"/></filter>`,
    );
    // 远层淡、近层浓；每层山脚用渐变遮罩化进雾里
    const alpha = opacity * (0.3 + 0.7 * depth);
    const mist = options.mist ?? (side || crest ? 0.55 - 0.2 * depth : undefined);
    const mistTop = mist === undefined ? 0.35 + 0.25 * depth : 1 - mist;
    const mistFloor = mist === undefined ? 0.15 : 0;
    const mistGradient = `<linearGradient id="g${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="${mistTop.toFixed(2)}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="${mistFloor}"/></linearGradient>`;
    // 山体轮廓、脊线都写成相对坐标的 path（比 polygon / polyline 省一半字节，画出来一样）
    const outline = compactPath([...pts, [width, height + 20], [0, height + 20]], true);
    // 勾线版的山体是一层淡墨渲染：脊背处浓、往下越来越淡，让勾线和皴笔从中跳出来
    let fill = "#000";
    if (crest) {
      defs.push(
        `<linearGradient id="f${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="0.45" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/></linearGradient>`,
      );
      fill = `url(#f${i})`;
    }
    let ink = `<path d="${outline}" fill="${fill}" fill-opacity="${alpha.toFixed(3)}"/>`;
    if (crest && crestNoise) {
      // 山脊勾线：沿轮廓再走一遍，叠一层高频抖动出锯齿；近层粗而实，远层细而淡
      const sw = width * 0.004 * (0.6 + 0.7 * depth);
      const jag = width * 0.0025 * (0.6 + 0.8 * depth);
      const crest = compactPath(
        pts.map(([x, y], k): Point => [x, y + crestNoise(k * 0.9) * jag - sw * 0.3]),
        false,
      );
      const crestAlpha = Math.min(1, alpha * 3);
      // 断续的飞白：每段长短随机
      const dashes: string[] = [];
      for (let k = 0; k < 6; k++)
        dashes.push(fmt(width * (0.05 + rng() * 0.12)), fmt(sw * (1 + rng() * 3)));
      ink +=
        `<path d="${crest}" fill="none" stroke="#000" stroke-opacity="${crestAlpha.toFixed(3)}" stroke-width="${fmt(sw)}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${dashes.join(" ")}"/>` +
        `<path d="${crest}" fill="none" stroke="#000" stroke-opacity="${(crestAlpha * 0.5).toFixed(3)}" stroke-width="${fmt(sw * 0.45)}" stroke-linejoin="round" transform="translate(0 ${fmt(sw * 1.4)})"/>`;
      // 峰顶垂下的皴笔：取几个最高的峰，往内侧斜着落 2–3 道
      const tops = peaks(pts, base)
        .sort((a, b) => pts[a]![1] - pts[b]![1])
        .slice(0, 3);
      const dir = side === "left" ? 1 : side === "right" ? -1 : rng() < 0.5 ? -1 : 1;
      for (const k of tops) {
        const count = 2 + Math.floor(rng() * 2);
        for (let c = 0; c < count; c++) {
          const from: [number, number] = [
            pts[k]![0] + (rng() - 0.5) * width * 0.02,
            pts[k]![1] + sw + c * sw * 2,
          ];
          ink += crease(
            rng,
            from,
            height * (0.14 + rng() * 0.16) * (0.7 + 0.5 * depth),
            dir * (c % 2 === 0 ? 1 : -0.6),
            sw * 0.55,
            crestAlpha * 0.75,
          );
        }
      }
    }
    built.push({ filterId, maskId: `m${i}`, outline, ink, mistGradient });
  }
  // 每层的遮罩 = 自己的雾气渐变，再把所有更近的层按轮廓涂黑抠掉（带同样的位移和雾气，边缘才对得上）。
  // 这样近山压在远山上时不会把远山透出来。
  const inkParts: string[] = [];
  const solidParts: string[] = [];
  built.forEach((layer, i) => {
    const cutouts = built
      .slice(i + 1)
      .map(
        (near) =>
          `<g filter="url(#${near.filterId})" mask="url(#${near.maskId})"><path d="${near.outline}" fill="#000"/></g>`,
      )
      .join("");
    defs.push(
      layer.mistGradient +
        `<mask id="${layer.maskId}"><rect width="${width}" height="${height}" fill="url(#g${i})"/>${cutouts}</mask>`,
    );
    const wrap = (body: string) =>
      `<g filter="url(#${layer.filterId})" mask="url(#${layer.maskId})">${body}</g>`;
    inkParts.push(wrap(layer.ink));
    solidParts.push(wrap(`<path d="${layer.outline}" fill="#000"/>`));
  });
  let inkInner = inkParts.join("");
  let solidInner = solidParts.join("");
  if (side) {
    // 内侧那一端整体化开：横向渐变遮罩，从 55% 处开始淡到全透明；softOuter 时外侧头上 12% 也化开
    const x1 = side === "left" ? 0 : 1;
    const x2 = side === "left" ? 1 : 0;
    const outer = softOuter
      ? `<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.12" stop-color="#fff"/>`
      : "";
    defs.push(
      `<linearGradient id="gs" x1="${x1}" y1="0" x2="${x2}" y2="0">${outer}<stop offset="0.55" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
        `<mask id="ms"><rect width="${width}" height="${height}" fill="url(#gs)"/></mask>`,
    );
    inkInner = `<g mask="url(#ms)">${inkInner}</g>`;
    solidInner = `<g mask="url(#ms)">${solidInner}</g>`;
  }
  const doc = (inner: string) =>
    svgToDataUrl(
      svgDoc(
        { width, height, preserveAspectRatio: "xMidYMax slice" },
        `<defs>${defs.join("")}</defs>${inner}`,
      ),
    );
  const entry: InkRidge = { url: doc(inkInner), silhouette: doc(solidInner), width, height };
  cache.set(key, entry);
  return entry;
}
