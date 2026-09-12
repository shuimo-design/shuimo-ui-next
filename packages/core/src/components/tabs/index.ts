/**
 * 标签页的无框架部分：激活项解析、键盘跳转、class / 几何派生，以及量导航条的那个控制器。
 *
 * 这里一个 DOM 顺序都不比：页的顺序就是 `panes` 数组的顺序（子组件写法由壳在 render 期
 * 按书写顺序收集成同一个数组）。服务端算得出来，两个框架、两次渲染都一致。
 */
import { inkShapeUrl, type InkShape } from "../../ink/assets/shape";
import { inkVarBindings, type InkVarBindings } from "../../ink/registry";
import { applyBrushBorder, brushBorderUrl, clearBrushBorder } from "../../ink/stroke";
import type { Controller } from "../../runtime/controller";
import { observeSize } from "../../runtime/observe-size";
import { sanitizeId } from "../../runtime/id";
import { createStore } from "../../runtime/store";
import type { BrushLineControllerOptions } from "../divider";
import type { TabName, TabPaneConfig, TabsPosition, TabsProps, TabsType } from "./types";

export type {
  TabName,
  TabPaneConfig,
  TabPaneProps,
  TabPaneSlots,
  TabsEmits,
  TabsPosition,
  TabsProps,
  TabsSlots,
  TabsType,
} from "./types";

/** 底线的种子 */
const LINE_SEED = 1;
/** 指示器（朱笔一横）的种子 */
const INDICATOR_SEED = 2;
/** 内容区四面框的种子 */
const CONTENT_SEED = 4;
/** 激活签条三面框的种子 */
const SLIP_FRAME_SEED = 5;
/** 签条毛边底图的参数；横竖都能按实际尺寸生成，8px 分桶缓存 */
const SLIP_SHAPE = { seed: 6, raggedness: 0.4, corner: 0.08 };

/** 竖排导航：方向键改用上下 */
export function isVerticalTabs(position: TabsPosition = "top"): boolean {
  return position === "left" || position === "right";
}

/** 根元素的 class；两个壳必须产出一模一样的一串 */
export function tabsClasses(props: TabsProps): string[] {
  const type: TabsType = props.type ?? "line";
  const position: TabsPosition = props.position ?? "top";
  return [
    "m-tabs",
    `m-tabs--${type}`,
    `m-tabs--${position}`,
    ...(isVerticalTabs(position) ? ["m-tabs--vertical"] : []),
    ...(props.stretch ? ["m-tabs--stretch"] : []),
    ...(props.disabled ? ["m-tabs--disabled"] : []),
  ];
}

/**
 * 导航项和面板的 id 从组件 id + 下标派生。
 * 不用 name 拼：name 允许是任意字符串，拼进 id 可能撞上 CSS 选择器的非法字符。
 */
export function tabElementId(uid: string, index: number): string {
  return `${sanitizeId(uid)}-tab-${index}`;
}

export function tabPanelId(uid: string, index: number): string {
  return `${sanitizeId(uid)}-pane-${index}`;
}

/** 没设 v-model 时默认第一页激活（不回写，v-model 保持未设） */
export function activeTabName(
  panes: readonly TabPaneConfig[],
  model: TabName | undefined,
): TabName | undefined {
  return model ?? panes[0]?.name;
}

/** 模板直接拿来循环的一项：该算的都算好了，壳里不再有判断 */
export interface ResolvedTab {
  readonly index: number;
  readonly name: TabName;
  readonly tabId: string;
  readonly panelId: string;
  readonly active: boolean;
  readonly disabled: boolean;
  readonly closable: boolean;
  /** 没有 labelNode 时标签上显示的文字；label 没给就退回 name */
  readonly label: string;
  /** 关闭按钮的 aria-label */
  readonly closeLabel: string;
}

export function resolveTabs(o: {
  panes: readonly TabPaneConfig[];
  active: TabName | undefined;
  uid: string;
  /** 整组的 closable */
  closable?: boolean;
  /** 整组禁用 */
  disabled?: boolean;
}): ResolvedTab[] {
  return o.panes.map((pane, index) => {
    const label = pane.label ?? String(pane.name);
    return {
      index,
      name: pane.name,
      tabId: tabElementId(o.uid, index),
      panelId: tabPanelId(o.uid, index),
      active: pane.name === o.active,
      disabled: Boolean(o.disabled || pane.disabled),
      closable: pane.closable ?? Boolean(o.closable),
      label,
      closeLabel: `关闭 ${label}`,
    };
  });
}

/**
 * 方向键 / Home / End 要跳到哪一页（按数组顺序，跳过禁用项，两头循环）。
 * 返回 `panes` 里的下标；这个键不归我们管时返回 undefined，壳据此决定要不要 preventDefault。
 */
export function nextTabIndex(
  panes: readonly TabPaneConfig[],
  o: { key: string; vertical: boolean; from: number },
): number | undefined {
  const enabled = panes.map((pane, index) => ({ pane, index })).filter((it) => !it.pane.disabled);
  if (enabled.length === 0) return undefined;
  const prevKey = o.vertical ? "ArrowUp" : "ArrowLeft";
  const nextKey = o.vertical ? "ArrowDown" : "ArrowRight";
  // 当前位置落在"可用项"这一串里的第几个；焦点在禁用项上（或压根没焦点）时从 0 起算
  const current = Math.max(
    0,
    enabled.findIndex((it) => it.index === o.from),
  );
  let position: number;
  switch (o.key) {
    case prevKey:
      position = (current - 1 + enabled.length) % enabled.length;
      break;
    case nextKey:
      position = (current + 1) % enabled.length;
      break;
    case "Home":
      position = 0;
      break;
    case "End":
      position = enabled.length - 1;
      break;
    default:
      return undefined;
  }
  return enabled[position]?.index;
}

/**
 * v-model 指向的那一页被删掉之后落到哪一页：像浏览器关标签一样，优先原位、其次前一位。
 * 传 undefined 表示没什么可落的（一页都不剩）。
 */
export function fallbackTabName(
  panes: readonly TabPaneConfig[],
  lastIndex: number,
): TabName | undefined {
  return (panes[lastIndex] ?? panes[lastIndex - 1] ?? panes[panes.length - 1])?.name;
}

/** 指示器的长宽和位移；竖排走高度和 Y，横排走宽度和 X */
export function tabIndicatorStyle(
  indicator: { size: number; offset: number },
  vertical: boolean,
): Record<string, string> {
  return vertical
    ? { height: `${indicator.size}px`, transform: `translateY(${indicator.offset}px)` }
    : { width: `${indicator.size}px`, transform: `translateX(${indicator.offset}px)` };
}

/**
 * 导航条底线：整长的一笔，按导航条实际长度生成。
 * 不含 vertical —— 它在两个壳里都是响应式的，各自补上（Vue 传取值函数，React 传当前值）。
 */
export function tabsLineOptions(): Omit<BrushLineControllerOptions, "vertical"> {
  return { thickness: 2, seed: LINE_SEED };
}

/**
 * 指示器是朱笔一横：比底线厚、飞白重，像蘸得不满的朱砂在纸上拖过去；
 * 颜色在 tabs.css 的 m.ink 层换成 --m-seal
 */
export function tabsIndicatorOptions(): Omit<BrushLineControllerOptions, "vertical"> {
  return { thickness: 3, seed: INDICATOR_SEED, flyingWhite: 0.4 };
}

/** 内容区四面框的笔触参数（card 才有，签条插进它的上沿）；开不开由 tabsInkEnabled 决定 */
export function tabsContentBrush(): { strokeWidth: number; seed: number; overshoot: number } {
  return { strokeWidth: 1.6, seed: CONTENT_SEED, overshoot: 1 };
}

/**
 * card 型 + 引擎就绪时才画签条底图和那些框。
 * 和旧版一样在求值那一刻读一次 html.m-ink-ready：两个壳共用这一个判断，不各读一遍 DOM。
 */
export function tabsInkEnabled(card: boolean): boolean {
  return card && isInkReady();
}

/**
 * 签条底图的绑定：同尺寸桶的签条共用样式表里的一条规则、元素上只挂属性；
 * `registered` 为 false（服务端、水合首帧）时退回内联 style，两边输出才对得上。
 * 内边距变量也绑在签条上，所以一次返回 attrs 和 style 两份。
 */
export function tabSlipBindings(shape: InkShape | undefined, registered: boolean): InkVarBindings {
  if (!shape) return { attrs: {}, style: {} };
  const ink = inkVarBindings({ "--m-tabs-slip": shape.url }, registered);
  return { attrs: ink.attrs, style: { ...ink.style, "--m-tabs-slip-pad": `${shape.padding}px` } };
}

/** 签条朝内容区的那一面：书签插进书里的那一边，不画线 */
const OPEN_SIDE: Record<TabsPosition, "top" | "right" | "bottom" | "left"> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

/** 把焦点移到第 index 个标签上。DOM 查询留在 core，壳只管把列表元素交出来 */
export function focusTab(list: HTMLElement | null, index: number): void {
  list?.querySelectorAll<HTMLElement>('[role="tab"]')[index]?.focus();
}

/** 事件目标落在第几个标签上；不在任何标签里返回 -1 */
export function focusedTabIndex(list: HTMLElement | null, target: EventTarget | null): number {
  if (!list || !(target instanceof Element)) return -1;
  const tab = target.closest<HTMLElement>('[role="tab"]');
  if (!tab) return -1;
  return [...list.querySelectorAll<HTMLElement>('[role="tab"]')].indexOf(tab);
}

export interface TabsInkState {
  /** 指示器的长度与位移 px；量不到（服务端、首帧、没有激活项）时都是 0 */
  readonly indicator: { readonly size: number; readonly offset: number };
  /** 每条签条的毛边底图，按导航项 id 存；不是 card 型或没开引擎时是空对象 */
  readonly slips: Readonly<Record<string, InkShape>>;
}

export interface TabsInkOptions {
  /** 竖排导航 */
  vertical: boolean;
  /** card 型才有签条底图和激活项的三面框 */
  card: boolean;
  /** 导航条位置，决定激活签条哪一面不画线 */
  position: TabsPosition;
}

export interface TabsInkController extends Controller<TabsInkState, TabsInkOptions> {
  /** 导航列表元素的 ref 回调 */
  setList(el: HTMLElement | null): void;
  /** 这一轮 DOM 更新完之后调一次：重量指示器、签条底图和激活项的框 */
  measure(): void;
}

function isInkReady(): boolean {
  return (
    typeof document !== "undefined" && document.documentElement.classList.contains("m-ink-ready")
  );
}

/**
 * 量导航条：指示器跟着激活项走、每条签条按自己的尺寸生成毛边底图、激活签条挂三面笔触框。
 *
 * 这些都得等真元素出来才知道，所以服务端快照一律是"没量到"（0 和空表），
 * 渲染的是朴素版；挂载后 connect() 量一次，之后靠尺寸监听和壳在每轮渲染后调的 measure() 跟。
 */
export function createTabsInk(initial: TabsInkOptions): TabsInkController {
  const EMPTY_SLIPS: Readonly<Record<string, InkShape>> = {};
  const server: TabsInkState = { indicator: { size: 0, offset: 0 }, slips: EMPTY_SLIPS };
  const store = createStore<TabsInkState>(server);
  let options = initial;
  let list: HTMLElement | null = null;
  let stopSize: (() => void) | undefined;
  /** 当前挂着三面框的那个元素，换激活项时要先把旧的清掉 */
  let framed: HTMLElement | null = null;
  let connected = false;

  function tabElements(): HTMLElement[] {
    return list ? [...list.querySelectorAll<HTMLElement>('[role="tab"]')] : [];
  }

  function activeElement(): HTMLElement | null {
    return list?.querySelector<HTMLElement>(".m-tabs__tab--active") ?? null;
  }

  function measureIndicator(el: HTMLElement | null): { size: number; offset: number } {
    if (!el) return { size: 0, offset: 0 };
    return options.vertical
      ? { size: el.offsetHeight, offset: el.offsetTop }
      : { size: el.offsetWidth, offset: el.offsetLeft };
  }

  function measureSlips(): Readonly<Record<string, InkShape>> {
    if (!options.card || !isInkReady()) return EMPTY_SLIPS;
    const prev = store.get().slips;
    const next: Record<string, InkShape> = {};
    for (const el of tabElements()) {
      // 隐藏、过渡中会量到 0：保留上一张，别闪成没有底图
      if (!el.offsetWidth || !el.offsetHeight) {
        const kept = prev[el.id];
        if (kept) next[el.id] = kept;
        continue;
      }
      next[el.id] = inkShapeUrl(el.offsetWidth, el.offsetHeight, SLIP_SHAPE);
    }
    return next;
  }

  /** 同一尺寸桶返回的是同一个缓存对象，所以逐项比引用就够 */
  function sameSlips(
    a: Readonly<Record<string, InkShape>>,
    b: Readonly<Record<string, InkShape>>,
  ): boolean {
    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;
    return keys.every((key) => a[key] === b[key]);
  }

  /**
   * 激活签条的三面框不走通用的笔触边框控制器：目标元素随激活项换、不画的那面随 position 换，
   * 控制器的 sides 是挂上去时定死的，这里直接用同一套生成函数自己跟。
   */
  function updateFrame(el: HTMLElement | null): void {
    if (framed && framed !== el) {
      clearBrushBorder(framed);
      framed = null;
    }
    if (!el) return;
    if (!options.card || !isInkReady()) {
      clearBrushBorder(el);
      framed = null;
      return;
    }
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    // 挂载、过渡中会量到 0：忽略，别把框清掉
    if (w === 0 || h === 0) return;
    const sides = { top: true, right: true, bottom: true, left: true };
    sides[OPEN_SIDE[options.position]] = false;
    // 线比内容区框略细、拐角不出头：签条是薄纸片，框线要轻
    applyBrushBorder(
      el,
      brushBorderUrl(w, h, {
        strokeWidth: 1.4,
        seed: SLIP_FRAME_SEED,
        overshoot: 0.5,
        wobble: 0.4,
        sides,
      }),
    );
    framed = el;
  }

  function measure(): void {
    if (!connected) return;
    const active = activeElement();
    updateFrame(active);
    const indicator = measureIndicator(active);
    const slips = measureSlips();
    const prev = store.get();
    store.set({
      // 引用稳定：React 的 useSyncExternalStore 比的是引用，每次给新对象会抖成死循环
      indicator:
        prev.indicator.size === indicator.size && prev.indicator.offset === indicator.offset
          ? prev.indicator
          : indicator,
      slips: sameSlips(prev.slips, slips) ? prev.slips : slips,
    });
  }

  return {
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,
    update(next) {
      // 纯赋值：不通知、不碰 DOM。真正重量由壳在 DOM 更新后调 measure()
      options = next;
    },
    setList(el) {
      if (el === list) return;
      stopSize?.();
      stopSize = undefined;
      list = el;
      if (!el) return;
      // 字体加载完、stretch 下容器变宽都会改标签宽度
      stopSize = observeSize(el, () => measure(), "border-box");
    },
    measure,
    connect() {
      if (connected) return;
      connected = true;
      measure();
      // 手写体是异步加载的字体：加载完标签宽度会变，指示器位置和签条底图都要重量一次。
      // 列表的尺寸监听在 stretch 下量不到（标签宽度由容器定，文字变宽列表不变），所以单独等一次
      if (typeof document !== "undefined" && "fonts" in document) {
        void document.fonts.ready.then(() => {
          if (connected) measure();
        });
      }
    },
    disconnect() {
      connected = false;
      stopSize?.();
      stopSize = undefined;
      if (framed) clearBrushBorder(framed);
      framed = null;
    },
  };
}
