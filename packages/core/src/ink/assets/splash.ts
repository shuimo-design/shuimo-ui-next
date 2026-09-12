/**
 * 牌顶的墨花：旧版弹窗关闭牌（老素材 model-close.png，46×75）牌尖两侧那些浅灰蓝的装饰，
 * 正常大小下看得出是一朵朵分开的"花瓣团"——十来朵带尖角的星形墨花**箍在牌的上半截上**：花心就落在两条屋檐线上，
 * 一半盖在牌身里、一半探到外面，从一边肩头绕过牌尖到另一边肩头，像给牌戴了一圈花环；肩头的最大、牌尖上方的小，
 * 彼此留一点空隙，中间再撒几粒小点。不是飘在牌旁边，不是连成一片的领子（连成片就成了牌背后一口箱子），也不是糊开的一团。
 * 每朵花是**菱形**的：四个尖，一条对角线长、一条短，四条边往里收腰（四角星），整朵随机转个角度；实心，边缘清楚。
 * 当 mask-image 用（颜色由使用方的 background 定）。画幅按牌宽 22px 定：牌尖在 (w/2, 7)，牌身两侧在 w/2 ± 11、
 * 两肩在牌尖下 10.8；使用方把它的顶边放在牌尖上方 7px 处、水平居中即可。
 */
import { createRng } from "../random";
import { fmt, svgDoc, svgToDataUrl, type Point } from "./brush";

export interface InkSplashOptions {
  seed?: number;
  /** 画幅宽 px，默认 44 */
  width?: number;
  /** 画幅高 px，默认 28 */
  height?: number;
}

const cache = new Map<string, string>();

/** 左半圈花的落点（相对牌尖，x 向左为负）和半径：花心沿左边屋檐线（牌尖 (0,0) 到左肩 (-11,10.8)）排过去、往外偏 1px，
 * 肩头那朵最大，肩头外侧再补一朵、肩下顺着牌身一朵；右半圈镜像；牌尖上方另有一朵小的 */
const LEFT_FLOWERS: [Point, number][] = [
  [[-2, 0.6], 2.4],
  [[-4.6, 3.1], 3],
  [[-7.4, 5.7], 3.4],
  [[-10.4, 8.4], 4.6],
  [[-13.5, 11.5], 3.2],
  [[-12, 15], 2.6],
];
const FLOWERS: [Point, number][] = [
  [[0, -1.5], 2.6],
  ...LEFT_FLOWERS,
  ...LEFT_FLOWERS.map(([[x, y], r]): [Point, number] => [[-x, y], r]),
];

/** 一朵菱形花：四个尖，长轴 r、短轴六成上下，四条边往里收腰，随机转角 */
function flower([cx, cy]: Point, r: number, rng: () => number): string {
  const start = rng() * Math.PI * 2;
  const short = 0.5 + rng() * 0.25;
  const pts: Point[] = [];
  for (let i = 0; i < 4; i++) {
    const a = start + (i / 4) * Math.PI * 2;
    const half = Math.PI / 4;
    // 0、2 号尖是长轴，1、3 号是短轴；尖长各带一点浮动
    const tip = r * (i % 2 === 0 ? 1 : short) * (0.9 + rng() * 0.2);
    const root = r * (0.28 + rng() * 0.12);
    pts.push([cx + Math.cos(a) * tip, cy + Math.sin(a) * tip]);
    pts.push([cx + Math.cos(a + half) * root, cy + Math.sin(a + half) * root]);
  }
  const alpha = (0.65 + rng() * 0.3).toFixed(2);
  return `<path d="M${pts.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join("L")}Z" fill="#000" fill-opacity="${alpha}"/>`;
}

export function inkSplashUrl(options: InkSplashOptions = {}): string {
  const seed = options.seed ?? 1;
  const width = options.width ?? 44;
  const height = options.height ?? 28;
  const key = `${seed}:${width}:${height}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rng = createRng(seed * 41 + 11);
  const ox = width / 2;
  const oy = 7;
  let body = "";
  for (const [[x, y], r] of FLOWERS) {
    // 落点、大小各带一点随机，别每个 seed 都一模一样
    const jx = (rng() - 0.5) * 2;
    const jy = (rng() - 0.5) * 2;
    body += flower([ox + x + jx, oy + y + jy], r * (0.85 + rng() * 0.3), rng);
  }
  // 花与花之间撒几粒小点
  for (let i = 0; i < 9; i++) {
    const a = rng() * Math.PI * 2;
    const d = 6 + rng() * 12;
    const x = ox + Math.cos(a) * d;
    const y = oy + 4 + Math.sin(a) * d * 0.7;
    if (x < 1 || x > width - 1 || y < 1 || y > height - 1) continue;
    body += `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt(0.4 + rng() * 0.5)}" fill="#000" fill-opacity="${(0.5 + rng() * 0.4).toFixed(2)}"/>`;
  }
  const svg = svgDoc({ width, height }, body);
  const url = svgToDataUrl(svg);
  cache.set(key, url);
  return url;
}
