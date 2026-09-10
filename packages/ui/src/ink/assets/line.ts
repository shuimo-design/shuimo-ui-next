/** 笔触线：分割线、输入框底线、滑块轨道。一张定长的横线或竖线，用 background-size 拉伸 */
import { createRng } from "../random";
import { bleedFilter, evenProfile, paintBrush, samplePath, svgDoc, svgToDataUrl } from "./brush";

export interface BrushLineOptions {
  seed?: number;
  /** 画幅长度 px，默认 400 */
  length?: number;
  /** 笔宽 px，默认 3 */
  thickness?: number;
  /** 竖线 */
  vertical?: boolean;
  /** 飞白 0–1，默认 0.15 */
  flyingWhite?: number;
  /** 边缘噪声 0–1，默认 0.5 */
  roughness?: number;
  /** 手抖幅度 px，默认 thickness * 0.3 */
  wobble?: number;
  /**
   * 一头粗一头细：起笔按住、越走越细（开关轨道、滑块轨道那种"一抹"）。
   * true 时收笔只剩三成宽；传数字则指定收笔宽度占起笔的比例（0–1）。默认 false，匀宽
   */
  taper?: boolean | number;
  /** 画幅两端留白 px；默认按笔宽留（给晕染余量），很短的线要传小一点，否则留白会吃掉大半长度 */
  endPad?: number;
}

export interface BrushLine {
  url: string;
  width: number;
  height: number;
}

const cache = new Map<string, BrushLine>();

/** 一抹的宽度轮廓：头钝而厚，往后收细到 tail 比例；飞白由 paintBrush 顺着 t 自己加重 */
function taperedProfile(tail: number): (t: number) => number {
  return (t) => {
    const head = t < 0.15 ? 1 + (0.15 - t) * 1.2 : 1;
    return (tail + (1 - tail) * (1 - t) ** 0.9) * head;
  };
}

export function brushLineUrl(options: BrushLineOptions = {}): BrushLine {
  const seed = options.seed ?? 1;
  const length = options.length ?? 400;
  const thickness = options.thickness ?? 3;
  const vertical = options.vertical ?? false;
  const flyingWhite = options.flyingWhite ?? 0.15;
  const roughness = options.roughness ?? 0.5;
  const wobble = options.wobble ?? thickness * 0.3;
  const taper = options.taper ?? false;
  const tail = typeof taper === "number" ? Math.min(1, Math.max(0, taper)) : 0.3;
  const key = `${seed}:${length}:${thickness}:${vertical}:${flyingWhite}:${roughness}:${wobble}:${taper}:${options.endPad ?? ""}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const rng = createRng(seed);
  const pad = Math.ceil(thickness * 1.5 + wobble);
  const endPad = options.endPad ?? pad;
  const band = thickness * 2 + pad * 2;
  const mid = band / 2;
  const path = vertical
    ? samplePath(
        [
          [mid, endPad],
          [mid, length - endPad],
        ],
        rng,
        { wobble },
      )
    : samplePath(
        [
          [endPad, mid],
          [length - endPad, mid],
        ],
        rng,
        { wobble },
      );
  const body = paintBrush(
    path,
    {
      strokeWidth: thickness,
      roughness,
      flyingWhite,
      profile: taper === false ? evenProfile : taperedProfile(tail),
    },
    rng,
  );
  const width = vertical ? band : length;
  const height = vertical ? length : band;
  const svg = svgDoc(
    { width, height, preserveAspectRatio: "none" },
    `${bleedFilter("b", seed)}<g filter="url(#b)">${body}</g>`,
  );
  const entry = { url: svgToDataUrl(svg), width, height };
  cache.set(key, entry);
  return entry;
}
