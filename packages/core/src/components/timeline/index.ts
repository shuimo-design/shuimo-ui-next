/**
 * 时间线的无框架部分：把 items（或从子组件收集来的同一份配置）排成网格行、算出每条在轴线哪一侧、
 * 轴线和虚线段各占哪几行，以及节点用的两张墨迹素材。
 *
 * 布局用 CSS grid：整个 <ol> 是一张网格，每条 <li> 占一行，轴线是一个跨多行的元素 ——
 * 它的高度由网格给出，笔触线就能照分割线的办法按实际长度生成，服务端也不用量任何东西。
 * 轴线和 <li> 在网格里重叠，自动摆放会互相避让，所以行号全部在这里算好、写成内联样式。
 */
import { inkBlobUrl } from "../../ink/assets/blob";
import { inkEnsoUrl } from "../../ink/assets/enso";
import type { BrushLineControllerOptions } from "../divider";
import type { TimelineItemConfig, TimelineMode, TimelineProps } from "./types";

export type {
  TimelineItem,
  TimelineItemConfig,
  TimelineItemProps,
  TimelineItemScope,
  TimelineItemSlots,
  TimelineMode,
  TimelineProps,
  TimelineSlots,
  TimelineType,
} from "./types";

/** 内容在轴线的哪一侧 */
export type TimelineSide = "left" | "right";

/** 幽灵节点的 key，数据项的 key 撞上它的概率可以不管 */
const PENDING_KEY = "m-timeline-pending";
/** 轴线笔触的默认种子 */
const SEED = 5;

export function timelineClasses(props: TimelineProps): string[] {
  const { mode = "left", pending = false, reverse = false } = props;
  return [
    "m-timeline",
    `m-timeline--${mode}`,
    ...(pending ? ["m-timeline--pending"] : []),
    ...(reverse ? ["m-timeline--reverse"] : []),
  ];
}

/** 排好位置的一条，模板直接循环 */
export interface TimelineEntry<Node = unknown> {
  readonly key: string | number;
  readonly item: TimelineItemConfig<Node>;
  /** 在 items 里的下标，交给作用域插槽；幽灵节点是 items.length */
  readonly index: number;
  /** 内容在轴线哪一侧 */
  readonly side: TimelineSide;
  /** 是末尾那个幽灵节点 */
  readonly pending: boolean;
  /** 节点里有东西（文字或插槽），画成带字的圈而不是墨点 */
  readonly ring: boolean;
  readonly classes: string[];
  /** 这一行的 grid-row */
  readonly style: Record<string, string>;
}

/** 轴线 / 虚线段占的行区间，写成 grid-row */
export interface TimelineSegment {
  readonly style: Record<string, string>;
}

export interface TimelineLayout<Node = unknown> {
  readonly entries: TimelineEntry<Node>[];
  /** 实心轴线：第一个节点到最后一个节点；不到两个节点就没有 */
  readonly axis: TimelineSegment | null;
  /** 最后一个节点到幽灵节点之间的虚线段 */
  readonly pendingLine: TimelineSegment | null;
}

/** 内容在轴线哪一侧：left 模式轴在左、内容在右；alternate 按显示顺序左右交替，第一条在左 */
export function timelineSide(mode: TimelineMode, position: number): TimelineSide {
  if (mode === "left") return "right";
  if (mode === "right") return "left";
  return position % 2 === 0 ? "left" : "right";
}

export function timelineItemClasses(o: {
  side: TimelineSide;
  type: TimelineItemConfig["type"];
  ring: boolean;
  pending: boolean;
  last: boolean;
}): string[] {
  return [
    "m-timeline-item",
    `m-timeline-item--${o.side}`,
    ...(o.type ? [`m-timeline-item--${o.type}`] : []),
    ...(o.ring ? ["m-timeline-item--ring"] : []),
    ...(o.pending ? ["m-timeline-item--pending"] : []),
    ...(o.last ? ["m-timeline-item--last"] : []),
  ];
}

/**
 * 把 items 排成网格行。
 *
 * - reverse 只改显示顺序，index 仍是数据下标；
 * - pending 在末尾补一个幽灵节点（reverse 时在最前）；
 * - `customDot` 是"整条时间线给了 dot 插槽"，每个节点都按带内容的圈来画。
 */
export function timelineLayout<Node>(
  items: readonly TimelineItemConfig<Node>[],
  o: { mode?: TimelineMode; pending?: boolean | string; reverse?: boolean; customDot?: boolean },
): TimelineLayout<Node> {
  const { mode = "left", pending = false, reverse = false, customDot = false } = o;
  const ordered = items.map((item, index) => ({ item, index, ghost: false }));
  if (reverse) ordered.reverse();

  const ghost = pending
    ? [
        {
          item: {
            content: typeof pending === "string" ? pending : undefined,
          } as TimelineItemConfig<Node>,
          index: items.length,
          ghost: true,
        },
      ]
    : [];
  const sequence = reverse ? [...ghost, ...ordered] : [...ordered, ...ghost];

  const entries = sequence.map(
    ({ item, index, ghost: isPending }, position): TimelineEntry<Node> => {
      const side = timelineSide(mode, position);
      const ring = !isPending && (customDot || Boolean(item.dot) || Boolean(item.renderDot));
      const last = position === sequence.length - 1;
      return {
        key: isPending ? PENDING_KEY : (item.key ?? index),
        item,
        index,
        side,
        pending: isPending,
        ring,
        classes: timelineItemClasses({ side, type: item.type, ring, pending: isPending, last }),
        style: { gridRow: String(position + 1) },
      };
    },
  );

  const count = items.length;
  /** 真实节点占的第一行：reverse 且有幽灵节点时，幽灵节点在第 1 行 */
  const firstRow = reverse && pending ? 2 : 1;
  const lastRow = firstRow + count - 1;
  const axis = count >= 2 ? { style: { gridRow: `${firstRow} / ${lastRow}` } } : null;
  let pendingLine: TimelineSegment | null = null;
  if (pending && count >= 1) {
    pendingLine = reverse
      ? { style: { gridRow: "1 / 2" } }
      : { style: { gridRow: `${lastRow} / ${lastRow + 1}` } };
  }
  return { entries, axis, pendingLine };
}

/**
 * 轴线的笔触参数：细而直，靠飞白出枯笔感；一条时间线只有一根轴，长度由网格给出。
 * 画幅高 = thickness*2 + pad*2，1.5px 的笔宽算出来是 9px，和 CSS 里的回落值一致
 */
export function timelineAxisLineOptions(seed = SEED): BrushLineControllerOptions {
  return { thickness: 1.5, vertical: true, wobble: 0.6, roughness: 0.4, flyingWhite: 0.3, seed };
}

/** 墨点和带字的圈只在 m.ink 层出场，都是固定素材，只生成一次 */
const BLOB = inkBlobUrl({ seed: 5, size: 24, radius: 0.4, raggedness: 0.14 });
const ENSO = inkEnsoUrl({ seed: 6, size: 40, strokeWidth: 2.5, gap: 0.5 });

/** 两张素材挂在根上，节点的 ::before 拿它们当遮罩 */
export function timelineStyle(): Record<string, string> {
  return {
    "--m-timeline-blob": `url("${BLOB}")`,
    "--m-timeline-enso": `url("${ENSO}")`,
  };
}
