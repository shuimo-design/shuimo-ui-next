/**
 * 雁阵：一列「人」字形的小雁，领头的在前、两翼向后错开成人字队形。
 * 每只雁是两笔浅浅的弧：翼尖轻、近身重，身子在折点上；越靠后的越小越淡（远）。
 * 只画黑色当遮罩，墨色由 CSS 变量决定；同 seed 同一列雁。
 */
import { createRng, type Rng } from "../random";
import {
  calligraphicProfile,
  paintBrush,
  samplePath,
  svgDoc,
  svgToDataUrl,
  type Point,
} from "./brush";

export interface InkGeeseOptions {
  seed?: number;
  /** 画幅宽 px，默认 240 */
  width?: number;
  /** 画幅高 px，默认 96 */
  height?: number;
  /** 雁的只数 3–11，默认 7 */
  count?: number;
  /** 飞行方向：领头雁在哪一侧，默认 right */
  heading?: "left" | "right";
}

const cache = new Map<string, string>();

/** 一只雁：翼展 span、翼尖下垂 drop；两翼各一笔，从翼尖画到身子 */
function goose(rng: Rng, x: number, y: number, span: number, drop: number, width: number): string {
  const half = span / 2;
  const wing = (dir: -1 | 1): Point[] => [
    [x + dir * half, y + drop],
    [x + dir * half * 0.55, y + drop * 0.25],
    [x + dir * half * 0.15, y - drop * 0.1],
    [x, y],
  ];
  const paint = (pts: Point[]) =>
    paintBrush(
      samplePath(pts, rng, { wobble: width * 0.15, spacing: 2 }),
      {
        strokeWidth: width,
        roughness: 0.4,
        flyingWhite: 0.05,
        ribbons: 3,
        profile: calligraphicProfile,
      },
      rng,
    );
  return paint(wing(-1)) + paint(wing(1));
}

export function inkGeeseUrl(options: InkGeeseOptions = {}): string {
  const seed = options.seed ?? 1;
  const width = options.width ?? 240;
  const height = options.height ?? 96;
  const count = Math.max(3, Math.min(11, Math.round(options.count ?? 7)));
  const heading = options.heading ?? "right";
  const key = `${seed}:${width}:${height}:${count}:${heading}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rng = createRng(seed * 53 + 19);
  const dir = heading === "right" ? 1 : -1;
  // 领头雁在前方偏上，后面的沿两条斜线往后往下排；两翼只数不等，人字不对称才像真的
  const lead: Point = [width * (heading === "right" ? 0.82 : 0.18), height * 0.22];
  const stepX = (width * 0.7) / Math.max(2, count - 1);
  const ranks = Math.ceil((count - 1) / 2);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    // i = 0 领头；奇数在上翼、偶数在下翼，各自按序往后排
    const rank = i === 0 ? 0 : Math.ceil(i / 2);
    const arm = i === 0 ? 0 : i % 2 === 1 ? -1 : 1;
    const drift = (rng() - 0.5) * stepX * 0.35;
    const x = lead[0] - dir * rank * stepX * (arm === 1 ? 1.15 : 1) + drift;
    const y =
      lead[1] +
      rank * (arm === -1 ? height * 0.055 : height * 0.11) +
      (arm === 1 ? height * 0.02 : 0) +
      (rng() - 0.5) * height * 0.06;
    // 队尾的更远：翼展和笔宽一起收
    const far = 1 - (rank / Math.max(1, ranks)) * 0.3;
    const span = width * 0.11 * far * (0.9 + rng() * 0.2);
    const drop = span * (0.28 + rng() * 0.12);
    const alpha = 0.95 - (rank / Math.max(1, ranks)) * 0.35;
    parts.push(
      `<g opacity="${alpha.toFixed(2)}">${goose(rng, x, y, span, drop, 2.4 * far + 0.6)}</g>`,
    );
  }
  const url = svgToDataUrl(svgDoc({ width, height }, parts.join("")));
  cache.set(key, url);
  return url;
}
