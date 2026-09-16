/**
 * 宣纸的无框架部分。
 *
 * 这个组件几乎全是"脏活"：问设备能跑到哪一档特效、从主题变量里读纸色、盯着 html 的
 * data-theme 和系统深浅偏好、等纹理图解码完再淡入、给远山挂视差。这些东西在服务端一个都不存在，
 * 留在壳里就等于 Vue 和 React 各写一遍降级分支，所以整包塞进下面的控制器，壳里一个 document. 都没有。
 *
 * 纯派生（class、CSS 变量、四张远山的排布）留在渲染期算：它们只依赖 props 和控制器的快照，
 * 底下的素材生成函数各自带缓存，同参数不会重复生成。
 */
import { inkRidgeUrl } from "../../ink/assets/ridge";
import { createParallax, type ParallaxController } from "../../ink/parallax";
import {
  deckleMaskUrl,
  goldFleckUrl,
  PAPER_PRESETS,
  paperTextureUrl,
  type GoldFleckOptions,
  type PaperPreset,
} from "../../ink/paper";
import { detectInkTier, type InkTier } from "../../ink/tier";
import type { Controller } from "../../runtime/controller";
import { observeSize, type SizeBox } from "../../runtime/observe-size";
import { createStore } from "../../runtime/store";
import type { RicePaperProps, RicePaperReadyPayload } from "./types";

export type {
  GoldFleckOptions,
  PaperPreset,
  RicePaperEmits,
  RicePaperProps,
  RicePaperReadyPayload,
  RicePaperSlots,
} from "./types";

/** 没传 seed 时，服务端和水合首帧用的那张纸；挂载后才换成随机的一张 */
const DEFAULT_SEED = 1;
/** 毛边遮罩按 32px 分桶，同桶复用同一张图（deckleMaskUrl 内部有缓存） */
const MASK_BUCKET = 32;
/** 旧版：横向最多 ±5px、纵向再减半；这里近层 ±8px，滚动联动压得很轻，整站背景不能晃 */
const PARALLAX = { strength: 8, damping: 0.08, scrollFactor: 0.02 };
/** 远山的画幅宽度；高度按每层自己的宽高比算 */
const RIDGE_WIDTH = 1200;

/* ── 纯派生 ──────────────────────────────────────────────────── */

/** 没传 seed 就用控制器挂载后定下的那张；同 seed 同纸同山 */
export function ricePaperSeed(seed: number | undefined, fallback: number): number {
  return seed ?? fallback;
}

/** 没传 tier 就用控制器挂载后检测出来的档位；服务端和首帧一律 0（纯色纸） */
export function ricePaperTier(tier: InkTier | undefined, detected: InkTier): InkTier {
  return tier ?? detected;
}

/** 纸色：显式 RGB > 预设 > 主题 token --m-paper-rgb（由控制器读出来） */
export function ricePaperBaseColor(
  paper: RicePaperProps["paper"],
  themePaper: [number, number, number],
): [number, number, number] {
  if (Array.isArray(paper)) return paper;
  if (paper) return PAPER_PRESETS[paper];
  return themePaper;
}

/** tier 0（省流量 / 减弱动效）下不画远山 */
export function ricePaperShowLandscape(landscape: boolean, tier: InkTier): boolean {
  return landscape && tier > 0;
}

export function ricePaperClasses(o: {
  ready: boolean;
  deckleEdge: boolean;
  layout: RicePaperProps["layout"];
  showLandscape: boolean;
  tier: InkTier;
}): string[] {
  return [
    "m-rice-paper",
    ...(o.ready ? ["m-rice-paper--ready"] : []),
    ...(o.deckleEdge ? ["m-rice-paper--deckle"] : []),
    ...(o.layout === "full-screen" ? ["m-rice-paper--full-screen"] : []),
    ...(o.showLandscape ? ["m-rice-paper--landscape"] : []),
    `m-rice-paper--tier-${o.tier}`,
  ];
}

/** 算纸纹、洒金、毛边遮罩要用到的全部参数，渲染期和控制器内部用的是同一份 */
export interface RicePaperInk {
  tier: InkTier;
  seed: number;
  baseColor: [number, number, number];
  grain: number;
  fibers: number;
  particles: number;
  goldFlecks: boolean | Omit<GoldFleckOptions, "seed">;
  deckleEdge: boolean;
  /** 元素实际尺寸，毛边遮罩要按它生成；量到之前是 0，这时先不套遮罩 */
  width: number;
  height: number;
}

function textureUrl(o: RicePaperInk): string {
  if (o.tier <= 0) return "";
  return paperTextureUrl({
    seed: o.seed,
    baseColor: o.baseColor,
    grain: o.grain,
    fibers: o.fibers,
    particles: o.particles,
  });
}

/** 洒金单独一层、平铺单元更大（768），金簇不会每 384px 重复一次 */
function goldUrl(o: RicePaperInk): string {
  if (!o.goldFlecks || o.tier <= 0) return "";
  const options = typeof o.goldFlecks === "object" ? o.goldFlecks : {};
  return goldFleckUrl({ ...options, seed: o.seed });
}

/**
 * 毛边遮罩按元素实际尺寸生成（32px 分桶），纤维才是真实像素尺度；
 * 量到尺寸之前先不套 —— 把 400px 的遮罩横向拉到上千像素会把起伏拉成一个个圆缺口。
 */
function maskUrl(o: RicePaperInk): string {
  if (!o.deckleEdge || o.width <= 0 || o.height <= 0) return "";
  const bucket = (v: number) => Math.max(MASK_BUCKET, Math.ceil(v / MASK_BUCKET) * MASK_BUCKET);
  return deckleMaskUrl({ seed: o.seed, width: bucket(o.width), height: bucket(o.height) });
}

export function ricePaperStyle(o: RicePaperInk): Record<string, string> {
  const texture = textureUrl(o);
  const gold = goldUrl(o);
  const mask = maskUrl(o);
  return {
    "--m-rice-paper-rgb": o.baseColor.join(" "),
    "--m-rice-paper-texture": texture ? `url("${texture}")` : "none",
    "--m-rice-paper-gold": gold ? `url("${gold}")` : "none",
    "--m-rice-paper-mask": mask ? `url("${mask}")` : "none",
  };
}

/**
 * 远山版式：左右各一远一近，共四张，和旧站 4096 宽那套 webp 的占位对齐（宽度、贴边位置都是容器宽度的百分比）。
 * 远层贴着容器外沿放（切口藏在外面），近层往里挪一点并把外沿化开；depth 是视差里的层深。
 */
interface RidgeSpec {
  side: "left" | "right";
  depth: number;
  width: number;
  inset: number;
  ratio: number;
  range: [number, number];
  opacity: number;
  soft: boolean;
}

const RIDGES: readonly RidgeSpec[] = [
  {
    side: "left",
    depth: 0.3,
    width: 46,
    inset: -2,
    ratio: 3,
    range: [0, 0.45],
    opacity: 0.85,
    soft: false,
  },
  {
    side: "left",
    depth: 1,
    width: 30,
    inset: 5,
    ratio: 2.3,
    range: [0.6, 1],
    opacity: 1,
    soft: true,
  },
  {
    side: "right",
    depth: 0.3,
    width: 56,
    inset: -2,
    ratio: 2.9,
    range: [0, 0.45],
    opacity: 0.85,
    soft: false,
  },
  {
    side: "right",
    depth: 1,
    width: 32,
    inset: 6,
    ratio: 2.4,
    range: [0.6, 1],
    opacity: 1,
    soft: true,
  },
];

export interface RicePaperRidge {
  /** v-for / map 的 key，同时也是它在 RIDGES 里的下标 */
  key: number;
  /** 追加在 .m-rice-paper__ridge 后面的修饰类 */
  className: string;
  style: Record<string, string>;
}

/** 四张远山的 class 和内联样式。两个壳必须拿到一模一样的结果，CSS 是共用的 */
export function ricePaperRidges(seed: number): RicePaperRidge[] {
  return RIDGES.map((spec, index) => {
    const ridge = inkRidgeUrl({
      // 每层错开一位种子：同一张纸上左右两侧不会是同一座山
      seed: seed + index + 1,
      width: RIDGE_WIDTH,
      height: Math.round(RIDGE_WIDTH / spec.ratio),
      layers: 2,
      opacity: spec.opacity,
      side: spec.side,
      crest: true,
      depthRange: spec.range,
      softOuter: spec.soft,
    });
    return {
      key: index,
      className: `m-rice-paper__ridge--${spec.side} m-rice-paper__ridge--${
        spec.depth < 0.5 ? "far" : "near"
      }`,
      style: {
        [spec.side]: `${spec.inset}%`,
        width: `${spec.width}%`,
        aspectRatio: `${ridge.width} / ${ridge.height}`,
        "--m-rice-paper-ridge": `url("${ridge.url}")`,
        "--m-rice-paper-ridge-silhouette": `url("${ridge.silhouette}")`,
      },
    };
  });
}

/* ── 控制器 ──────────────────────────────────────────────────── */

export interface RicePaperOptions {
  seed?: number;
  tier?: InkTier;
  paper?: PaperPreset | [number, number, number];
  grain: number;
  fibers: number;
  particles: number;
  goldFlecks: boolean | Omit<GoldFleckOptions, "seed">;
  deckleEdge: boolean;
  landscape: boolean;
  parallax: boolean;
  /** 纹理（和洒金）解码完成时调一次 */
  onReady?: (payload: RicePaperReadyPayload) => void;
}

export interface RicePaperSnapshot {
  /** 没传 seed 时用的那张纸，挂载后才定下来 */
  readonly fallbackSeed: number;
  /** 检测出来的特效档位，挂载后才知道；服务端和首帧是 0 */
  readonly detectedTier: InkTier;
  /** 从主题变量 --m-paper-rgb 读到的纸色，随 data-theme / 系统偏好变 */
  readonly themePaper: [number, number, number];
  /** 纹理解码完了，可以淡入 */
  readonly ready: boolean;
  /** 元素实际尺寸，毛边遮罩按它生成 */
  readonly width: number;
  readonly height: number;
}

export interface RicePaperController extends Controller<RicePaperSnapshot, RicePaperOptions> {
  /** 根元素的 ref 回调：拿到元素才能读主题变量、量尺寸、找远山。传 null 就停 */
  attach(el: HTMLElement | null): void;
  /**
   * 远山是条件渲染的，元素什么时候在树上只有壳知道：每轮渲染落地后调一次，
   * 控制器自己比对元素有没有变，没变就什么都不做。
   */
  sync(): void;
}

/** 引用恒定：useSyncExternalStore 每次拿到新对象就会无限重渲染 */
const SERVER_SNAPSHOT: RicePaperSnapshot = {
  fallbackSeed: DEFAULT_SEED,
  detectedTier: 0,
  themePaper: PAPER_PRESETS.processed,
  ready: false,
  width: 0,
  height: 0,
};

const THEME_MEDIA = "(prefers-color-scheme: dark)";

export function createRicePaper(initial: RicePaperOptions): RicePaperController {
  const store = createStore<RicePaperSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  let el: HTMLElement | null = null;
  let connected = false;
  let mountedAt = 0;
  /** 随机的那张纸只抽一次：StrictMode 会把 connect / disconnect 跑两轮，不能每轮换一张 */
  let picked: number | undefined;
  let stopSize: (() => void) | undefined;
  let observer: MutationObserver | undefined;
  let media: MediaQueryList | undefined;
  let parallax: ParallaxController | undefined;
  let layers: HTMLElement[] = [];

  const seedOf = () => options.seed ?? store.get().fallbackSeed;
  const tierOf = () => options.tier ?? store.get().detectedTier;
  const showLandscape = () => ricePaperShowLandscape(options.landscape, tierOf());

  function inkOf(): RicePaperInk {
    const snapshot = store.get();
    return {
      tier: tierOf(),
      seed: seedOf(),
      baseColor: ricePaperBaseColor(options.paper, snapshot.themePaper),
      grain: options.grain,
      fibers: options.fibers,
      particles: options.particles,
      goldFlecks: options.goldFlecks,
      deckleEdge: options.deckleEdge,
      width: snapshot.width,
      height: snapshot.height,
    };
  }

  function onResize(box: SizeBox): void {
    store.set({ width: box.width, height: box.height });
  }

  /** 主题给的纸色写在 --m-paper-rgb 上，切主题时重读 */
  function readThemePaper(): void {
    if (!el) return;
    const parts = getComputedStyle(el).getPropertyValue("--m-paper-rgb").trim().split(/\s+/);
    const rgb = parts.map(Number);
    if (rgb.length !== 3 || !rgb.every(Number.isFinite)) return;
    // 每次读都是一个新数组，store 的浅比较认不出"没变"，这里逐位比一次，免得白白重渲染
    const prev = store.get().themePaper;
    if (prev[0] === rgb[0] && prev[1] === rgb[1] && prev[2] === rgb[2]) return;
    store.set({ themePaper: rgb as [number, number, number] });
  }

  /** 等纹理（和洒金）解码完再淡入，避免先闪一下平色 */
  async function settle(): Promise<void> {
    if (typeof Image === "undefined") return;
    const ink = inkOf();
    const texture = textureUrl(ink);
    const gold = goldUrl(ink);
    await Promise.all(
      [texture, gold].filter(Boolean).map(async (src) => {
        const img = new Image();
        img.src = src;
        try {
          await img.decode();
        } catch {
          // 解码失败就直接显示，纸色还在
        }
      }),
    );
    if (!connected) return;
    // 解码期间参数变了：这一轮作废，等新的那一轮
    const now = inkOf();
    if (textureUrl(now) !== texture || goldUrl(now) !== gold) return;
    if (store.get().ready) return;
    store.set({ ready: true });
    options.onReady?.({
      seed: seedOf(),
      tier: tierOf(),
      ms: Math.round(performance.now() - mountedAt),
    });
  }

  function syncParallax(): void {
    const on = connected && el !== null && options.parallax && showLandscape();
    const next = on
      ? [...el!.querySelectorAll<HTMLElement>(".m-rice-paper__ridge")]
      : ([] as HTMLElement[]);
    if (next.length === layers.length && next.every((node, i) => node === layers[i])) return;
    // dispose 顺手把上一轮写进 transform 的位移清掉，关掉视差时山会回到原位
    parallax?.dispose();
    parallax = undefined;
    layers = next;
    if (next.length === 0) return;
    parallax = createParallax(PARALLAX);
    parallax.setLayers(
      next.map((element, index) => ({ element, depth: RIDGES[index]?.depth ?? 1 })),
    );
  }

  /** 元素和 connected 都就位后才做得动的那些事；attach 和 connect 谁先到都走这里 */
  function start(): void {
    if (!connected || !el) return;
    if (stopSize) return;
    stopSize = observeSize(el, onResize, "border-box");
    readThemePaper();
    // MPaperTheme / applyPaperPreset 切纸时把 --m-paper-rgb 内联写在 html 的 style 上（深浅切换后还会重写），
    // 所以 style 属性也要盯：它变了就重读纸色，全局的纸才跟得上
    observer = new MutationObserver(readThemePaper);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "style"],
    });
    // 只有 data-theme="system" 时纸色才会随系统变
    media = window.matchMedia(THEME_MEDIA);
    media.addEventListener("change", readThemePaper);
    void settle();
  }

  function stop(): void {
    stopSize?.();
    stopSize = undefined;
    observer?.disconnect();
    observer = undefined;
    media?.removeEventListener("change", readThemePaper);
    media = undefined;
    parallax?.dispose();
    parallax = undefined;
    layers = [];
  }

  return {
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,

    update(next) {
      options = next;
    },

    connect() {
      if (connected) return;
      connected = true;
      mountedAt = typeof performance === "undefined" ? 0 : performance.now();
      picked ??= Math.floor(Math.random() * 2 ** 31);
      store.set({ fallbackSeed: picked, detectedTier: detectInkTier() });
      start();
    },
    disconnect() {
      if (!connected) return;
      connected = false;
      stop();
    },

    attach(next) {
      if (next === el) return;
      stop();
      el = next;
      start();
    },

    sync() {
      syncParallax();
    },
  };
}
