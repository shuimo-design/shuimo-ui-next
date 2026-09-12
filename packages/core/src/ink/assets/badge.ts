/**
 * 状态徽记：一团墨里挖出白色记号——勾 / 叉 / 感叹 / 信息点。
 * 消息提示、结果反馈用。当 mask-image 用：墨团处实、记号处透，墨色由使用方的 background 决定。
 */
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

export type InkBadgeKind = "check" | "cross" | "bang" | "info";

export interface InkBadgeOptions {
  seed?: number;
  /** 画幅边长 px，默认 32 */
  size?: number;
  /** 墨团毛边程度 0–1，默认 0.18 */
  raggedness?: number;
  /** 记号笔宽（相对 32 画幅）px，默认 3.6 */
  strokeWidth?: number;
}

/** 32×32 画幅里的记号笔画；感叹和信息点另加一个圆点 */
const STROKES: Record<InkBadgeKind, { lines: Point[][]; dot?: Point }> = {
  check: {
    lines: [
      [
        [9.5, 16.5],
        [14, 21.5],
        [23, 10],
      ],
    ],
  },
  cross: {
    lines: [
      [
        [10.5, 10.5],
        [21.5, 21.5],
      ],
      [
        [21.5, 10.5],
        [10.5, 21.5],
      ],
    ],
  },
  bang: {
    lines: [
      [
        [16, 8],
        [16, 18.5],
      ],
    ],
    dot: [16, 23],
  },
  info: {
    lines: [
      [
        [16, 13.5],
        [16, 24],
      ],
    ],
    dot: [16, 9],
  },
};

const cache = new Map<string, string>();

export function inkBadgeUrl(kind: InkBadgeKind, options: InkBadgeOptions = {}): string {
  const seed = options.seed ?? 1;
  const size = options.size ?? 32;
  const raggedness = options.raggedness ?? 0.18;
  const strokeWidth = options.strokeWidth ?? 3.6;
  const key = `${kind}:${seed}:${size}:${raggedness}:${strokeWidth}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rng = createRng(seed * 41 + kind.length);
  const { lines, dot } = STROKES[kind];
  const marks =
    lines
      .map((pts) =>
        paintBrush(
          samplePath(pts, rng, { wobble: 0.3, overshoot: 0.4, spacing: 1.5 }),
          { strokeWidth, roughness: 0.5, flyingWhite: 0.1, ribbons: 3 },
          rng,
        ),
      )
      .join("") +
    (dot ? `<polygon points="${blobPoints(dot[0], dot[1], 2, rng, 0.2, 24)}" fill="#000"/>` : "");
  // mask 用亮度：白底保留墨团，黑色记号处被挖空
  const svg = svgDoc(
    { width: size, height: size, viewBox: "0 0 32 32" },
    `${bleedFilter("b", seed, { frequency: 0.07, scale: 2.4, blur: 0.35 })}` +
      `${bleedFilter("m", seed + 1, { frequency: 0.14, scale: 1.2, blur: 0.2 })}` +
      `<mask id="k"><rect width="32" height="32" fill="#fff"/><g filter="url(#m)">${marks}</g></mask>` +
      `<g filter="url(#b)"><polygon points="${blobPoints(16, 16, 12.2, rng, raggedness, 72)}" fill="#000" mask="url(#k)"/></g>`,
  );
  const url = svgToDataUrl(svg);
  cache.set(key, url);
  return url;
}
