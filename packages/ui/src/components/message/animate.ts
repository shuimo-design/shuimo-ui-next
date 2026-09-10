/**
 * 消息进出场：右侧的从右滑入、左侧的从左滑入、居中的从上（下）落下；
 * 离场原路退回，同时把自己占的高度收掉，后面的消息顺势补位。
 * 用 WAAPI 直接驱动，不走 <Transition>：离场要从拖动停下的位置接着走。
 */
import type { MessageDirection } from "./types";

export interface MessageMotionBox {
  width: number;
  height: number;
  /** 与相邻消息的间距，收高度时一起收掉 */
  gap: number;
}

export interface MessageShift {
  x: number;
  y: number;
}

const DURATION = 300;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

/** 从屏幕外进来的位移：右侧列表往右出、左侧往左、顶部居中往上、底部居中往下 */
function offscreen(direction: MessageDirection, box: MessageMotionBox): MessageShift {
  if (direction.endsWith("right")) return { x: box.width, y: 0 };
  if (direction.endsWith("left")) return { x: -box.width, y: 0 };
  return { x: 0, y: direction === "top-center" ? -box.height : box.height };
}

function translate(shift: MessageShift, scale = 1): string {
  const move = `translate(${shift.x}px, ${shift.y}px)`;
  return scale === 1 ? move : `${move} scale(${scale})`;
}

/** 顶部列表新消息接在末尾不挤别人；底部列表新消息会把上面的顶起来，用负外边距让它们滑上去 */
function collapsed(direction: MessageDirection, box: MessageMotionBox): Keyframe {
  const margin = `-${box.height + box.gap}px`;
  return direction.startsWith("bottom") ? { marginTop: margin } : { marginBottom: margin };
}

export function enterKeyframes(direction: MessageDirection, box: MessageMotionBox): Keyframe[] {
  const center = direction.endsWith("center");
  const from: Keyframe = {
    opacity: 0,
    transform: translate(offscreen(direction, box), center ? 0.9 : 1),
  };
  const to: Keyframe = { opacity: 1, transform: translate({ x: 0, y: 0 }) };
  if (direction.startsWith("bottom")) {
    Object.assign(from, collapsed(direction, box));
    to.marginTop = "0px";
  }
  return [from, to];
}

/** 起始帧不写 opacity：拖到一半松手的消息已经是半透明，从它当前的值接着淡出 */
export function leaveKeyframes(
  direction: MessageDirection,
  box: MessageMotionBox,
  shift: MessageShift,
): Keyframe[] {
  const center = direction.endsWith("center");
  return [
    { transform: translate(shift) },
    {
      opacity: 0,
      transform: translate(offscreen(direction, box), center ? 0.9 : 1),
      ...collapsed(direction, box),
    },
  ];
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

/** 播放一段进出场动画；减弱动效或环境不支持时立刻 resolve */
export function animateMessage(
  el: HTMLElement,
  keyframes: Keyframe[],
  fill: FillMode,
): Promise<void> {
  if (prefersReducedMotion() || typeof el.animate !== "function") return Promise.resolve();
  const animation = el.animate(keyframes, { duration: DURATION, easing: EASING, fill });
  return animation.finished.then(
    () => {},
    () => {},
  );
}
