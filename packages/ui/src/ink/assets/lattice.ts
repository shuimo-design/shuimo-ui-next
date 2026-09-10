/**
 * 回纹角饰：旧版底图四个角是手画的**四个不同的**回纹，这里按老版真实截图放大后逐条描下来，每个角一套，不做旋转：
 * 左上最小（一个方块、一根竖杠、一条横带、一个下挂方块），右上多一个探出框外的小方，右下和左下是更密的井字回纹、比上面两个大一圈。
 * 每根条都是细线勾边的空心长方形（老图里条宽约 3px、线约 1px），条子互相穿插。
 * 坐标写在 28 格网格上：框角在离外沿 6 格处（左上 (6,6)、右上 (22,6)、右下 (22,22)、左下 (6,22)），一格 = 2px；
 * 左下、右下两套往框内探 45px 以上、往上探到 -2.7 格，28 格装不下，实际画幅是 32 格（64px），右边 / 下边的角整体挪 4 格补上。
 * 使用方给笔触边框的 cornerGap 按角、按边设留空，实线在角饰第一根条处停笔（左上的上边线整段藏在山下面）。
 * 当 mask-image 用；线要深而脆、白缝干净，所以默认不晕染。
 */
import { createRng } from "../random";
import {
  bleedFilter,
  evenProfile,
  paintBrush,
  samplePath,
  svgDoc,
  svgToDataUrl,
  type Point,
} from "./brush";

export type InkLatticeCorner = "tl" | "tr" | "br" | "bl";

export interface InkLatticeOptions {
  seed?: number;
  /** 画幅边长 px，默认 64（32 格） */
  size?: number;
  /** 笔宽 px，默认 1.8（老图的线约 2px 实黑，单条墨带不拆，拆了叠起来发灰） */
  strokeWidth?: number;
  /** 哪个角：四个角是四套不同的图案，默认左上角 */
  corner?: InkLatticeCorner;
  /** 晕染位移量，默认 0（不晕）；线这么细，一晕白缝就堵死 */
  bleed?: number;
}

/** 一根线：points 是折线的拐点；bold 的是实线杠（老图里两条勾边线挤成了一根，比勾边线略粗） */
interface LatticeStroke {
  points: Point[];
  bold?: boolean;
}
const poly = (...points: Point[]): LatticeStroke => ({ points });
const bar = (from: Point, to: Point): LatticeStroke => ({ points: [from, to], bold: true });
/** 网格里的一个勾边长方形 */
const rect = (x1: number, y1: number, x2: number, y2: number): LatticeStroke =>
  poly([x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]);
/** 画幅格数；老图坐标按 28 格量的，靠右 / 靠下的角要整体挪 GRID - 28 格 */
const GRID = 32;
const SHIFT: Record<InkLatticeCorner, Point> = {
  tl: [0, 0],
  tr: [GRID - 28, 0],
  br: [GRID - 28, GRID - 28],
  bl: [0, GRID - 28],
};
/** 四个角各自的线（老图上量的：TL 框角在 (6,6)、TR 在 (22,6)、BR 在 (22,22)、BL 在 (6,22)） */
const PATTERNS: Record<InkLatticeCorner, LatticeStroke[]> = {
  // 方块 A、竖杠 B、横带 C、下挂方块 D，整个回纹在上边线**下面**（老版真实截图量的：上边线中心 y=65 时 A 顶 72.5、
  // C 顶 82.5、C 底 89.5、D 底 98；A 左沿压在左边线中心上；B 只是一根 2px 实线）。
  // 线的连法也照老图：C 的左端是开口的（没有竖线），A 的右沿那根竖线一路贯穿 C、接着 D 的左沿到底；
  // C 的顶边就是 A 的底边，D 的顶边就是 C 的底边，D 的右沿就是 B。A、C 的内部在老图里是透明的——弹窗那边用 clip-path 把这块纸挖掉了
  tl: [
    rect(6, 9.95, 10.2, 15.2),
    bar([15.4, 9.95], [15.4, 23.4]),
    poly([10.2, 15.2], [21, 15.2], [21, 18.9], [6, 18.9]),
    poly([10.2, 15.2], [10.2, 23.35], [15.5, 23.35]),
  ],
  // 竖杠 B、中间方块 E、探出框外的小方 F、横带 C、下挂方块 D（老版真实截图放大 6.5 倍量的，原点在框角：
  // 上边线中心 y=0、右边线中心 x=0；B 在左 17.9px 处，C 顶 10.9、C 底 18.2，D 底 29.5，E 右沿 / F 左沿在右 0.9px，F 顶在上 5.6px）。
  // 连法：B 是一根实线，从上边线扎下来直到 D 底；D 的右沿和 E 的左沿是同一根竖线、贯穿 C；E 的顶边和 F 的底边是同一根横线；
  // F 的左沿接着往下就是 E 的右沿、止于 C 顶；C 的右端是开口的（E 右沿到右边线起笔处之间没有竖线），C 底往右并进右边线。
  // B 右边、C 底以上那一整块（含 C 的中段、E 的里面）老图是没有纸的——弹窗那边用 clip-path 挖掉
  tr: [
    bar([13.04, 5.4], [13.04, 20.75]),
    poly([13.04, 20.75], [17.82, 20.75], [17.82, 5.64]),
    poly([17.82, 5.64], [27.5, 5.64], [27.5, 3.2], [22.44, 3.2], [22.44, 11.4]),
    poly([22.6, 11.4], [8.8, 11.4], [8.8, 15.1], [22.7, 15.1]),
  ],
  // 井字回纹，是左下那套的镜像（老版真实截图放大 10 倍量的，原点在框角：右边线中心 x=0、下边线中心 y=0；框角在网格 (22,22)，
  // 负坐标是探到画幅 28 格之外）。竖线从右到左：V5 在左 9.2px（分上下两段，H2 到 H3 之间断开）、V4 18.7（实线、贯到下边线）、
  // V3 27.1、V2 34.2、V1 44.3；横线从上到下：H1 在上 48.3px（V4 到 V5）、H2 39.2（V2 到 V5）、H3 29.7（V5 起、左端开口）、
  // H4 18（右边线到 V1）、H5 10.7（V3 到右下小方右沿）、左下小方底 8.7（V1 到 V2）、右下小方底压在下边线上。
  // 右边线在 H4 停笔、下边线在 V4 停笔；V4 右边、H4 以下整块（含右下小方）老图没有纸——弹窗那边用 clip-path 挖掉
  br: [
    poly([17.42, 2.4], [17.42, -2.16], [12.63, -2.16]),
    bar([12.63, -2.7], [12.63, 22.6]),
    poly([8.47, -2.65], [8.47, 16.63]),
    poly([17.42, 2.4], [4.9, 2.4], [4.9, 17.63]),
    poly([17.42, 22.16], [17.42, 7.15], [-0.85, 7.15]),
    poly([22.5, 13], [-0.17, 13], [-0.17, 17.63], [4.9, 17.63]),
    poly([8.47, 16.63], [22, 16.63], [22, 22.16], [17.42, 22.16]),
  ],
  // 井字回纹（老版真实截图放大 8.75 倍量的，原点在框角：左边线中心 x=0、下边线中心 y=0；框角在网格 (6,22)，负 y 是探到画幅 28 格之上）。
  // 竖线从左到右：V1 在右 8.9px（分上下两段，中间 H2 到 H3 之间是断的）、V2 18.7（一根实线、贯到下边线）、V3 27.1、V4 34.3、V5 44.5；
  // 横线从上到下：H1 在上 48.2px（只在 V1、V2 之间）、H2 39.6（V1 到 V4）、H3 29.6（V1 起、右端开口）、H4 17.9（左边线起、右端开口）、
  // H5 10.7（左边线到 V3）、H6 8.5（V4 到 V5）、H7 压在下边线上（左边线到 V1）。
  // 左边线在 H4 停笔、下边线从 V2 起笔；左边线和 H5、H7、V1 围出的小方，还有 V1、V2 之间 H4 以下那块，老图是没有纸的——弹窗那边用 clip-path 挖掉
  bl: [
    poly([10.45, 2.2], [10.45, -2.1], [15.32, -2.1]),
    bar([15.32, -2.7], [15.32, 22.5]),
    poly([19.53, -2.7], [19.53, 16.9]),
    poly([10.45, 2.2], [23.14, 2.2], [23.14, 17.9]),
    poly([10.45, 22.42], [10.45, 7.2], [28.86, 7.2]),
    poly([5.5, 13.04], [28.86, 13.04]),
    poly([28.26, 13.04], [28.26, 17.73], [23.14, 17.73]),
    poly([19.53, 16.65], [6, 16.65], [6, 22.42], [10.45, 22.42]),
  ],
};

const cache = new Map<string, string>();

export function inkLatticeUrl(options: InkLatticeOptions = {}): string {
  const seed = options.seed ?? 1;
  const size = options.size ?? 64;
  const strokeWidth = options.strokeWidth ?? 1.8;
  const corner = options.corner ?? "tl";
  const bleed = options.bleed ?? 0;
  const key = `${seed}:${size}:${strokeWidth}:${corner}:${bleed}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rng = createRng(seed * 31 + 7);
  const unit = size / GRID;
  const [dx, dy] = SHIFT[corner];
  const body = PATTERNS[corner]
    .map((stroke) => {
      const path = samplePath(
        stroke.points.map(([x, y]) => [(x + dx) * unit, (y + dy) * unit] as Point),
        rng,
        { wobble: strokeWidth * 0.1, spacing: 2 },
      );
      const width = stroke.bold ? strokeWidth * 1.3 : strokeWidth;
      return paintBrush(
        path,
        { strokeWidth: width, roughness: 0.05, flyingWhite: 0, ribbons: 1, profile: evenProfile },
        rng,
      );
    })
    .join("");
  const svg = svgDoc(
    { width: size, height: size },
    `${bleed > 0 ? bleedFilter("b", seed, { scale: bleed }) : ""}<g${bleed > 0 ? ' filter="url(#b)"' : ""}>${body}</g>`,
  );
  const url = svgToDataUrl(svg);
  cache.set(key, url);
  return url;
}
