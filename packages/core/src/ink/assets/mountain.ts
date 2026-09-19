/**
 * 宣纸底部的远山：照旧站 shuimo-ui 0.3 那八张手绘远山 webp 的结构生成，一侧一组、一组四层。
 *
 * 旧图量出来的结构（每层一张图，从后往前）：
 * - base：最高最宽，青绿渲染；mid：矮六成、靠外侧；front：外侧角上一座小山，深一档的灰绿、半透明；
 *   front2：往里偏一点的一座中等尖峰。最高的山在最后面，越往前越矮、越深、越清楚。
 * - 每层上沿一条黑线（真笔触：旧图抠出来的墨线，见 mountain-brushes.ts，一段段弯到生成的山脊上），
 *   线下是山体，最浓在线下方，往下顺着脊线的走势淡进雾里（alpha 曲线按旧图量的）；
 *   山体里有大块亮斑和竖向水痕，云雾盖在最上面把山连线一起盖住；细线（皴）是断续的干笔。
 * - 山脊是一条连绵的线：峰按位置排成一串，相邻两峰之间落到鞍部就又抬起来；坡度封顶 0.85（钝三角，不是针），
 *   坡线上叠三层噪声——褶皱（峰顶附近密、坡下段稀）、中等起伏、细碎锯齿。
 *
 * 每层输出四张 alpha 遮罩，颜色由 CSS 上：`silhouette`（垫纸色，挡住后面那层）→ `wash`（山体，青绿层上青绿、
 * 前景层上深一档）→ `line`（墨）→ `mist`（纸色的云雾，盖在最上面）。
 */
import { createNoise1D, createRng, type Rng } from "../random";
import { compactPath, fmt, svgDoc, svgToDataUrl, type Point } from "./brush";
import { MOUNTAIN_BRUSH_LINES, MOUNTAIN_BRUSH_MARKS } from "./mountain-brushes";

/** 一条真笔触：从旧图抠出来的墨块，顶点是 (u 沿线位置 0..1, v 离中线偏移 / 长度)，len 是它在旧图里的像素长度 */
export interface BrushStroke {
  len: number;
  thick: number;
  polys: [number, number][][];
}

export interface BrushLib {
  /** 山脊轮廓用的长线段 */
  line: BrushStroke[];
  /** 皴用的短笔 */
  mark: BrushStroke[];
}

/** 真笔触按旧图那一组的宽缩放（旧图 1px = 4096 宽画幅的 1 单位，左组 1772、右组 2273 宽） */
const BRUSH_SOURCE_WIDTH = { left: 1772, right: 2273 } as const;

export interface MountainSceneOptions {
  seed?: number;
  side: "left" | "right";
  /** 一组的画幅（四层共用同一个画幅），默认 1800 × 610（和旧图 2.95 : 1 一致） */
  width?: number;
  height?: number;
}

export type MountainRole = "wash" | "ink";

export interface MountainLayer {
  name: string;
  /** wash：山体上青绿；ink：前景那两座，上比青绿深一档的灰绿（旧图颜料 ≈ (59,69,66)），脊线那道墨另算 */
  role: MountainRole;
  /** 视差系数（旧站：base 0.3、mid 0.8、front 1） */
  parallax: number;
  line: string;
  wash: string;
  silhouette: string;
  /** 盖在最上面的雾（上纸色）：旧图里山体上的空白不是留白，是云雾把山连线一起盖住了 */
  mist: string;
}

export interface MountainScene {
  width: number;
  height: number;
  layers: MountainLayer[];
}

interface LayerSpec {
  name: string;
  role: MountainRole;
  parallax: number;
  /** 峰摆放的横向范围，按组宽比例，从外侧边缘量起 */
  span: [number, number];
  /** 主峰峰顶的高度（占画幅高的比例，从上往下量） */
  top: number;
  /** 其他峰峰顶最低到哪 */
  low: number;
  /** 峰数范围 */
  peaks: [number, number];
  /** 主峰在 span 里的位置（0 外侧 1 内侧） */
  mainAt: number;
  /** 轮廓笔宽（占组宽比例） */
  lineWeight: number;
  /** 山体 alpha 随「脊线以下深度 / 画幅高」的变化，末点必须是 0 */
  fade: [number, number][];
  /** 入体段最多几条 */
  continuations: number;
  /** 画不画次山脊 */
  spur: boolean;
  /** 山体里的亮斑个数（雾从山里透出来） */
  holes: [number, number];
  /** 线的整体浓度 */
  lineAlpha: number;
  /** 峰的陡峭程度范围（dy/dx）：越大越尖 */
  steep: [number, number];
  /** 主峰旁边紧挨着的卫峰个数 */
  satellites: [number, number];
}

const LAYERS: LayerSpec[] = [
  {
    name: "base",
    role: "wash",
    parallax: 0.3,
    span: [0, 1],
    top: 0.03,
    low: 0.7,
    peaks: [4, 6],
    mainAt: 0.3,
    lineWeight: 0.0075,
    continuations: 2,
    spur: true,
    holes: [2, 3],
    lineAlpha: 0.95,
    steep: [0.6, 1],
    satellites: [1, 2],
    fade: [
      [0, 0.82],
      [0.1, 0.8],
      [0.2, 0.55],
      [0.3, 0.42],
      [0.5, 0.26],
      [0.7, 0.1],
      [0.9, 0],
    ],
  },
  {
    name: "mid",
    role: "wash",
    parallax: 0.8,
    span: [0, 0.66],
    top: 0.5,
    low: 0.66,
    peaks: [4, 6],
    mainAt: 0.35,
    lineWeight: 0.005,
    continuations: 1,
    spur: true,
    holes: [1, 2],
    lineAlpha: 0.75,
    steep: [0.45, 0.8],
    satellites: [0, 1],
    fade: [
      [0, 0.85],
      [0.06, 0.72],
      [0.12, 0.56],
      [0.18, 0.41],
      [0.3, 0.11],
      [0.42, 0],
    ],
  },
  {
    name: "front",
    role: "ink",
    parallax: 1,
    span: [0, 0.28],
    top: 0.55,
    low: 0.68,
    peaks: [1, 1],
    mainAt: 0.35,
    lineWeight: 0.0095,
    continuations: 1,
    spur: false,
    holes: [0, 0],
    lineAlpha: 1,
    steep: [0.6, 1],
    satellites: [0, 0],
    fade: [
      [0, 0.98],
      [0.04, 0.8],
      [0.12, 0.68],
      [0.22, 0.6],
      [0.32, 0.4],
      [0.42, 0.12],
      [0.5, 0],
    ],
  },
  {
    name: "front2",
    role: "ink",
    parallax: 1,
    span: [0.28, 0.75],
    top: 0.5,
    low: 0.62,
    peaks: [1, 2],
    mainAt: 0.4,
    lineWeight: 0.0088,
    continuations: 1,
    spur: false,
    holes: [0, 1],
    lineAlpha: 1,
    steep: [0.7, 1.1],
    satellites: [0, 1],
    fade: [
      [0, 0.98],
      [0.04, 0.78],
      [0.12, 0.65],
      [0.22, 0.56],
      [0.32, 0.38],
      [0.42, 0.12],
      [0.5, 0],
    ],
  },
];

/* ───────────────────────── 几何：锥形峰 ───────────────────────── */

interface Peak {
  apex: Point;
  flanks: [Point[], Point[]];
  /** 前后次序，越大越靠前 */
  z: number;
  /** 采样网格上每个 x 处的 y（Infinity = 不覆盖） */
  ys: number[];
}

interface Range {
  peaks: Peak[];
  envelope: number[];
  xs: number[];
}

const GRID = 4;

/** 从峰顶往一侧落下去的棱线：坡度随噪声变化，偶尔一段平台，直到画幅底下 */
function flank(
  rng: Rng,
  start: Point,
  dir: 1 | -1,
  height: number,
  width: number,
  steep: number,
): Point[] {
  const noise = createNoise1D(rng, 32);
  const pts: Point[] = [start];
  let [x, y] = start;
  let u = rng() * 10;
  const floor = height + 20;
  let n = 0;
  while (y < floor && x > -width * 0.3 && x < width * 1.3) {
    const step = height * (0.025 + rng() * 0.03);
    n++;
    const r = rng();
    if (r < 0.08) {
      // 台阶：几乎不下降，横着走一小段
      x += dir * step * (1.2 + rng());
      y += step * 0.08;
    } else if (r < 0.15 && n > 2) {
      // 小起伏：往上顶一下再接着落
      x += dir * step * 0.5;
      y -= step * (0.3 + rng() * 0.4);
    } else {
      // 坡基本是直的，只有一点起伏；坡度封顶 0.85，山顶才是钝三角不是针
      const slope = Math.max(0.3, Math.min(0.85, steep * (0.85 + 0.3 * noise(u))));
      x += (dir * step) / slope;
      y += step;
    }
    u += 0.7;
    pts.push([x, y]);
  }
  return roughen(rng, pts, height, width);
}

/**
 * 坡线的细碎起伏：大势是直的，沿线叠三个倍频的分形噪声做纵向位移（旧图的坡线是直的大势 + 密密的小锯齿）。
 * 先按 0.5% 画幅宽重新采样，再加位移；峰顶那一段淡入，尖本身不动。
 */
function roughen(rng: Rng, pts: Point[], height: number, width: number): Point[] {
  const octaves = [createNoise1D(rng, 64), createNoise1D(rng, 64), createNoise1D(rng, 64)];
  // 三层：褶皱（3.5% 高、间隔约 6% 宽，脊状、尖朝上，页面缩小后还看得见）、中等起伏、细碎锯齿
  const amps = [height * 0.035, height * 0.01, height * 0.005];
  const freqs = [1, 3.1, 9.7];
  const phase = rng() * 50;
  const ds = width * 0.005;
  const unit = width * 0.06;
  const out: Point[] = [pts[0]!];
  // 沿折线按弧长等距取点。褶皱的密度按高度走：越靠近峰顶越密（相位走得快）、幅度也大一点，坡下段稀
  let segStart = 0;
  let next = ds;
  let phi = 0;
  let prevArc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]!;
    const [x1, y1] = pts[i + 1]!;
    const len = Math.hypot(x1 - x0, y1 - y0) || 1e-6;
    while (next <= segStart + len) {
      const t = (next - segStart) / len;
      const y = y0 + (y1 - y0) * t;
      const h = Math.min(1, Math.max(0, y / height)); // 0 峰顶 1 山脚
      const density = 1.7 - 1.1 * h; // 峰顶 1.7 倍、山脚 0.6 倍
      phi += ((next - prevArc) / unit) * density;
      prevArc = next;
      const fade = Math.min(1, next / (height * 0.05));
      let off = 0;
      for (let k = 0; k < 3; k++) {
        const n = octaves[k]!(phase + (k === 0 ? phi : (next / unit) * freqs[k]!));
        // 最大和最细的两层用脊状噪声（1 − 2|n|）：折出来的是尖角不是圆弧；取负号让尖朝天
        const a = k === 0 ? amps[0]! * (1.25 - 0.5 * h) : amps[k]!;
        off += a * (k === 1 ? n : -(1 - 2 * Math.abs(n)));
      }
      out.push([x0 + (x1 - x0) * t, y + off * fade]);
      next += ds;
    }
    segStart += len;
  }
  out.push(pts[pts.length - 1]!);
  return out;
}

function yAt(pts: Point[], x: number, dir: 1 | -1): number {
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  if (dir === 1 ? x < first[0] || x > last[0] : x > first[0] || x < last[0]) return Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    const inside = dir === 1 ? x >= a[0] && x <= b[0] : x <= a[0] && x >= b[0];
    if (inside) {
      const span = b[0] - a[0] || 1e-6;
      return a[1] + ((x - a[0]) / span) * (b[1] - a[1]);
    }
  }
  return Infinity;
}

/** 按层的规格摆峰：主峰在 mainAt，其余峰在 span 里散开、更矮；随机前后 */
/** 峰顶到鞍部（或到画幅底）的一段棱线：大势是直线，带一点蜿蜒，再叠细碎锯齿 */
function ridgeSegment(rng: Rng, a: Point, b: Point, height: number, width: number): Point[] {
  const noise = createNoise1D(rng, 16);
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const n = Math.max(3, Math.round(len / (height * 0.05)));
  const nx = -(b[1] - a[1]) / len;
  const ny = (b[0] - a[0]) / len;
  const phase = rng() * 10;
  const pts: Point[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // 两端不偏，中间蜿蜒 ±3% 画幅高
    const off = noise(phase + t * 4) * height * 0.03 * Math.sin(t * Math.PI);
    pts.push([a[0] + (b[0] - a[0]) * t + nx * off, a[1] + (b[1] - a[1]) * t + ny * off]);
  }
  return roughen(rng, pts, height, width);
}

/**
 * 按层的规格摆峰：一条连绵的山脊线——峰按 x 排成一串，相邻两峰之间落到鞍部就又抬起来，
 * 只有最外面两端才落到画幅底。主峰旁边再塞几座锥形的「背景峰」：露出来的是小尖，藏进山体的那截棱线就是皴。
 */
function buildRange(
  rng: Rng,
  spec: LayerSpec,
  width: number,
  height: number,
  side: "left" | "right",
): Range {
  const xs: number[] = [];
  for (let x = 0; x <= width; x += GRID) xs.push(x);
  const count = spec.peaks[0] + Math.floor(rng() * (spec.peaks[1] - spec.peaks[0] + 1));
  const [s0, s1] = spec.span;
  // 峰的横向位置（0 外侧 1 内侧）：主峰固定，其余均匀散开再抖一抖
  const slots: number[] = [];
  for (let i = 0; i < count; i++) slots.push((i + 0.5) / count + (rng() - 0.5) * (0.6 / count));
  let main = 0;
  for (let i = 1; i < count; i++)
    if (Math.abs(slots[i]! - spec.mainAt) < Math.abs(slots[main]! - spec.mainAt)) main = i;
  slots[main] = spec.mainAt + (rng() - 0.5) * 0.06;

  // 先定每个峰的峰顶
  const apexes: { apex: Point; steep: number }[] = [];
  for (let i = 0; i < count; i++) {
    const t = s0 + (s1 - s0) * slots[i]!;
    const x = side === "left" ? t * width : (1 - t) * width;
    const dist = Math.abs(slots[i]! - spec.mainAt);
    const y =
      i === main
        ? spec.top * height
        : (spec.top + (spec.low - spec.top) * Math.min(1, 0.3 + dist * 1.6 + rng() * 0.3)) * height;
    apexes.push({ apex: [x, y], steep: spec.steep[0] + rng() * (spec.steep[1] - spec.steep[0]) });
  }
  apexes.sort((a, b) => a.apex[0] - b.apex[0]);
  // 连绵：从主峰往两边推，相邻峰顶的高差不许超过横向距离的 0.3 倍——矮的那座抬上来。
  // 鞍部在两峰中间，坡度封顶 0.85，所以高差最多只能是距离的一小半，不然中间那段坡就陡成针
  let mainIdx = 0;
  apexes.forEach((a, i) => {
    if (a.apex[1] < apexes[mainIdx]!.apex[1]) mainIdx = i;
  });
  for (let i = mainIdx + 1; i < apexes.length; i++) {
    const prev = apexes[i - 1]!.apex;
    const cur = apexes[i]!.apex;
    cur[1] = Math.min(cur[1], prev[1] + 0.3 * Math.abs(cur[0] - prev[0]));
  }
  for (let i = mainIdx - 1; i >= 0; i--) {
    const prev = apexes[i + 1]!.apex;
    const cur = apexes[i]!.apex;
    cur[1] = Math.min(cur[1], prev[1] + 0.3 * Math.abs(cur[0] - prev[0]));
  }

  // 相邻两峰之间的鞍部：比矮的那座再低 20%–55% 的剩余高度，x 偏向矮的那边
  const saddles: Point[] = [];
  for (let i = 0; i < apexes.length - 1; i++) {
    const A = apexes[i]!.apex;
    const B = apexes[i + 1]!.apex;
    const lowY = Math.max(A[1], B[1]);
    const towardLow = A[1] > B[1] ? 0.4 : 0.6;
    const x = A[0] + (B[0] - A[0]) * (towardLow + (rng() - 0.5) * 0.2);
    // 鞍部不能让两边的坡陡过 0.85（顶角 ≥ 100°）；实在挤就只比矮峰低一点
    const cap = Math.min(A[1] + 0.85 * Math.abs(x - A[0]), B[1] + 0.85 * Math.abs(x - B[0]));
    const want = lowY + (0.2 + rng() * 0.35) * (height * 0.95 - lowY);
    const y = Math.max(lowY + height * 0.03, Math.min(want, cap));
    saddles.push([x, y]);
  }

  const peaks: Peak[] = [];
  apexes.forEach(({ apex, steep }, i) => {
    const left =
      i === 0
        ? flank(rng, apex, -1, height, width, steep * (0.85 + rng() * 0.3))
        : ridgeSegment(rng, apex, saddles[i - 1]!, height, width);
    const right =
      i === apexes.length - 1
        ? flank(rng, apex, 1, height, width, steep * (0.85 + rng() * 0.3))
        : ridgeSegment(rng, apex, saddles[i]!, height, width);
    const flanks: [Point[], Point[]] = [left, right];
    // 主链上的峰同一个前后位置，都在背景峰前面
    const z = 1 + (rng() - 0.5) * 0.1;
    const ys = xs.map((sx) => Math.min(yAt(flanks[0], sx, -1), yAt(flanks[1], sx, 1)));
    peaks.push({ apex, flanks, z, ys });
  });

  // 背景峰：锥形，两条棱线一直落到底，藏在主链后面；紧挨着主峰、比主峰矮一截
  const mainApex = apexes.reduce((m, a) => (a.apex[1] < m.apex[1] ? a : m)).apex;
  const satCount =
    spec.satellites[0] + Math.floor(rng() * (spec.satellites[1] - spec.satellites[0] + 1));
  for (let k = 0; k < satCount; k++) {
    const dir =
      k === 0 ? (rng() < 0.5 ? -1 : 1) : (mainApex[0] < width / 2 ? 1 : -1) * (k % 2 ? -1 : 1);
    const x = mainApex[0] + dir * width * (0.09 + rng() * 0.1);
    const y = mainApex[1] + height * (0.14 + rng() * 0.16);
    const apex: Point = [x, y];
    const steep = spec.steep[0] + rng() * (spec.steep[1] - spec.steep[0]);
    const flanks: [Point[], Point[]] = [
      flank(rng, apex, -1, height, width, steep * (0.85 + rng() * 0.3)),
      flank(rng, apex, 1, height, width, steep * (0.85 + rng() * 0.3)),
    ];
    const z = rng() * 0.5;
    const ys = xs.map((sx) => Math.min(yAt(flanks[0], sx, -1), yAt(flanks[1], sx, 1)));
    peaks.push({ apex, flanks, z, ys });
  }
  peaks.sort((a, b) => a.z - b.z);
  const envelope = xs.map((_, k) => Math.min(height + 20, ...peaks.map((p) => p.ys[k]!)));
  return { peaks, envelope, xs };
}

function coveredByNearer(range: Range, peak: Peak, x: number, y: number): boolean {
  const k = Math.round(x / GRID);
  for (const q of range.peaks) {
    if (q === peak || q.z <= peak.z) continue;
    const qy = q.ys[k];
    if (qy !== undefined && qy < y - 0.5) return true;
  }
  return false;
}

interface Strokes {
  outer: Point[][];
  inner: Point[][];
}

/** 每个峰的两条棱线切成「轮廓段」和「入体段」：入体段从被挡住处起，再走 8%–28% 画幅高就收 */
function splitFlanks(rng: Rng, range: Range, height: number): Strokes {
  const outer: Point[][] = [];
  const inner: Point[][] = [];
  for (const peak of range.peaks) {
    for (const f of peak.flanks) {
      let run: Point[] = [];
      let hidden: Point[] | null = null;
      let hiddenLen = 0;
      const limit = height * (0.08 + rng() * 0.2);
      for (const [x, y] of f) {
        const covered = coveredByNearer(range, peak, x, y) || y > height + 5;
        if (!covered && !hidden) {
          run.push([x, y]);
          continue;
        }
        if (!hidden) {
          if (run.length >= 2) outer.push(run);
          hidden = run.length ? [run[run.length - 1]!] : [];
          run = [];
        }
        if (y > height + 5) break;
        const prev = hidden[hidden.length - 1];
        hidden.push([x, y]);
        if (prev) hiddenLen += Math.hypot(x - prev[0], y - prev[1]);
        if (hiddenLen >= limit) break;
      }
      if (run.length >= 2) outer.push(run);
      if (hidden && hidden.length >= 2) inner.push(hidden);
    }
  }
  return { outer, inner };
}

function envAt(range: Range, x: number): number {
  const k = Math.max(0, Math.min(range.envelope.length - 1, Math.round(x / GRID)));
  return range.envelope[k]!;
}

/**
 * 次山脊：山体里那条更靠前、更矮的山脊线——从主峰侧坡上的山肩出发斜插下去，落到谷底，
 * 再抬起来接到下一座峰的侧坡；自己带小起伏；画的时候是干笔、一段一段断着的。
 */
function secondaryRidge(rng: Rng, range: Range, width: number, height: number): Point[][] {
  const shoulders: { x: number; y: number }[] = [];
  for (const p of range.peaks) {
    const dir: 1 | -1 = rng() < 0.5 ? -1 : 1;
    const f = p.flanks[dir === -1 ? 0 : 1];
    const i = Math.floor(f.length * (0.25 + rng() * 0.3));
    const pt = f[Math.min(i, f.length - 1)]!;
    const y = pt[1] < envAt(range, pt[0]) + 2 ? pt[1] : envAt(range, pt[0]);
    if (y < height) shoulders.push({ x: pt[0], y });
  }
  shoulders.sort((a, b) => a.x - b.x);
  if (shoulders.length < 2) return [];

  const path: Point[] = [];
  for (let i = 0; i < shoulders.length - 1; i++) {
    const A = shoulders[i]!;
    const B = shoulders[i + 1]!;
    const span = B.x - A.x;
    if (span < width * 0.05) continue;
    const downFrac = 0.55 + rng() * 0.17;
    const slope = 0.5 + rng() * 0.45;
    const valleyX = A.x + span * downFrac;
    const valleyY = A.y + span * downFrac * slope;
    const down = Math.max(4, Math.round((span * downFrac) / (width * 0.035)));
    for (let k = 0; k <= down; k++) {
      const t = k / down;
      path.push([A.x + (valleyX - A.x) * t, A.y + (valleyY - A.y) * t]);
    }
    const up = Math.max(3, Math.round((B.x - valleyX) / (width * 0.035)));
    for (let k = 1; k <= up; k++) {
      const t = k / up;
      path.push([valleyX + (B.x - valleyX) * t, valleyY + (B.y - valleyY) * t]);
    }
  }
  if (path.length < 4) return [];

  const jag: Point[] = [path[0]!];
  for (let i = 0; i < path.length - 1; i++) {
    const [x0, y0] = path[i]!;
    const [x1, y1] = path[i + 1]!;
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const nx = -(y1 - y0) / len;
    const ny = (x1 - x0) / len;
    const upSign = ny < 0 ? 1 : -1;
    const peak = rng() < 0.65;
    const off =
      (peak ? upSign : -upSign) * height * (peak ? 0.02 + rng() * 0.035 : 0.006 + rng() * 0.014);
    jag.push([x0 + (x1 - x0) * 0.5 + nx * off, y0 + (y1 - y0) * 0.5 + ny * off]);
    jag.push([x1, y1]);
  }
  for (const pt of jag) pt[1] = Math.max(envAt(range, pt[0]) + 3, pt[1]);

  const frags: Point[][] = [];
  let i = 0;
  while (i < jag.length - 1) {
    const len = 2 + Math.floor(rng() * 4);
    const seg = jag.slice(i, i + len + 1).filter(([, y]) => y < height);
    if (seg.length >= 2) frags.push(seg);
    i += len + 1 + Math.floor(rng() * 3);
  }
  return frags;
}

/* ───────────────────────── 真笔触：弯到折线上 ───────────────────────── */

interface Arc {
  at: (d: number) => { p: Point; n: Point };
  total: number;
}

/** 折线按弧长取点：d 超出两端就沿端点切线延长 */
function arcOf(pts: Point[]): Arc {
  const cum = [0];
  for (let i = 1; i < pts.length; i++)
    cum.push(cum[i - 1]! + Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]));
  const total = cum[cum.length - 1]!;
  const tangent = (i: number): Point => {
    const a = pts[Math.max(0, i)]!;
    const b = pts[Math.min(pts.length - 1, i + 1)]!;
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  };
  return {
    total,
    at(d) {
      let i = 0;
      while (i < cum.length - 2 && cum[i + 1]! < d) i++;
      const a = pts[i]!;
      const t = tangent(i);
      const off = d - cum[i]!;
      return { p: [a[0] + t[0] * off, a[1] + t[1] * off], n: [-t[1], t[0]] };
    },
  };
}

/** 一条真笔触弯到折线的 [from, from + len] 上 */
function bendStroke(
  stroke: BrushStroke,
  arc: Arc,
  from: number,
  len: number,
  flip: boolean,
): string {
  let d = "";
  for (const poly of stroke.polys) {
    const pts: Point[] = poly.map(([u, v]) => {
      const { p, n } = arc.at(from + u * len);
      const off = (flip ? -1 : 1) * v * len;
      return [p[0] + n[0] * off, p[1] + n[1] * off];
    });
    d += `<path d="${compactPath(pts, true)}" fill="#000"/>`;
  }
  return d;
}

/** 沿一条折线铺真笔触：一条接一条，首尾略搭一点或留一点空，最后一笔可以探出去一截 */
function layStrokes(rng: Rng, lib: BrushStroke[], seg: Point[], k: number, lenScale = 1): string {
  if (lib.length === 0 || seg.length < 2) return "";
  const arc = arcOf(seg);
  // 笔触的锯齿一律朝天：折线往左走时法线是朝下的，要翻一下
  const flip = seg[seg.length - 1]![0] < seg[0]![0];
  let out = "";
  let pos = 0;
  let guard = 0;
  while (pos < arc.total * 0.97 && guard++ < 200) {
    const remain = arc.total - pos;
    let stroke = lib[Math.floor(rng() * lib.length)]!;
    // 剩的不多了就挑一条短的
    for (let tries = 0; tries < 6 && stroke.len * k * lenScale > remain * 1.3; tries++)
      stroke = lib[Math.floor(rng() * lib.length)]!;
    const len = stroke.len * k * lenScale;
    if (len > remain * 1.3) break;
    out += bendStroke(stroke, arc, pos, len, flip);
    pos += len * (0.9 + rng() * 0.2);
  }
  return out;
}

/* ───────────────────────── 渲染 ───────────────────────── */

function generateMountainScene(options: MountainSceneOptions): MountainScene {
  const seed = options.seed ?? 1;
  const width = options.width ?? 1800;
  const height = options.height ?? 610;
  const side = options.side;
  const brushes: BrushLib = { line: MOUNTAIN_BRUSH_LINES, mark: MOUNTAIN_BRUSH_MARKS };
  // 再收到 0.85：页面上线要比旧图细一点
  const brushScale = (0.85 * width) / BRUSH_SOURCE_WIDTH[side];
  const rng = createRng(seed * 31 + (side === "left" ? 7 : 13));

  const layers: MountainLayer[] = [];
  LAYERS.forEach((spec, li) => {
    const range = buildRange(rng, spec, width, height, side);
    const strokeWidth = width * spec.lineWeight;
    const envPts: Point[] = range.xs.map((x, k): Point => [x, range.envelope[k]!]);
    const outline = compactPath([...envPts, [width, height + 20], [0, height + 20]], true);
    const ink = spec.role === "ink";

    /** 四张图共用的 defs（山体剪裁、雾遮罩）；各图专属的分开放，别让每张图都背着全部滤镜 */
    const defs: string[] = [];
    const defsLine: string[] = [];
    const defsWash: string[] = [
      // 山体：大块亮斑（低频、对比强）× 竖向水痕（x 高频 y 低频）× 纸纹；再轻微位移、化开
      `<filter id="wash" x="-5%" y="-10%" width="110%" height="120%" color-interpolation-filters="sRGB">` +
        `<feTurbulence type="fractalNoise" baseFrequency="${ink ? "0.006 0.01" : "0.004 0.008"}" numOctaves="2" seed="${seed * 7 + li}" result="n"/>` +
        `<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${ink ? "0.9 0 0 0 0.45" : "1.8 0 0 0 -0.15"}" result="low"/>` +
        `<feTurbulence type="fractalNoise" baseFrequency="0.03 0.004" numOctaves="2" seed="${seed * 7 + li + 3}" result="n1"/>` +
        `<feColorMatrix in="n1" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${ink ? "0.35 0 0 0 0.8" : "0.6 0 0 0 0.65"}" result="streak"/>` +
        `<feTurbulence type="fractalNoise" baseFrequency="0.09 0.06" numOctaves="2" seed="${seed * 7 + li + 5}" result="n2"/>` +
        `<feColorMatrix in="n2" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.4 0 0 0 0.78" result="fine"/>` +
        `<feComposite in="low" in2="streak" operator="in" result="m1"/>` +
        `<feComposite in="m1" in2="fine" operator="in" result="mod"/>` +
        `<feComposite in="SourceGraphic" in2="mod" operator="in" result="m"/>` +
        `<feTurbulence type="fractalNoise" baseFrequency="0.02 0.03" numOctaves="2" seed="${seed + 40 + li}" result="n3"/>` +
        `<feDisplacementMap in="m" in2="n3" scale="5" xChannelSelector="R" yChannelSelector="G" result="d"/>` +
        `<feGaussianBlur in="d" stdDeviation="1"/></filter>`,
      `<filter id="soft" x="-5%" y="-10%" width="110%" height="130%"><feGaussianBlur stdDeviation="${fmt(height * 0.008)}"/></filter>`,
    ];
    defs.push(
      // 带子的边羽化掉，不然是一圈圈等高线
      `<filter id="feather" x="-5%" y="-10%" width="110%" height="130%"><feGaussianBlur stdDeviation="${fmt(height * 0.02)}"/></filter>`,
      `<clipPath id="body"><path d="${outline}"/></clipPath>`,
    );
    const defsSil: string[] = [];
    const defsMist: string[] = [];

    /* ── 山体：顺着脊线往下的一串带子，alpha 照量出来的曲线走 ── */
    // 带子反正要羽化，轮廓每 3 个点取 1 个就够（末点保留）
    const coarse = envPts.filter((_, i) => i % 3 === 0 || i === envPts.length - 1);
    const band = (d0: number, d1: number) =>
      compactPath(
        [
          ...coarse.map(([x, y]): Point => [x, y + d0]),
          ...coarse.map(([x, y]): Point => [x, y + d1]).reverse(),
        ],
        true,
      );
    const fadeBands = (scale: number, lift: number, fill = "#000") => {
      let s = "";
      for (let i = 0; i < spec.fade.length - 1; i++) {
        const [d0, a0] = spec.fade[i]!;
        const [d1, a1] = spec.fade[i + 1]!;
        const a = Math.min(1, ((a0 + a1) / 2) * scale);
        if (a <= 0.01) continue;
        s += `<path d="${band(d0 * height - lift, d1 * height + 1)}" fill="${fill}" fill-opacity="${a.toFixed(2)}"/>`;
      }
      return s;
    };
    // 每个峰在自己轮廓下也压一条浅带：前后峰的分界从渲染里透出来
    let peakBands = "";
    for (const p of range.peaks) {
      const top: Point[] = range.xs
        .map((x, k): Point => [x, p.ys[k]!])
        .filter(([, y]) => Number.isFinite(y) && y < height + 30);
      if (top.length < 2) continue;
      const drop = height * (0.1 + rng() * 0.12);
      peakBands += `<path d="${compactPath([...top, ...top.map(([x, y]): Point => [x, y + drop]).reverse()], true)}" fill="#000" fill-opacity="${(0.25 + rng() * 0.2).toFixed(2)}"/>`;
    }
    // 亮斑：主峰身体里几团被雾吃掉的地方，挖在山体的遮罩上
    const holeCount = spec.holes[0] + Math.floor(rng() * (spec.holes[1] - spec.holes[0] + 1));
    let holes = "";
    const tall = [...range.peaks].sort((a, b) => a.apex[1] - b.apex[1]).slice(0, 2);
    for (let h = 0; h < holeCount; h++) {
      const p = tall[h % tall.length]!;
      const [ax, ay] = p.apex;
      const cx = ax + (rng() - 0.5) * width * 0.16;
      const cy = ay + height * (0.12 + rng() * 0.25);
      const rx = width * (0.03 + rng() * 0.05);
      const ry = height * (0.05 + rng() * 0.08);
      holes += `<ellipse cx="${fmt(cx)}" cy="${fmt(cy)}" rx="${fmt(rx)}" ry="${fmt(ry)}" fill="#000" fill-opacity="${(0.15 + rng() * 0.15).toFixed(2)}"/>`;
    }
    defsWash.push(
      `<filter id="holeBlur" filterUnits="userSpaceOnUse" x="${fmt(-width * 0.1)}" y="${fmt(-height * 0.2)}" width="${fmt(width * 1.2)}" height="${fmt(height * 1.5)}"><feGaussianBlur stdDeviation="${fmt(height * 0.035)}"/></filter>`,
      `<mask id="holes"><rect x="-5%" y="-5%" width="110%" height="110%" fill="#fff"/><g filter="url(#holeBlur)">${holes}</g></mask>`,
    );
    const wash =
      `<g filter="url(#wash)" clip-path="url(#body)" mask="url(#holes)">` +
      `<g filter="url(#feather)">${fadeBands(ink ? 1.5 : 1.7, 0)}<g clip-path="url(#body)">${peakBands}</g></g>` +
      // 线正下方最浓的一道
      `<g filter="url(#soft)"><path d="${band(-strokeWidth * 0.5, height * 0.035)}" fill="#000" fill-opacity="${ink ? 0.95 : 0.9}"/></g>` +
      `</g>`;
    // 剪影：同样的淡出曲线但更实，垫纸色用，把后面那层挡住
    // 剪影垫得比山体实得多：山体还看得见的地方，后面那层就该被完全挡住，只有化进雾里才透
    // 前景那两座在旧图里是半透明压在青绿上的，看起来才是青灰而不是死灰：垫底只垫一层，让后面的绿透上来
    const silhouette = `<g filter="url(#feather)" clip-path="url(#body)">${fadeBands(ink ? 1.1 : 2.4, strokeWidth)}</g>`;

    /* ── 线 ── */
    const strokes = splitFlanks(rng, range, height);
    let core = "";
    // 真笔触：旧图抠出来的线段一条条弯到轮廓上
    for (const seg of strokes.outer) core += layStrokes(rng, brushes.line, seg, brushScale);
    // 入体段：后峰的棱线插进前峰身体里那一截，起头和轮廓一样粗，越走越细
    let inner = "";
    const continuations = [...strokes.inner]
      .sort((a, b) => b.length - a.length)
      .slice(0, spec.continuations);
    for (const seg of continuations) inner += layStrokes(rng, brushes.mark, seg, brushScale, 1.2);
    // 次山脊：断成一段段的干笔；笔芯实、外圈啃成点
    let spur = "";
    const spurSegs = spec.spur ? secondaryRidge(rng, range, width, height) : [];
    for (const seg of spurSegs) spur += layStrokes(rng, brushes.mark, seg, brushScale);
    defsLine.push(
      `<filter id="crest" x="-5%" y="-10%" width="110%" height="130%"><feGaussianBlur stdDeviation="${fmt(height * 0.014)}"/></filter>`,
      `<linearGradient id="lineFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.6" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0.25"/></linearGradient>` +
        (ink
          ? `<mask id="lineMask"><rect width="${width}" height="${height}" fill="url(#lineFade)"/></mask>`
          : `<mask id="lineMask"><g filter="url(#feather)">${fadeBands(1.8, strokeWidth * 2, "#fff")}</g></mask>`),
    );
    // 轮廓下面化开的一道墨：线不是描上去的，是墨从脊线往下渗进山体
    const crest = `<g filter="url(#crest)" clip-path="url(#body)"><path d="${band(-strokeWidth * 0.3, height * (ink ? 0.025 : 0.03))}" fill="#000" fill-opacity="${ink ? 0.45 : 0.35}"/></g>`;
    const line = `<g mask="url(#lineMask)">${crest}<g fill-opacity="${spec.lineAlpha}">${core}</g><g fill-opacity="0.7">${inner}</g><g fill-opacity="0.8">${spur}</g></g>`;

    // 整组往下淡进雾里：旧图每一组底下四分之一几乎是空的；青绿层的内侧一端也化进中间的雾口
    const innerX: [number, number] = side === "left" ? [1, 0] : [0, 1];
    defs.push(
      // 前景的墨色山脊线本来就在画幅下半，底部的雾要晚一点才开始吃它，不然脊线一出来就已经是半透明的
      ink
        ? `<linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.72" stop-color="#fff"/><stop offset="0.9" stop-color="#fff" stop-opacity="0.5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`
        : `<linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.5" stop-color="#fff"/><stop offset="0.8" stop-color="#fff" stop-opacity="0.45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
      // 内侧一端化进中间的雾口：从边上 0 慢慢到 30% 处才实，边缘再用噪声撕一下
      // 渐变要用画幅坐标：按矩形包围盒算的话，0 那一档落在画幅外面，画幅边上还剩两成不透明，切口就还在
      `<linearGradient id="innerFade" gradientUnits="userSpaceOnUse" x1="${fmt(innerX[0] * width)}" y1="0" x2="${fmt(innerX[0] * width + (innerX[1] - innerX[0]) * width * 0.3)}" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.4" stop-color="#fff" stop-opacity="0.3"/><stop offset="1" stop-color="#fff"/></linearGradient>`,
      `<filter id="fogEdge" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.02" numOctaves="3" seed="${seed + 90 + li}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${fmt(height * 0.2)}" xChannelSelector="R" yChannelSelector="G"/></filter>`,
      // 两个遮罩分开套（遮罩里画第二个矩形会盖掉第一个，不是相乘）
      `<mask id="fog"><g filter="url(#fogEdge)"><rect x="-10%" y="-10%" width="120%" height="120%" fill="url(#bottomFade)"/></g></mask>`,
      `<mask id="inner"><g filter="url(#fogEdge)"><rect x="-10%" y="-10%" width="120%" height="120%" fill="url(#innerFade)"/></g></mask>`,
    );
    const wrap = (inner: string, fog: boolean) => {
      const withInner = `<g mask="url(#inner)">${inner}</g>`;
      return fog ? `<g mask="url(#fog)">${withInner}</g>` : withInner;
    };
    /* ── 雾：盖在线上面 ── */
    let mistShapes = "";
    const mistCount = ink ? 1 + Math.floor(rng() * 2) : 3 + Math.floor(rng() * 3);
    for (let m = 0; m < mistCount; m++) {
      const p = tall[m % tall.length]!;
      const [ax, ay] = p.apex;
      const low = m >= 2; // 后面的几团压在山脚
      const cx = ax + (rng() - 0.5) * width * (low ? 0.5 : 0.2);
      const cy = low ? height * (0.6 + rng() * 0.25) : ay + height * (0.15 + rng() * 0.3);
      const rx = width * (low ? 0.08 + rng() * 0.08 : 0.06 + rng() * 0.06);
      const ry = height * (low ? 0.07 + rng() * 0.05 : 0.06 + rng() * 0.06);
      // 一团雾 = 两三个错开的扁椭圆，边上薄、中间厚
      const parts = 2 + Math.floor(rng() * 2);
      for (let q = 0; q < parts; q++) {
        const dx = (rng() - 0.5) * rx * 0.9;
        const dy = (rng() - 0.5) * ry * 0.8;
        mistShapes += `<ellipse cx="${fmt(cx + dx)}" cy="${fmt(cy + dy)}" rx="${fmt(rx * (0.6 + rng() * 0.5))}" ry="${fmt(ry * (0.6 + rng() * 0.5))}" fill="#000" fill-opacity="${(0.6 + rng() * 0.35).toFixed(2)}"/>`;
      }
    }
    defsMist.push(
      // 滤镜范围按整张画幅算：按雾团包围盒算的话，扁雾一模糊一位移就被框上下切成直边横带
      `<filter id="mistF" filterUnits="userSpaceOnUse" x="${fmt(-width * 0.1)}" y="${fmt(-height * 0.2)}" width="${fmt(width * 1.2)}" height="${fmt(height * 1.5)}" color-interpolation-filters="sRGB">` +
        // 低频噪声把雾团啃成云的形状（噪声低的地方雾没了），再化开；不用位移，位移只能让直边微微起伏
        `<feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="3" seed="${seed + 700 + li}" result="n"/>` +
        `<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.6 0 0 0 -0.7" result="cloud"/>` +
        `<feComposite in="SourceGraphic" in2="cloud" operator="in" result="c"/>` +
        `<feGaussianBlur in="c" stdDeviation="${fmt(height * 0.02)}"/></filter>`,
    );
    const mist = `<g filter="url(#mistF)" clip-path="url(#body)">${mistShapes}</g>`;
    const doc = (inner: string, own: string[], fog = true) =>
      svgToDataUrl(
        svgDoc(
          { width, height, preserveAspectRatio: "xMidYMax slice" },
          `<defs>${defs.join("")}${own.join("")}</defs>${wrap(inner, fog)}`,
        ),
      );
    layers.push({
      name: spec.name,
      role: spec.role,
      parallax: spec.parallax,
      line: doc(line, defsLine),
      wash: doc(wash, defsWash),
      silhouette: doc(silhouette, defsSil, false),
      mist: doc(mist, defsMist),
    });
  });
  return { width, height, layers };
}

/** 同参数只生成一次：宣纸每次渲染都会要这几张图，生成一组要几十毫秒 */
const cache = new Map<string, MountainScene>();
const CACHE_LIMIT = 16;

/** 一组远山（四层）的遮罩图，同 seed 同山 */
export function inkMountainScene(options: MountainSceneOptions): MountainScene {
  const key = `${options.seed ?? 1}:${options.side}:${options.width ?? 1800}:${options.height ?? 610}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const scene = generateMountainScene(options);
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  cache.set(key, scene);
  return scene;
}
