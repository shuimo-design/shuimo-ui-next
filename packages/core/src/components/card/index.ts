/**
 * 卡片的无框架部分：class 派生、三种框型的笔触参数、毛边纸缘遮罩、标题下那条笔触线。
 * Vue 和 React 的 MCard 各自只剩标签结构和几处绑定，这里的东西两边一字不差地共用。
 */
import { ensureSheetAssets } from "../../ink/assets/sheet";
import { deckleMaskUrl } from "../../ink/paper";
import { inkVarBindings, type InkVarBindings } from "../../ink/registry";
import type { BrushBorderControllerOptions, BrushBorderOptions } from "../../ink/stroke";
import {
  createBrushLine,
  type BrushLineController,
  type BrushLineControllerOptions,
} from "../divider";
import type { CardFrame, CardProps } from "./types";

export type { CardFrame, CardProps, CardShadow, CardSlots } from "./types";

const SEED = 1;
const PADDING = 20;
/** 纸比框大一圈的距离 px */
const PAPER_OUT = 9;
/** 纸缘遮罩按 16px 分桶，同尺寸的卡共用同一张图（deckleMaskUrl 内部有缓存） */
const PAPER_BUCKET = 16;
/** 标题下那条分隔线的笔宽 px */
const DIVIDER_THICKNESS = 1.5;
/** 分隔线换个种子，免得和边框的飞白正好撞在一起 */
const DIVIDER_SEED_OFFSET = 7;
/** 纸缘也换个种子 */
const PAPER_SEED_OFFSET = 3;

function isInkReady(): boolean {
  return (
    typeof document !== "undefined" && document.documentElement.classList.contains("m-ink-ready")
  );
}

/**
 * 三种框型在水墨层都是一笔画出来的框，只是粗细和笔性不同：
 * plain 细一笔、double（默认）中等一笔带轻微晕染、brush 粗一笔多飞白。
 * 没开引擎时这些参数用不上，CSS 退回单线 / 双线框。
 */
export const CARD_FRAME_STROKES: Record<CardFrame, BrushBorderOptions> = {
  plain: {
    strokeWidth: 1.2,
    roughness: 0.45,
    flyingWhite: 0.08,
    wobble: 0.4,
    bleed: { scale: 1.5 },
  },
  double: { strokeWidth: 2, roughness: 0.5, flyingWhite: 0.1, wobble: 0.6, bleed: { scale: 1.8 } },
  brush: { strokeWidth: 2.6, roughness: 0.55, flyingWhite: 0.2, wobble: 0.8, bleed: true },
};

export function cardClasses(props: CardProps, hasCover: boolean): string[] {
  return [
    "m-card",
    `m-card--${props.frame ?? "double"}`,
    `m-card--shadow-${props.shadow ?? "hover"}`,
    ...((props.bordered ?? true) ? [] : ["m-card--borderless"]),
    ...(hasCover ? ["m-card--with-cover"] : []),
  ];
}

/**
 * 喂给 createBrushBorder 的参数。
 * 不要边框时显式关掉；要边框时**不传** enabled，让控制器在落笔那一刻自己跟随 html.m-ink-ready ——
 * 引擎可能比组件挂载得晚，渲染期读一次 DOM 会把还没准备好的那一刻钉死。
 */
export function cardBrush(props: CardProps): BrushBorderControllerOptions {
  return {
    ...CARD_FRAME_STROKES[props.frame ?? "double"],
    seed: props.seed ?? SEED,
    ...((props.bordered ?? true) ? {} : { enabled: false }),
  };
}

/**
 * 纸：卡片底是一页宣纸，四边毛边。遮罩按卡片尺寸生成（16px 分桶），
 * 纸比框大一圈（PAPER_OUT），撕口的深浅在 0 到十来像素之间起伏，所以纸缘大多只在框外露出两三像素，
 * 极个别地方缩到框线以内——内容区最少 12px 内边距，裁不到字。只裁纸（::after），不裁内容。
 *
 * 尺寸是量出来的，服务端和水合首帧都是 0×0，那时返回空串，渲染的是没有纸的朴素版。
 */
export function cardPaperMask(o: { seed?: number; width: number; height: number }): string {
  if (o.width <= 0 || o.height <= 0) return "";
  const bucket = (v: number) =>
    Math.max(PAPER_BUCKET, Math.ceil((v + PAPER_OUT * 2) / PAPER_BUCKET) * PAPER_BUCKET);
  return deckleMaskUrl({
    seed: (o.seed ?? SEED) + PAPER_SEED_OFFSET,
    amount: 0.2,
    width: bucket(o.width),
    height: bucket(o.height),
  });
}

export interface CardInk extends InkVarBindings {
  style: Record<string, string>;
}

/**
 * 卡片根元素上的 CSS 变量。纸缘遮罩走素材登记：同尺寸的卡共用样式表里的一条规则、
 * 元素上只挂一个属性；登记不了（还没挂载、或服务端）才内联。
 *
 * `mounted` 既是"能不能登记"的闸门，也是"敢不敢读 DOM"的闸门：
 * 没挂载前一律当作没开引擎，服务端和水合首帧输出一致。
 */
export function cardInk(o: {
  seed?: number;
  padding?: number | string;
  width: number;
  height: number;
  mounted: boolean;
}): CardInk {
  const padding = o.padding ?? PADDING;
  const mask = o.mounted && isInkReady() ? cardPaperMask(o) : "";
  const bindings = inkVarBindings({ "--m-card-paper-mask": mask || undefined }, o.mounted);
  return {
    attrs: bindings.attrs,
    style: {
      "--m-card-padding": typeof padding === "number" ? `${padding}px` : padding,
      ...bindings.style,
      // 遮罩还没生成时不外扩：否则会先闪一下比框大一圈的方纸
      ...(mask ? { "--m-card-paper-out": `${PAPER_OUT}px` } : {}),
    },
  };
}

/** 纸纹和标题旁的朱批是固定素材，写到 :root 上所有卡片共用；只在开了引擎时才生成 */
export function ensureCardSheet(): void {
  if (isInkReady()) ensureSheetAssets();
}

/**
 * 头部和内容之间那条线：按卡片实际宽度单独生成一笔，用的是全库共用的笔触线控制器
 * （通用的长线横向压到几十像素会糊成发丝，所以每条线都按自己的长度生成）。
 */
export function createCardDivider(seed?: number): BrushLineController {
  return createBrushLine(cardDividerLine(seed));
}

/** 分隔线的笔触参数；seed 变了要重新喂给控制器 */
export function cardDividerLine(seed = SEED): BrushLineControllerOptions {
  return { thickness: DIVIDER_THICKNESS, vertical: false, seed: seed + DIVIDER_SEED_OFFSET };
}
