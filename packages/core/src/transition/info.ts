/**
 * 读出元素身上过渡 / 动画要跑多久。
 *
 * 这段是照 @vue/runtime-dom 的 Transition 移植的，**必须和它算得一模一样**：
 * Vue 侧继续用原生 <Transition>，React 侧用我们自己的 runner，
 * 两边要产出同一套类名时序，共用的那 7000 行 CSS 才成立。
 */
import { prefersReducedMotion } from "../runtime/dom";

export const TRANSITION = "transition";
export const ANIMATION = "animation";

export interface TransitionInfo {
  type: typeof TRANSITION | typeof ANIMATION | null;
  timeout: number;
  propCount: number;
  hasTransform: boolean;
}

function toMs(value: string): number {
  // "0.24s" / "240ms"；空串按 0 算
  return Number(value.slice(0, -1).replace(",", ".")) * 1000;
}

/** 各条属性的 delay + duration 里最大的那个 */
function getTimeout(delays: string[], durations: string[]): number {
  while (delays.length < durations.length) delays = delays.concat(delays);
  return Math.max(...durations.map((d, i) => toMs(d) + toMs(delays[i]!)));
}

export function getTransitionInfo(
  el: Element,
  expectedType?: TransitionInfo["type"],
): TransitionInfo {
  const styles = window.getComputedStyle(el);
  const get = (name: string) => (styles[name as keyof CSSStyleDeclaration] as string).split(", ");
  const transitionDelays = get(`${TRANSITION}Delay`);
  const transitionDurations = get(`${TRANSITION}Duration`);
  const transitionTimeout = getTimeout(transitionDelays, transitionDurations);
  const animationDelays = get(`${ANIMATION}Delay`);
  const animationDurations = get(`${ANIMATION}Duration`);
  const animationTimeout = getTimeout(animationDelays, animationDurations);

  let type: TransitionInfo["type"] = null;
  let timeout = 0;
  let propCount = 0;
  if (expectedType === TRANSITION) {
    if (transitionTimeout > 0) {
      type = TRANSITION;
      timeout = transitionTimeout;
      propCount = transitionDurations.length;
    }
  } else if (expectedType === ANIMATION) {
    if (animationTimeout > 0) {
      type = ANIMATION;
      timeout = animationTimeout;
      propCount = animationDurations.length;
    }
  } else {
    timeout = Math.max(transitionTimeout, animationTimeout);
    type = timeout > 0 ? (transitionTimeout > animationTimeout ? TRANSITION : ANIMATION) : null;
    propCount =
      type === TRANSITION
        ? transitionDurations.length
        : type === ANIMATION
          ? animationDurations.length
          : 0;
  }
  const hasTransform =
    type === TRANSITION &&
    /\b(?:transform|all)(?:,|$)/.test(get(`${TRANSITION}Property`).toString());
  return { type, timeout, propCount, hasTransform };
}

/**
 * 等这个元素身上的过渡跑完再调 resolve。
 * 只认元素自己身上的事件（子元素的过渡不算），并按 propCount 数够条数；
 * 另挂一个比 timeout 长 1ms 的兜底定时器，事件没来也不会卡住。
 */
export function whenTransitionEnds(
  el: HTMLElement,
  expectedType: TransitionInfo["type"] | undefined,
  explicitTimeout: number | undefined,
  resolve: () => void,
): void {
  if (prefersReducedMotion()) {
    resolve();
    return;
  }
  const { type, timeout, propCount } = getTransitionInfo(el, expectedType);
  const duration = explicitTimeout ?? timeout;
  if (!type || duration <= 0) {
    resolve();
    return;
  }
  const endEvent = `${type === TRANSITION ? TRANSITION : ANIMATION}end`;
  let ended = 0;
  const end = () => {
    el.removeEventListener(endEvent, onEnd);
    resolve();
  };
  const onEnd = (event: Event) => {
    if (event.target !== el) return;
    if (++ended >= propCount) end();
  };
  setTimeout(() => {
    if (ended < propCount) end();
  }, duration + 1);
  el.addEventListener(endEvent, onEnd);
}
