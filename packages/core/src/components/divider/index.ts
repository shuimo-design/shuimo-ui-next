/**
 * 分割线的无框架部分：class / 方向 / 粗细的派生，以及"按元素实际长度生成笔触线"的控制器。
 *
 * 笔触线控制器不只分割线在用 —— 卡片的分隔线、标签页的底线和指示器、折叠面板的标题线、
 * 步骤条的连接线都是它。通用的 400px 线横向压到几十像素会糊成发丝、拉到上千像素又会把毛边
 * 放大成锯齿，所以每条线都按自己的长度单独生成。
 */
import { brushLineUrl } from "../../ink/assets/line";
import { applyInkVar } from "../../ink/registry";
import { observeSize, type SizeBox } from "../../runtime/observe-size";
import type { DividerAlign, DividerProps } from "./types";

export type { DividerAlign, DividerProps } from "./types";

/** 笔画粗细默认值（px） */
const THICKNESS = 4;
/** 笔触随机种子默认值 */
const SEED = 1;
/** 有文字时是两段线，尾段换个种子，免得左右两笔的飞白位置正好对称 */
const TAIL_SEED_OFFSET = 11;
/** 长度按 16px 分桶，同桶复用同一张线（brushLineUrl 内部有缓存） */
const BUCKET = 16;

export function dividerClasses(o: {
  align?: DividerAlign;
  vertical?: boolean;
  hasText: boolean;
}): string[] {
  const { align = "center", vertical = false, hasText } = o;
  return [
    "m-divider",
    `m-divider--${align}`,
    ...(vertical ? ["m-divider--vertical"] : []),
    ...(hasText ? ["m-divider--with-text"] : []),
  ];
}

export function dividerStyle(props: DividerProps): Record<string, string> {
  return { "--m-divider-thickness": `${props.thickness ?? THICKNESS}px` };
}

export function dividerOrientation(props: DividerProps): "horizontal" | "vertical" {
  return props.vertical ? "vertical" : "horizontal";
}

/** 两段线各自的笔触参数：`tail` 是文字右边那段 */
export function dividerLineOptions(props: DividerProps, tail = false): BrushLineControllerOptions {
  const seed = props.seed ?? SEED;
  return {
    thickness: props.thickness ?? THICKNESS,
    vertical: props.vertical ?? false,
    seed: tail ? seed + TAIL_SEED_OFFSET : seed,
  };
}

export interface BrushLineControllerOptions {
  /** 笔画粗细（px） */
  thickness: number;
  /** 竖线 */
  vertical: boolean;
  seed?: number;
  /** 手抖幅度 px；默认按笔宽的三成，要笔直的线传 0 */
  wobble?: number;
  /** 边缘噪声 0–1 */
  roughness?: number;
  /** 飞白 0–1：越大越像枯笔，线里断口、丝缕越多 */
  flyingWhite?: number;
}

export interface BrushLineController {
  /** 元素的 ref 回调：拿到元素就开始量、开始画，传 null 就停。可以反复调 */
  attach(el: HTMLElement | null): void;
  update(options: BrushLineControllerOptions): void;
  dispose(): void;
}

/**
 * 给一段线元素按实际长度生成笔触线，交给它自己的 CSS 变量：
 *  --m-brush-line-mask：mask 用的 data URL（走素材登记，同长度的线共用一条样式规则）；
 *  --m-brush-line-band：画幅在粗细方向上的尺寸（含晕染余量），内联。
 *
 * 只有副作用、没有要驱动渲染的状态，所以是 attach / update / dispose 三件套，
 * 和 createBrushBorder 一个范式；两个壳各包十几行把 attach 绑成元素的 ref 回调。
 */
export function createBrushLine(initial: BrushLineControllerOptions): BrushLineController {
  let options = initial;
  let el: HTMLElement | null = null;
  let stop: (() => void) | undefined;
  let width = 0;
  let height = 0;

  function draw(): void {
    if (!el) return;
    const raw = options.vertical ? height : width;
    // 尺寸监听在挂载瞬间（以及元素被隐藏时）会报一次 0：当作抖动忽略，保留上一张
    if (raw <= 0) return;
    const length = Math.max(BUCKET, Math.ceil(raw / BUCKET) * BUCKET);
    const line = brushLineUrl({
      seed: options.seed ?? SEED,
      length,
      thickness: options.thickness,
      vertical: options.vertical,
      wobble: options.wobble,
      roughness: options.roughness,
      flyingWhite: options.flyingWhite,
    });
    applyInkVar(el, "--m-brush-line-mask", line.url);
    el.style.setProperty("--m-brush-line-band", `${options.vertical ? line.width : line.height}px`);
  }

  function onResize(box: SizeBox): void {
    if (box.width === width && box.height === height) return;
    width = box.width;
    height = box.height;
    draw();
  }

  return {
    attach(next) {
      if (next === el) return;
      stop?.();
      stop = undefined;
      el = next;
      // 换了元素就得重新量：v-if / 条件渲染卸载再挂回来是另一个元素
      width = 0;
      height = 0;
      if (!el) return;
      stop = observeSize(el, onResize, "content-box");
    },
    update(next) {
      options = next;
      draw();
    },
    dispose() {
      stop?.();
      stop = undefined;
      el = null;
    },
  };
}
