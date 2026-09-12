/**
 * 消息条的无框架部分：类名、墨迹变量、位移样式。
 * 行为（倒计时、拖动关闭、进出场动画）在 item-controller.ts，
 * 队列（函数式 API 那一套）在 overlay/message-queue.ts。
 */
import { inkBadgeUrl, type InkBadgeKind } from "../../ink/assets/badge";
import { inkRidgeUrl } from "../../ink/assets/ridge";
import { inkShapeUrl } from "../../ink/assets/shape";
import type { MessageDirection, MessageType } from "./types";

export type * from "./types";
export * from "./animate";
export {
  createMessageItem,
  type MessageItemController,
  type MessageItemOptions,
  type MessageItemSnapshot,
} from "./item-controller";

/** 关闭按钮的无障碍名，两个壳必须一致 */
export const MESSAGE_CLOSE_LABEL = "关闭";
/** 列表容器的无障碍名 */
export const MESSAGE_LIST_LABEL = "消息";

/** 类型 → 徽记里那个记号 */
const BADGE: Record<MessageType, InkBadgeKind> = {
  success: "check",
  warning: "bang",
  error: "cross",
  info: "info",
};

/** 六个方向，顺序固定：出口按它渲染列表容器，两个壳的 DOM 顺序才一致 */
export const MESSAGE_DIRECTIONS: readonly MessageDirection[] = [
  "top-right",
  "top-left",
  "top-center",
  "bottom-right",
  "bottom-left",
  "bottom-center",
];

export function messageListClasses(direction: MessageDirection): string[] {
  return ["m-message-list", `m-message-list--${direction}`];
}

export function messageClasses(options: {
  type: MessageType;
  direction: MessageDirection;
  dragging: boolean;
  removing: boolean;
  closing: boolean;
}): string[] {
  const classes = ["m-message", `m-message--${options.type}`, `m-message--${options.direction}`];
  if (options.dragging) classes.push("m-message--dragging");
  if (options.removing) classes.push("m-message--removing");
  if (options.closing) classes.push("m-message--closing");
  return classes;
}

/**
 * 根元素上的内联变量。毛边墨纸按消息实际尺寸生成（生成器自己按 8px 分桶缓存），
 * 还没量到尺寸（服务端、首帧）就不给这几个变量，CSS 那边有兜底。
 * 拖动位移也走这里：拖的时候要跟手，只能是内联 transform。
 */
export function messageStyle(options: {
  type: MessageType;
  seed: number;
  width: number;
  height: number;
  x: number;
  y: number;
}): Record<string, string | undefined> {
  const { type, seed, width, height, x, y } = options;
  const shape =
    width && height
      ? inkShapeUrl(width, height, { seed, raggedness: 0.7, corner: 0.1 })
      : undefined;
  const ridge = inkRidgeUrl({ seed, width: 200, height: 80, layers: 2, opacity: 0.7 });
  return {
    "--m-message-badge": `url("${inkBadgeUrl(BADGE[type], { seed })}")`,
    "--m-message-shape": shape ? `url("${shape.url}")` : undefined,
    "--m-message-shape-pad": shape ? `${shape.padding}px` : undefined,
    "--m-message-ridge": `url("${ridge.url}")`,
    transform: x || y ? `translate(${x}px, ${y}px)` : undefined,
  };
}
