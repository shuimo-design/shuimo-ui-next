/**
 * 孤舟：一叶扁舟，一根长弧做船身、船尾一个撑篙的人、篙斜插进水里，船底两三笔水纹。
 * 只画黑色当遮罩，墨色由 CSS 变量决定；同 seed 同一条船。
 */
import { createRng, type Rng } from "../random";
import {
  calligraphicProfile,
  evenProfile,
  fmt,
  paintBrush,
  samplePath,
  svgDoc,
  svgToDataUrl,
  type BrushOptions,
  type Point,
} from "./brush";

export interface InkBoatOptions {
  seed?: number;
  /** 画幅宽 px，默认 160 */
  width?: number;
  /** 画幅高 px，默认 64 */
  height?: number;
  /** 船头朝哪边，默认 left */
  heading?: "left" | "right";
}

const cache = new Map<string, string>();

function stroke(rng: Rng, points: Point[], opts: BrushOptions, wobble: number, spacing = 3) {
  return paintBrush(samplePath(points, rng, { wobble, spacing }), opts, rng);
}

export function inkBoatUrl(options: InkBoatOptions = {}): string {
  const seed = options.seed ?? 1;
  const w = options.width ?? 160;
  const h = options.height ?? 64;
  const heading = options.heading ?? "left";
  const key = `${seed}:${w}:${h}:${heading}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rng = createRng(seed * 61 + 23);
  // 坐标按船头朝左画，朝右时整体镜像
  const waterline = h * 0.58;
  // 船身：船头翘起、中段压水、船尾略高，一笔到底；下面再补一笔短的当船底的暗面
  const hull: Point[] = [
    [w * 0.08, waterline - h * 0.2],
    [w * 0.2, waterline - h * 0.06],
    [w * 0.45, waterline + h * 0.02],
    [w * 0.7, waterline + h * 0.01],
    [w * 0.9, waterline - h * 0.08],
  ];
  const keel: Point[] = [
    [w * 0.22, waterline + h * 0.07],
    [w * 0.5, waterline + h * 0.12],
    [w * 0.8, waterline + h * 0.08],
  ];
  const hullWidth = h * 0.09;
  const body =
    stroke(
      rng,
      hull,
      { strokeWidth: hullWidth, roughness: 0.35, flyingWhite: 0.08, profile: calligraphicProfile },
      hullWidth * 0.2,
    ) +
    `<g opacity="0.7">${stroke(
      rng,
      keel,
      { strokeWidth: hullWidth * 0.7, roughness: 0.45, flyingWhite: 0.2, profile: evenProfile },
      hullWidth * 0.2,
    )}</g>`;
  // 船尾的人：一点头、一笔身子微微前倾
  const px = w * 0.74;
  const top = waterline - h * 0.42;
  const figure =
    `<circle cx="${fmt(px + h * 0.02)}" cy="${fmt(top + h * 0.02)}" r="${fmt(h * 0.05)}" fill="#000"/>` +
    stroke(
      rng,
      [
        [px + h * 0.01, top + h * 0.09],
        [px - h * 0.02, top + h * 0.22],
        [px - h * 0.03, top + h * 0.36],
      ],
      { strokeWidth: h * 0.07, roughness: 0.3, flyingWhite: 0.02, profile: (t) => 1 - 0.35 * t },
      h * 0.01,
      2,
    );
  // 篙：从人手边斜插到水里，细而匀
  const pole = stroke(
    rng,
    [
      [px + h * 0.06, top - h * 0.02],
      [px + h * 0.26, waterline + h * 0.28],
    ],
    { strokeWidth: h * 0.025, roughness: 0.2, flyingWhite: 0, ribbons: 2, profile: evenProfile },
    h * 0.006,
    2,
  );
  // 水纹：船头船尾各一两笔短弧，淡
  const ripple = (x0: number, x1: number, y: number) =>
    stroke(
      rng,
      [
        [x0, y],
        [(x0 + x1) / 2, y + h * 0.025],
        [x1, y],
      ],
      {
        strokeWidth: h * 0.035,
        roughness: 0.4,
        flyingWhite: 0.15,
        ribbons: 2,
        profile: calligraphicProfile,
      },
      h * 0.01,
      2,
    );
  const ripples =
    `<g opacity="0.45">` +
    ripple(0, w * 0.16, waterline + h * 0.2 + rng() * h * 0.05) +
    ripple(w * 0.3, w * 0.62, waterline + h * 0.27 + rng() * h * 0.05) +
    ripple(w * 0.82, w, waterline + h * 0.18 + rng() * h * 0.05) +
    `</g>`;
  const inner = body + figure + pole + ripples;
  const flipped =
    heading === "right" ? `<g transform="translate(${w} 0) scale(-1 1)">${inner}</g>` : inner;
  const url = svgToDataUrl(svgDoc({ width: w, height: h }, flipped));
  cache.set(key, url);
  return url;
}
