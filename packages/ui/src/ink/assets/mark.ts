/** 记号：勾、横、加、叉、箭头、斜杠、墨点。24×24 画幅里用「一笔」写出来，当 mask-image 用 */
import { createRng } from "../random";
import {
  bleedFilter,
  blobPoints,
  paintBrush,
  samplePath,
  svgDoc,
  svgToDataUrl,
  type Point,
} from "./brush";

export type InkMarkKind =
  | "check"
  | "minus"
  | "plus"
  | "cross"
  | "chevronDown"
  | "chevronRight"
  | "chevronLeft"
  | "chevronsLeft"
  | "chevronsRight"
  | "slash"
  | "dot";

export interface InkMarkOptions {
  seed?: number;
  /** 画幅边长 px，默认 24 */
  size?: number;
  /** 笔宽（相对 24 画幅）px，默认 2.6 */
  strokeWidth?: number;
}

const STROKES: Record<Exclude<InkMarkKind, "dot">, Point[][]> = {
  check: [
    [
      [5, 12.5],
      [10, 17.5],
      [19.5, 6.5],
    ],
  ],
  minus: [
    [
      [5.5, 12],
      [18.5, 12],
    ],
  ],
  plus: [
    [
      [12, 5.5],
      [12, 18.5],
    ],
    [
      [5.5, 12],
      [18.5, 12],
    ],
  ],
  cross: [
    [
      [6.5, 6.5],
      [17.5, 17.5],
    ],
    [
      [17.5, 6.5],
      [6.5, 17.5],
    ],
  ],
  chevronDown: [
    [
      [6, 9],
      [12, 15.5],
      [18, 9],
    ],
  ],
  chevronRight: [
    [
      [9, 6],
      [15.5, 12],
      [9, 18],
    ],
  ],
  chevronLeft: [
    [
      [15, 6],
      [8.5, 12],
      [15, 18],
    ],
  ],
  // 双箭头：两笔并排的尖角，日期选择器用来翻年（单箭头翻月）
  chevronsLeft: [
    [
      [11.5, 6.5],
      [6, 12],
      [11.5, 17.5],
    ],
    [
      [18.5, 6.5],
      [13, 12],
      [18.5, 17.5],
    ],
  ],
  chevronsRight: [
    [
      [5.5, 6.5],
      [11, 12],
      [5.5, 17.5],
    ],
    [
      [12.5, 6.5],
      [18, 12],
      [12.5, 17.5],
    ],
  ],
  // 面包屑分隔符：一笔从右上撇到左下的斜杠，比标准 "/" 略陡，留出字间距
  slash: [
    [
      [15.5, 3.5],
      [8.5, 20.5],
    ],
  ],
};

const cache = new Map<string, string>();

export function inkMarkUrl(kind: InkMarkKind, options: InkMarkOptions = {}): string {
  const seed = options.seed ?? 1;
  const size = options.size ?? 24;
  const strokeWidth = options.strokeWidth ?? 2.6;
  const key = `${kind}:${seed}:${size}:${strokeWidth}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rng = createRng(seed * 31 + kind.length);
  let body: string;
  if (kind === "dot") {
    body = `<polygon points="${blobPoints(12, 12, 5.2, rng, 0.14)}" fill="#000"/>`;
  } else {
    body = STROKES[kind]
      .map((pts) =>
        paintBrush(
          samplePath(pts, rng, { wobble: 0.35, overshoot: 0.6, spacing: 2 }),
          { strokeWidth, roughness: 0.5, flyingWhite: 0.08, ribbons: 3 },
          rng,
        ),
      )
      .join("");
  }
  const svg = svgDoc(
    { width: size, height: size, viewBox: "0 0 24 24" },
    `${bleedFilter("b", seed, { frequency: 0.12, scale: 1.4, blur: 0.25 })}<g filter="url(#b)">${body}</g>`,
  );
  const url = svgToDataUrl(svg);
  cache.set(key, url);
  return url;
}
