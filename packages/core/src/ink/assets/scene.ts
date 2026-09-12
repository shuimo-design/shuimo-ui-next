/**
 * 题头小景：弹窗纸框左上角那一抹——两座又矮又长的软边远山、压在后山右坡上的朱砂日、山下五笔长弧水纹、一株枯树、两只飞鸟。
 * 旧版弹窗底图 bg.webp 左上角就是这幅画；坐标不是从底图量的，是从**旧版真实截图**逐列扫出来再换算的
 * （老页面用 border-image 把顶边那条拉高了两成多，底图上的比例在页面上不成立）。换算：画幅 480 单位铺弹窗宽的一半，
 * 以左上框角为原点，1 css px = 1.714 单位，x 再减 19.2（小景左沿在框角右边 2%），面板上沿在画幅 y=75。
 * 前山（左、矮）峰在 x≈125、脚踩在左上角回纹竖杠的右上角（那一点比面板上沿还低 14 单位）；勾线只从半山腰起（下半段是一根淡淡的细线），
 * 过了峰顶往右下越来越宽，鞍部那一笔是整幅画最重的一笔，压到后山身上、落到面板上沿下面。
 * 后山（右、高）峰在 x≈284、左坡没有勾线只有一片淡灰；右肩很窄，从 x≈313 起就陡陡地落下来，日头（半径 15）正骑在这段陡坡上、
 * 画在山**后面**——山体盖住日头的左下角、脊线从日头上穿过去；陡坡落到 y≈48 之后是一段缓坡，缓坡下面三两笔皴，山脚在 x≈420 收住，
 * 再往右上框线就露出来了。水纹五笔互相交错。
 *
 * 和别的素材不同，它返回的是**内联 SVG 标记**而不是 data URL：墨色写成 currentColor、
 * 纸色写成 var(--m-bg)，切深色主题时跟着换；山体用纸色实心垫底、并往面板上沿下面多铺一截，
 * 把上框线整段盖住（老图里山下面看不见框线）。水纹画在 viewBox 之下（overflow 可见），落在框线里面。
 */
import { createRng } from "../random";
import {
  calligraphicProfile,
  evenProfile,
  fmt,
  paintBrush,
  samplePath,
  type BrushOptions,
  type Point,
} from "./brush";

export interface InkSceneOptions {
  seed?: number;
  /** 内联在页面里的 SVG，滤镜 / 渐变 id 必须全页唯一，调用方传一个前缀 */
  id: string;
}

/** 画幅固定 480×80；面板上沿在 y=75（画幅底下 3px 处是面板上沿），水纹在 80 以下，靠 overflow: visible 露出来 */
export const INK_SCENE_WIDTH = 480;
export const INK_SCENE_HEIGHT = 80;

/** 前山轮廓（真实截图逐列量的）：左脚落在回纹竖杠右上角、比面板上沿低 14，峰 (125, 26)，右坡一路压到后山身上、落到面板上沿下面 */
const FRONT: Point[] = [
  [13.5, 89.4],
  [19.5, 85.5],
  [27.7, 83.1],
  [36.8, 80.4],
  [52, 68],
  [67.4, 55.1],
  [81.9, 46.1],
  [96.3, 35.3],
  [110.8, 28.1],
  [125.2, 26.3],
  [139.6, 29.9],
  [153.3, 40.7],
  [166, 50],
  [180, 59],
  [195, 67],
  [210, 74],
  [225, 80],
  [238, 84],
];
/** 后山轮廓：从前山后面露出来的鞍部起，上到峰顶 (284, 1)，右肩很窄、从 x≈313 起陡降到 (345, 47)，再缓缓落到 (420, 68.5) 收住 */
const BACK: Point[] = [
  [183, 49.7],
  [197, 42],
  [211.8, 35.3],
  [226.3, 26.3],
  [240.7, 17.2],
  [255.2, 10],
  [269.6, 2.8],
  [284, 1],
  [293, 1.5],
  [301.5, 5.2],
  [310, 7.6],
  [316.5, 14],
  [321, 19],
  [327, 24],
  [333, 30],
  [337, 38],
  [341, 43.5],
  [345, 47],
  [352, 48.3],
  [360, 48.5],
  [368, 51],
  [377, 53.6],
  [385, 55.3],
  [394, 60],
  [402, 63],
  [411, 65.7],
  [420, 68.5],
];
/** 后山山脚收住的位置：山体的纸色底从这里起不再往下铺，上框线从这里露出来（老图里框线从框角右边约 243px 处冒出来） */
const BACK_FOOT = 390;
/** 前山的勾线：下半段（半山腰以下）只是一根淡淡的细线 */
const FRONT_FAINT: Point[] = [
  [68, 59],
  [76, 52],
  [84, 45],
  [92, 40],
  [100, 34],
];
/** 前山的主勾线：从半山腰起、过峰顶、顺着右坡压到后山身上，鞍部那一段最宽 */
const FRONT_LINE: Point[] = [[90, 40.5], ...FRONT.slice(7, 16), [224, 79]];
/** 后山右坡的脊线：从右肩起笔，穿过日头陡降，到坡底渐渐收掉 */
const BACK_LINE_RIGHT: Point[] = [
  [314, 10],
  [318, 15.5],
  [322, 20],
  [327, 24],
  [333, 30],
  [337, 38],
  [341, 43.5],
  [345, 47],
  [352, 48.5],
  [358, 49.2],
];
/** 峰顶右侧一小点墨 */
const PEAK_DAB: Point[] = [
  [286, 3.5],
  [293, 5],
];
/** 右坡缓坡下面的两笔皴 */
const HATCHES: Point[][] = [
  [
    [349, 59],
    [356, 62],
  ],
  [
    [377, 58.5],
    [402, 64],
    [427, 69.5],
  ],
];

/** 枯树：树干几乎竖直、略往右倾，左边三根长枝往左伸（梢头分别到 y≈30、40、50）、右边两根短枝，顶上一撮小杈；
 * 根落在面板上沿的高度、树干在 x≈48（老图量的），扎在前山左坡的山体里 */
const TREE: { points: Point[]; width: number }[] = [
  {
    points: [
      [48, 74],
      [49, 61],
      [50, 47],
      [51, 26],
      [53, 8],
    ],
    width: 10,
  },
  {
    points: [
      [48, 50],
      [38, 52],
      [28, 53],
      [21, 50],
    ],
    width: 4.5,
  },
  {
    points: [
      [49, 40],
      [35, 40],
      [21, 38],
      [16, 40],
    ],
    width: 5,
  },
  {
    points: [
      [35, 40],
      [32, 33],
    ],
    width: 2.7,
  },
  {
    points: [
      [50, 31],
      [40, 30],
      [30, 30.5],
      [22, 30],
    ],
    width: 4,
  },
  {
    points: [
      [49, 50],
      [58, 53],
      [63, 56],
    ],
    width: 4,
  },
  {
    points: [
      [51, 35],
      [59, 37],
      [64, 40],
    ],
    width: 3.6,
  },
  {
    points: [
      [51, 23],
      [49, 15],
      [48, 7],
    ],
    width: 3.6,
  },
  {
    points: [
      [52, 17],
      [57, 9],
    ],
    width: 2.9,
  },
  {
    points: [
      [28, 53],
      [25, 48],
    ],
    width: 2.3,
  },
  {
    points: [
      [40, 30],
      [38, 24],
    ],
    width: 2.3,
  },
  {
    points: [
      [50, 55],
      [55, 48],
    ],
    width: 2.3,
  },
  {
    points: [
      [50, 43],
      [46, 36],
    ],
    width: 2.1,
  },
  {
    points: [
      [52, 21],
      [57, 15],
    ],
    width: 2.1,
  },
];

/** 水纹：五笔互相交错的长弧（真实截图量的），落在面板上沿下面——第一笔最长、尾端翘起一小钩，第二笔在它下面反着弯，右边两笔一短一长 */
const WAVES: Point[][] = [
  [
    [72, 97],
    [80, 92],
    [90, 88],
    [102, 85],
    [125, 84.5],
    [145, 87.2],
    [160, 90.5],
    [174, 95.5],
    [181, 98],
  ],
  [
    [177, 95.5],
    [186, 93],
    [194, 89],
    [197, 87],
  ],
  [
    [130, 99.5],
    [140, 104],
    [152, 106.5],
    [165, 108],
    [180, 107.5],
    [195, 103.5],
    [208, 99],
    [220, 95.5],
  ],
  [
    [243, 98],
    [258, 100],
    [275, 102.5],
    [289, 104],
  ],
  [
    [245, 110],
    [256, 113.8],
    [265, 116],
    [275, 117],
    [290, 113.4],
    [305, 111.2],
    [318, 111.5],
    [326, 114],
  ],
];

/** Catmull-Rom 过点平滑成三次贝塞尔的 path d（画山体用） */
function smoothPath(pts: Point[]): string {
  let d = `M${fmt(pts[0]![0])} ${fmt(pts[0]![1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(i + 2, pts.length - 1)]!;
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${fmt(c1[0])} ${fmt(c1[1])} ${fmt(c2[0])} ${fmt(c2[1])} ${fmt(p2[0])} ${fmt(p2[1])}`;
  }
  return d;
}

/** 山体的闭合路径：轮廓两端各往下拖到面板上沿下面再封口，纸色底把整段上框线盖死；
 * 给了 foot 的（后山），纸色底只铺到 foot 为止，且从轮廓末端到 foot 是一条斜边压在框线上——框线从 foot 起先露一线、越往右露得越多，
 * 像是从山脚下面起笔（老图里框线冒出来的那一段就是由细到粗的） */
function bodyPath(pts: Point[], foot?: number): string {
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  const tail =
    foot === undefined
      ? `L${fmt(last[0])} 94`
      : `L${fmt(last[0])} 70.5L${fmt(foot)} 78L${fmt(foot)} 94`;
  return `${smoothPath(pts)}${tail}L${fmt(first[0])} 94Z`;
}

const cache = new Map<string, string>();

/** 生成一幅题头小景的内联 SVG 标记（同 seed + id 有缓存） */
export function inkSceneSvg(options: InkSceneOptions): string {
  const seed = options.seed ?? 1;
  const { id } = options;
  const key = `${seed}:${id}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rng = createRng(seed * 17 + 3);
  const stroke = (points: Point[], opts: BrushOptions, wobble: number, spacing = 3) =>
    paintBrush(samplePath(points, rng, { wobble, spacing }), opts, rng)
      // paintBrush 画的是遮罩用的黑色，内联时改成跟随文字色
      .replace(/fill="#000"/g, 'fill="currentColor"');

  const softId = `${id}-soft`;
  const lineId = `${id}-line`;
  const sunId = `${id}-sun`;
  const washId = `${id}-wash`;
  const clipFrontId = `${id}-clip-front`;
  const clipBackId = `${id}-clip-back`;
  const defs =
    // 日头：边缘化开一圈
    `<filter id="${softId}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter>` +
    // 脊线：老图的线是软的深灰，不是硬黑线，微微糊一下
    `<filter id="${lineId}" x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur stdDeviation="0.6"/></filter>` +
    // 山体的灰：老图的山是白的，灰只有沿着脊线往山里晕开的一圈软边（前山左坡、后山左坡和右肩），
    // 用一根粗糙的宽笔沿脊线画在山体里、糊开、再用山体轮廓裁掉山外的部分
    `<filter id="${washId}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>` +
    `<clipPath id="${clipFrontId}"><path d="${bodyPath(FRONT)}"/></clipPath>` +
    `<clipPath id="${clipBackId}"><path d="${bodyPath(BACK, BACK_FOOT)}"/></clipPath>` +
    // 日头：中心实、边缘化开的淡朱
    `<radialGradient id="${sunId}"><stop offset="0" stop-color="var(--m-seal)" stop-opacity="0.72"/>` +
    `<stop offset="0.7" stop-color="var(--m-seal)" stop-opacity="0.55"/>` +
    `<stop offset="1" stop-color="var(--m-seal)" stop-opacity="0"/></radialGradient>`;

  // 前山主勾线的粗细：半山腰起笔细，到峰顶还是细的（老图峰顶那段只有 3 单位宽），过了峰顶往右坡越走越宽，
  // 鞍部吃满墨，落到面板上沿前再收
  const frontProfile = (t: number) =>
    t < 0.2
      ? 0.25 + 0.15 * (t / 0.2)
      : t < 0.5
        ? 0.4 + 0.6 * ((t - 0.2) / 0.3)
        : t < 0.78
          ? 1
          : 1 - 0.55 * ((t - 0.78) / 0.22);
  // 后山右坡脊线：右肩起笔细，陡坡上吃饱，坡底渐渐收掉
  const backProfile = (t: number) =>
    t < 0.3 ? 0.35 + 0.65 * (t / 0.3) : t > 0.7 ? 1 - 0.6 * ((t - 0.7) / 0.3) : 1;
  const ridge = (
    points: Point[],
    width: number,
    profile: (t: number) => number,
    flyingWhite = 0.1,
  ) => stroke(points, { strokeWidth: width, roughness: 0.3, flyingWhite, profile }, 0.4, 4);
  // 山体里的一道灰晕：沿给定的一段轮廓画宽笔，糊开后裁在山体内
  const wash = (pts: Point[], width: number, opacity: number) =>
    `<path d="${smoothPath(pts)}" fill="none" stroke="currentColor" stroke-width="${width}" ` +
    `stroke-linecap="round" opacity="${opacity}"/>`;
  // 一座山 = 纸色实心 + 裁在山体内的灰晕；脊线另画
  const body = (pts: Point[], clipId: string, washes: string, foot?: number) =>
    `<path d="${bodyPath(pts, foot)}" style="fill:var(--m-bg)"/>` +
    `<g clip-path="url(#${clipId})" filter="url(#${washId})">${washes}</g>`;
  // 前山：左坡从山脚到峰顶一圈灰边，山脚那一片（树根周围）更大更淡的一团
  const frontWash =
    wash(FRONT.slice(0, 11), 14, 0.3) +
    wash(
      [
        [18, 92],
        [40, 82],
        [62, 74],
      ],
      30,
      0.16,
    );
  // 后山：左坡到峰顶一圈灰边，右肩和陡坡一圈，前山背后那片谷地一团
  const backWash =
    wash(BACK.slice(0, 9), 14, 0.24) +
    wash(BACK.slice(10, 18), 12, 0.22) +
    wash(
      [
        [190, 58],
        [212, 66],
        [232, 72],
      ],
      20,
      0.1,
    );

  // 朱砂日：画在后山**后面**，骑在右肩的陡坡上——山体盖住它的左下角，脊线从它身上穿过
  const sun = `<circle cx="335.5" cy="24" r="15" fill="url(#${sunId})" filter="url(#${softId})"/>`;
  // 后山：左坡没有线；峰顶右侧一小点墨；右坡的脊线从右肩起笔、穿过日头陡降；缓坡下面两笔皴
  const backLines =
    ridge(PEAK_DAB, 3, evenProfile, 0.05) +
    ridge(BACK_LINE_RIGHT, 4.5, backProfile, 0.12) +
    `<g opacity="0.8">${HATCHES.map((h) => ridge(h, 4, calligraphicProfile, 0.15)).join("")}</g>`;
  // 前山：下半段一根淡淡的细线，半山腰以上才是主勾线
  const frontLine =
    `<g opacity="0.45">${ridge(FRONT_FAINT, 2.4, evenProfile, 0.15)}</g>` +
    ridge(FRONT_LINE, 8.5, frontProfile, 0.15);
  // 枝干：从根到梢头一路收细，手抖大一点才像长出来的
  const tree = TREE.map((t) =>
    stroke(
      t.points,
      { strokeWidth: t.width, roughness: 0.45, flyingWhite: 0.08, profile: (u) => 1 - 0.7 * u },
      1.2,
      2.5,
    ),
  ).join("");
  // 飞鸟：老图是两个「乂」形——大的一只两翼一身，在前山峰顶右上方；小的一只只有一个小勾，在鞍部上方
  const birds =
    `<path d="M162.6 10.3L168.7 14.3M175.7 10.3L172.6 13.3M169.7 16.4L169.7 19.4M190.5 21L192.5 22.6L194.5 20.4" ` +
    `fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>`;
  const waves = WAVES.map((w) =>
    stroke(
      w,
      { strokeWidth: 4, roughness: 0.4, flyingWhite: 0.12, profile: calligraphicProfile },
      0.5,
      4,
    ),
  ).join("");

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${INK_SCENE_WIDTH} ${INK_SCENE_HEIGHT}" ` +
    `preserveAspectRatio="xMinYMax meet" overflow="visible"><defs>${defs}</defs>` +
    `${sun}${body(BACK, clipBackId, backWash, BACK_FOOT)}<g filter="url(#${lineId})" opacity="0.8">${backLines}</g>${body(FRONT, clipFrontId, frontWash)}<g filter="url(#${lineId})" opacity="0.8">${frontLine}</g>${tree}${birds}` +
    `<g opacity="0.95">${waves}</g></svg>`;
  cache.set(key, svg);
  return svg;
}
