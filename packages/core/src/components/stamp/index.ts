/**
 * 印章的无框架部分：props → generateStamp 的参数归一化、class / CSS 变量派生，
 * 以及"等字体到了再按真实墨迹框重排"的控制器。
 *
 * 印章的几何本身早就在 core 的 ink/stamp 里了，这里只补两个壳共用的那层薄派生。
 */
import { generateStamp, type StampOptions, type StampRender } from "../../ink/stamp";
import { createGlyphMeasurer, loadStampFont } from "../../ink/stamp/measure";
import type { GlyphMeasurer } from "../../ink/stamp/layout";
import { sanitizeId } from "../../runtime/id";
import { createStore } from "../../runtime/store";
import type { Controller } from "../../runtime/controller";
import type { StampProps } from "./types";

export type {
  PolygonOrientation,
  StampCorner,
  StampDirection,
  StampMode,
  StampProps,
  StampShape,
} from "./types";

/** 印文按阅读顺序摊平成一串，用来预加载字体 */
export function stampPlainText(text: string | string[]): string {
  return Array.isArray(text) ? text.join("") : text;
}

/**
 * 滤镜 / mask 的 id 前缀：同一页上多枚印章不能撞。
 * id 本身由各框架的 useId() 生成（服务端客户端一致），core 只负责洗掉非法字符 ——
 * React 19 给的是 `«r1»`，这几个字符在 `url(#id)` 里是非法的。
 */
export function stampId(uid: string): string {
  return `m-stamp-${sanitizeId(uid)}`;
}

/**
 * 把 props 归一化成 generateStamp 的参数。
 * 这里**不**替 generateStamp 补它自己有默认值的字段（比如 stretch 在方 / 圆 / 多边形上默认开），
 * 没传就原样递 undefined，免得两个壳对"没传"的理解不一样。
 */
export function stampOptions(props: StampProps, id: string, measure?: GlyphMeasurer): StampOptions {
  return {
    text: props.text,
    size: props.size,
    mode: props.mode,
    shape: props.shape,
    aspect: props.aspect,
    sides: props.sides,
    orientation: props.orientation,
    seed: props.seed,
    border: props.border,
    corner: props.corner,
    cornerRadius: props.cornerRadius,
    roughness: props.roughness,
    carving: props.carving,
    bleed: props.bleed,
    padding: props.padding,
    gap: props.gap,
    rowGap: props.rowGap,
    columnGap: props.columnGap,
    columns: props.columns,
    stretch: props.stretch,
    cellHeightMode: props.cellHeightMode,
    offsetX: props.offsetX,
    offsetY: props.offsetY,
    direction: props.direction,
    gridLines: props.gridLines,
    gridLineWidth: props.gridLineWidth,
    id,
    measure,
  };
}

export function stampRender(props: StampProps, id: string, measure?: GlyphMeasurer): StampRender {
  return generateStamp(stampOptions(props, id, measure));
}

export function stampClasses(props: StampProps, render: StampRender): string[] {
  return ["m-stamp", `m-stamp--${render.mode}`, `m-stamp--${props.shape ?? "auto"}`];
}

export function stampStyle(props: StampProps, render: StampRender): Record<string, string> {
  return {
    "--m-stamp-w": `${render.width}px`,
    "--m-stamp-h": `${render.height}px`,
    ...(props.color ? { "--m-stamp-color": props.color } : {}),
    ...(props.font ? { "--m-stamp-font": props.font } : {}),
    ...(props.rotate ? { "--m-stamp-rotate": `${props.rotate}deg` } : {}),
  };
}

/* ── 字体度量控制器 ─────────────────────────────────────────────── */

export interface StampFontState {
  /** 量不到字体（服务端、字体还没到）时是 undefined，generateStamp 会退回兜底比例 */
  measure: GlyphMeasurer | undefined;
}

export interface StampFontOptions {
  /** 要预加载的那几个字 */
  text: string;
}

export interface StampFontController extends Controller<StampFontState, StampFontOptions> {
  /** svg 元素的 ref 回调：字体要量 svg 上真正生效的那一份 */
  attach(el: Element | null): void;
  /** 印文或字体族换了之后调一次，重新量 */
  refresh(): void;
}

/**
 * 字的墨迹框要等字体到了才量得准：先用兜底比例排一版，字体加载完再换成真度量重排。
 *
 * 必须量 **svg 上生效的字体**：根元素继承的是页面正文字体，拿它量出来的框对不上篆体。
 * 服务端没有 document，快照永远是 `{ measure: undefined }` —— 引用恒定，
 * 所以 React 的 useSyncExternalStore 不会被它拖进无限重渲染。
 */
export function createStampFont(initial: StampFontOptions = { text: "" }): StampFontController {
  let options = initial;
  let el: Element | null = null;
  let connected = false;
  /** 已经量过的「字体族 + 印文」；一样就不重量，也就不会通知订阅者 */
  let measured: string | undefined;
  /** 每次发起量都领一张票，等待期间又改了就以最后一次为准 */
  let ticket = 0;
  const store = createStore<StampFontState>({ measure: undefined });

  async function measure(): Promise<void> {
    if (!connected || !el || typeof document === "undefined") return;
    const family = getComputedStyle(el).fontFamily;
    const key = `${family}|${options.text}`;
    if (key === measured) return;
    const mine = ++ticket;
    await loadStampFont(family, options.text);
    if (mine !== ticket || !connected) return;
    measured = key;
    store.set({ measure: createGlyphMeasurer(family) });
  }

  return {
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,
    update(next) {
      options = next;
    },
    attach(next) {
      if (next === el) return;
      el = next;
      // 换了元素就得重新量：新元素上生效的字体可能不一样
      measured = undefined;
      void measure();
    },
    connect() {
      connected = true;
      void measure();
    },
    disconnect() {
      connected = false;
      // 作废在飞的那次：回来时不许再改快照
      ticket++;
    },
    refresh() {
      void measure();
    },
  };
}
