/**
 * 山水横幅的无框架部分。
 *
 * 画面由几层 SVG 遮罩叠出来：远山（每层一张 inkRidgeUrl）、朱砂日、雁阵、孤舟。
 * 每一层落在哪、多大、多深，全由 seed 算，渲染期算完就是最终值——服务端和客户端首帧一字不差。
 * 控制器只管客户端才有的事：检测特效档位、等遮罩图解码完再淡入、给图层挂视差。
 *
 * 没有墨迹引擎（html 没有 m-ink-ready）时是纯色分层：山是几块由深到浅的墩子，日头是个圆；
 * 引擎起来之后 m.ink 层把同一批元素换成 SVG 遮罩，DOM 不变。
 */
import { inkBoatUrl } from "../../ink/assets/boat";
import { inkGeeseUrl } from "../../ink/assets/geese";
import { inkRidgeUrl } from "../../ink/assets/ridge";
import { inkSunUrl } from "../../ink/assets/sun";
import { createParallax, type ParallaxController } from "../../ink/parallax";
import { createRng } from "../../ink/random";
import { detectInkTier, type InkTier } from "../../ink/tier";
import type { Controller } from "../../runtime/controller";
import { createStore } from "../../runtime/store";
import { scrollCssSize } from "../scroll";
import type { ShanShuiParallax, ShanShuiProps, ShanShuiReadyPayload } from "./types";

export type {
  ShanShuiEmits,
  ShanShuiPalette,
  ShanShuiParallax,
  ShanShuiProps,
  ShanShuiReadyPayload,
  ShanShuiSlots,
} from "./types";

/** 没传 seed 时的那幅：固定值，服务端和客户端画的是同一幅 */
export const SHAN_SHUI_SEED = 1;
/** 默认高度 */
export const SHAN_SHUI_HEIGHT = "60vh";
/** 远山层数的上下限 */
export const SHAN_SHUI_LAYERS: readonly [number, number] = [2, 5];
/** 远山画幅宽度；高度按层各自的比例算 */
const RIDGE_WIDTH = 1600;
/** 鼠标视差：近层最多 ±14px */
const POINTER_PARALLAX = { strength: 14, damping: 0.08, scrollFactor: 0 };
/** 滚动视差：横幅每往上滚 1px，近层往下沉 0.18px；远层按层深按比例少沉 */
const SCROLL_PARALLAX = { strength: 0, damping: 0.08, scrollFactor: 0.18 };

/* ── 纯派生 ──────────────────────────────────────────────────── */

/** 远山层数钳到 2–5，非整数取整 */
export function shanShuiLayers(layers: number | undefined): number {
  const [min, max] = SHAN_SHUI_LAYERS;
  const n = Math.round(layers ?? 3);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : 3;
}

/** 没传 tier 就用控制器挂载后检测出来的档位；服务端和首帧一律 0（纯色分层） */
export function shanShuiTier(tier: InkTier | undefined, detected: InkTier): InkTier {
  return tier ?? detected;
}

/** tier 0 不动；其余按 parallax 选项 */
export function shanShuiParallaxMode(mode: ShanShuiParallax, tier: InkTier): ShanShuiParallax {
  return tier > 0 ? mode : "none";
}

export function shanShuiClasses(o: {
  ready: boolean;
  palette: NonNullable<ShanShuiProps["palette"]>;
  parallax: ShanShuiParallax;
  tier: InkTier;
}): string[] {
  return [
    "m-shan-shui",
    `m-shan-shui--${o.palette}`,
    `m-shan-shui--tier-${o.tier}`,
    ...(o.ready ? ["m-shan-shui--ready"] : []),
    ...(o.parallax === "none" ? [] : [`m-shan-shui--parallax-${o.parallax}`]),
  ];
}

/** 高度写成组件私有变量，CSS 里 height 引用它 */
export function shanShuiStyle(o: { height: string | number | undefined }): Record<string, string> {
  return { "--m-shan-shui-height": scrollCssSize(o.height ?? SHAN_SHUI_HEIGHT)! };
}

export type ShanShuiLayerKind = "sun" | "geese" | "ridge" | "boat";

export interface ShanShuiLayer {
  /** v-for / map 的 key */
  key: string;
  /** 图层种类，也是它的 BEM 元素名：m-shan-shui__<kind> */
  kind: ShanShuiLayerKind;
  /** 视差层深：0 最远（几乎不动），1 最近 */
  depth: number;
  /** 位置、大小和遮罩图，两个壳原样写到 style 上 */
  style: Record<string, string>;
}

export interface ShanShuiSceneOptions {
  seed: number;
  tier: InkTier;
  layers: number;
  sun: boolean;
  geese: boolean;
  boat: boolean;
}

/** 百分比字符串，最多一位小数 */
function pct(v: number): string {
  return `${(Math.round(v * 1000) / 10).toFixed(1)}%`;
}

/**
 * 整幅画的图层，按叠放顺序：日头在最后面，远山到近山，孤舟最前。
 * 位置全由 seed 算；tier 0 不生成遮罩图（变量写 none），CSS 退回纯色分层。
 */
export function shanShuiScene(o: ShanShuiSceneOptions): ShanShuiLayer[] {
  const rng = createRng(o.seed * 31 + 7);
  const ink = o.tier > 0;
  const layers: ShanShuiLayer[] = [];
  // 日头落在哪一侧，雁阵就在另一侧朝它飞
  const sunRight = rng() < 0.5;
  const sunLeft = sunRight ? 0.6 + rng() * 0.2 : 0.12 + rng() * 0.2;
  const sunTop = 0.14 + rng() * 0.14;
  if (o.sun) {
    layers.push({
      key: "sun",
      kind: "sun",
      depth: 0.12,
      style: {
        left: pct(sunLeft),
        top: pct(sunTop),
        "--m-shan-shui-mask": ink ? `url("${inkSunUrl({ seed: o.seed })}")` : "none",
      },
    });
  }
  if (o.geese) {
    const count = 5 + Math.floor(rng() * 4);
    layers.push({
      key: "geese",
      kind: "geese",
      depth: 0.3,
      style: {
        left: pct(sunRight ? 0.12 + rng() * 0.2 : 0.56 + rng() * 0.2),
        top: pct(0.12 + rng() * 0.16),
        "--m-shan-shui-mask": ink
          ? `url("${inkGeeseUrl({ seed: o.seed, count, heading: sunRight ? "right" : "left" })}")`
          : "none",
      },
    });
  }
  const count = shanShuiLayers(o.layers);
  for (let i = 0; i < count; i++) {
    // i = 0 最远：最高、最淡；越近越矮越浓
    const depth = i / (count - 1);
    const height = 0.78 - 0.42 * depth;
    const ridge = inkRidgeUrl({
      // 每层错开一位种子：同一幅画里两层山不会一个形状
      seed: o.seed + i + 1,
      width: RIDGE_WIDTH,
      height: Math.round(RIDGE_WIDTH * (0.16 + 0.1 * depth)),
      layers: 1,
      opacity: 0.9,
      crest: depth >= 0.5,
      depthRange: [depth, depth],
      mist: 0.55 - 0.2 * depth,
    });
    layers.push({
      key: `ridge-${i}`,
      kind: "ridge",
      depth: 0.2 + 0.6 * depth,
      style: {
        height: pct(height),
        "--m-shan-shui-depth": depth.toFixed(2),
        "--m-shan-shui-mask": ink ? `url("${ridge.url}")` : "none",
        "--m-shan-shui-silhouette": ink ? `url("${ridge.silhouette}")` : "none",
      },
    });
  }
  if (o.boat) {
    layers.push({
      key: "boat",
      kind: "boat",
      depth: 0.85,
      style: {
        left: pct(0.15 + rng() * 0.6),
        bottom: pct(0.02 + rng() * 0.05),
        "--m-shan-shui-mask": ink
          ? `url("${inkBoatUrl({ seed: o.seed, heading: rng() < 0.5 ? "left" : "right" })}")`
          : "none",
      },
    });
  }
  return layers;
}

/* ── 控制器 ──────────────────────────────────────────────────── */

export interface ShanShuiOptions {
  seed: number;
  /** 传了就不检测 */
  tier?: InkTier;
  layers: number;
  sun: boolean;
  geese: boolean;
  boat: boolean;
  parallax: ShanShuiParallax;
  /** 全部遮罩图解码完成时调一次 */
  onReady?: (payload: ShanShuiReadyPayload) => void;
}

export interface ShanShuiSnapshot {
  /** 检测出来的特效档位，挂载后才知道；服务端和首帧是 0 */
  readonly detectedTier: InkTier;
  /** 遮罩图解码完了，可以淡入 */
  readonly ready: boolean;
}

export interface ShanShuiController extends Controller<ShanShuiSnapshot, ShanShuiOptions> {
  /** 根元素的 ref 回调：拿到元素才找得到图层、算得出它滚到了哪。传 null 就停 */
  attach(el: HTMLElement | null): void;
  /**
   * 图层是条件渲染的，元素什么时候在树上只有壳知道：每轮渲染落地后调一次，
   * 控制器自己比对元素和视差模式有没有变，没变就什么都不做。
   */
  sync(): void;
}

/** 引用恒定：useSyncExternalStore 每次拿到新对象就会无限重渲染 */
const SERVER_SNAPSHOT: ShanShuiSnapshot = { detectedTier: 0, ready: false };

/** 从图层的 style 里把遮罩图的 url 抠出来，解码用 */
function maskUrls(layers: ShanShuiLayer[]): string[] {
  const urls: string[] = [];
  for (const layer of layers) {
    for (const key of ["--m-shan-shui-mask", "--m-shan-shui-silhouette"]) {
      const value = layer.style[key];
      if (value && value !== "none") urls.push(value.slice(5, -2));
    }
  }
  return urls;
}

export function createShanShui(initial: ShanShuiOptions): ShanShuiController {
  const store = createStore<ShanShuiSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  let el: HTMLElement | null = null;
  let connected = false;
  let parallax: ParallaxController | undefined;
  let boundMode: ShanShuiParallax = "none";
  let boundLayers: HTMLElement[] = [];

  const tierOf = () => shanShuiTier(options.tier, store.get().detectedTier);
  const sceneOf = () =>
    shanShuiScene({
      seed: options.seed,
      tier: tierOf(),
      layers: options.layers,
      sun: options.sun,
      geese: options.geese,
      boat: options.boat,
    });
  const modeOf = () =>
    connected && el ? shanShuiParallaxMode(options.parallax, tierOf()) : "none";

  /** 等遮罩图解码完再淡入，免得山一层一层冒出来 */
  async function settle(): Promise<void> {
    const urls = maskUrls(sceneOf());
    if (typeof Image !== "undefined") {
      await Promise.all(
        urls.map(async (src) => {
          const img = new Image();
          img.src = src;
          try {
            await img.decode();
          } catch {
            // 解码失败照样显示，纯色分层还在
          }
        }),
      );
    }
    if (!connected) return;
    // 解码期间 seed / tier 变了：这一轮作废，等新的那一轮
    const now = maskUrls(sceneOf());
    if (now.length !== urls.length || now.some((u, i) => u !== urls[i])) return;
    if (store.get().ready) return;
    store.set({ ready: true });
    options.onReady?.({ seed: options.seed, tier: tierOf() });
  }

  function unbindParallax(): void {
    // dispose 顺手把写进 transform 的位移清掉，关掉视差时图层回到原位
    parallax?.dispose();
    parallax = undefined;
    boundLayers = [];
    boundMode = "none";
  }

  function syncParallax(): void {
    const mode = modeOf();
    const next = mode === "none" ? [] : [...el!.querySelectorAll<HTMLElement>("[data-depth]")];
    if (
      mode === boundMode &&
      next.length === boundLayers.length &&
      next.every((node, i) => node === boundLayers[i])
    )
      return;
    unbindParallax();
    if (next.length === 0) return;
    const host = el!;
    parallax =
      mode === "pointer"
        ? createParallax({ ...POINTER_PARALLAX, pointer: true })
        : createParallax({
            ...SCROLL_PARALLAX,
            pointer: false,
            // 横幅顶边越过视口顶边多少 px；在哪个容器里滚都一样，没滚到之前是 0
            scrollOffset: () => Math.max(0, -host.getBoundingClientRect().top),
          });
    parallax.setLayers(
      next.map((element) => ({ element, depth: Number(element.dataset.depth) || 0 })),
    );
    boundLayers = next;
    boundMode = mode;
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
      store.set({ detectedTier: detectInkTier() });
      void settle();
      syncParallax();
    },
    disconnect() {
      if (!connected) return;
      connected = false;
      unbindParallax();
    },

    attach(next) {
      if (next === el) return;
      unbindParallax();
      el = next;
      syncParallax();
    },

    flush() {
      // seed / tier 变了要重新等新一批图解码；ready 先不撤，旧画面留着直到新的解码完
      if (connected && !store.get().ready) void settle();
    },

    sync() {
      syncParallax();
    },
  };
}
