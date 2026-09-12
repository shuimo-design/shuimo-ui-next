/**
 * 光标：32×32 的墨笔箭头。auto 一笔箭头；pointer 箭头加一滴墨；disabled 箭头加一道叉。
 * 深墨配一圈纸白描边，亮暗背景都看得清；热点在箭尖。
 */
import { createRng } from "../random";
import {
  bleedFilter,
  fmt,
  paintBrush,
  samplePath,
  svgDoc,
  svgToDataUrl,
  type Point,
} from "./brush";

export type InkCursorKind = "auto" | "pointer" | "disabled";

export interface InkCursorOptions {
  seed?: number;
  /** 墨色，默认 #1c1c1c */
  ink?: string;
  /** 描边（纸白），默认 #fbf8ef */
  halo?: string;
}

const cache = new Map<string, string>();

const ARROW: Point[] = [
  [6, 3],
  [6, 25],
  [11.5, 19.5],
  [15, 28],
  [19, 26],
  [15.5, 18],
  [23, 18],
];

export function inkCursorUrl(kind: InkCursorKind, options: InkCursorOptions = {}): string {
  const seed = options.seed ?? 1;
  const ink = options.ink ?? "#1c1c1c";
  const halo = options.halo ?? "#fbf8ef";
  const key = `${kind}:${seed}:${ink}:${halo}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rng = createRng(seed * 41 + kind.length);
  const arrow = `${ARROW.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join(" ")}`;
  let extra = "";
  if (kind === "pointer") {
    extra = `<circle cx="25" cy="8" r="3.2" fill="${ink}" stroke="${halo}" stroke-width="1"/>`;
  } else if (kind === "disabled") {
    const stroke = paintBrush(
      samplePath(
        [
          [20, 4],
          [29, 13],
        ],
        rng,
        { spacing: 2 },
      ),
      { strokeWidth: 2.4, roughness: 0.4, flyingWhite: 0, ribbons: 2 },
      rng,
    );
    extra = `<g fill="${ink}">${stroke.replace(/fill="#000"/g, `fill="${ink}"`)}</g><circle cx="24.5" cy="8.5" r="6.5" fill="none" stroke="${ink}" stroke-width="1.6"/>`;
  }
  const svg = svgDoc(
    { width: 32, height: 32 },
    `${bleedFilter("b", seed, { frequency: 0.09, scale: 1.6, blur: 0.2 })}` +
      `<g filter="url(#b)"><polygon points="${arrow}" fill="${ink}" stroke="${halo}" stroke-width="1.6" stroke-linejoin="round" paint-order="stroke"/>${extra}</g>`,
  );
  const url = svgToDataUrl(svg);
  cache.set(key, url);
  return url;
}
