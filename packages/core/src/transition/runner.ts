/**
 * 过渡执行器：按 Vue <Transition> 的类名时序给元素加类、等动画跑完、再清掉。
 *
 * 为什么要有它：CSS 里写死的是 `.m-dialog-enter-from` 这一套 Vue 的命名。
 * Vue 侧继续用原生 <Transition>（类名一致、零成本，还顺带管着 v-if/v-show 双形态、
 * mode、appear 这些已经验证过的边界行为，重写不划算）；React 侧没有对应物，
 * 就用这个 runner 产出**完全相同的类名序列**。契约是"类名时序"，不是"实现同源"。
 */
import { reflow } from "../runtime/dom";
import { whenTransitionEnds, type TransitionInfo } from "./info";

export interface TransitionHooks {
  onBeforeEnter?(el: HTMLElement): void;
  /** 带第二个参数（done）时由钩子接管结束时机，否则等 transitionend */
  onEnter?(el: HTMLElement, done: () => void): void;
  onAfterEnter?(el: HTMLElement): void;
  onEnterCancelled?(el: HTMLElement): void;
  onBeforeLeave?(el: HTMLElement): void;
  onLeave?(el: HTMLElement, done: () => void): void;
  onAfterLeave?(el: HTMLElement): void;
  onLeaveCancelled?(el: HTMLElement): void;
}

export interface TransitionSpec extends TransitionHooks {
  /** 类名前缀，如 "m-dialog"，产出 m-dialog-enter-from / -active / -to */
  name: string;
  /** false = 一个类名都不加，只跑 JS 钩子（MInkTransition 走这条） */
  css?: boolean;
  type?: TransitionInfo["type"];
  duration?: number | { enter: number; leave: number };
}

export type TransitionPhase = "enter" | "leave";

export interface TransitionRun {
  readonly finished: Promise<void>;
  cancel(): void;
}

function classNames(name: string, phase: TransitionPhase) {
  return {
    from: `${name}-${phase}-from`,
    active: `${name}-${phase}-active`,
    to: `${name}-${phase}-to`,
  };
}

/** 连跳两帧：第一帧让 from 类落实，第二帧换成 to 类，过渡才会真的跑起来 */
function nextFrame(fn: () => void): void {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}

export function runTransition(
  el: HTMLElement,
  phase: TransitionPhase,
  spec: TransitionSpec,
): TransitionRun {
  const css = spec.css !== false;
  const { from, active, to } = classNames(spec.name, phase);
  const enter = phase === "enter";
  let cancelled = false;

  (enter ? spec.onBeforeEnter : spec.onBeforeLeave)?.(el);
  if (css) {
    el.classList.add(from, active);
    // 离场要先把 from 的样式落实，否则浏览器把加类和改类合成一帧，过渡不跑
    if (!enter) reflow(el);
  }

  const finished = new Promise<void>((resolve) => {
    const done = () => {
      if (cancelled) return;
      if (css) el.classList.remove(active, to);
      (enter ? spec.onAfterEnter : spec.onAfterLeave)?.(el);
      resolve();
    };

    const explicit = typeof spec.duration === "number" ? spec.duration : spec.duration?.[phase];
    const hook = enter ? spec.onEnter : spec.onLeave;

    // css: false —— 完全交给 JS 钩子
    if (!css) {
      if (hook) hook(el, done);
      else done();
      return;
    }

    nextFrame(() => {
      if (cancelled) return;
      el.classList.remove(from);
      el.classList.add(to);
      // 钩子声明了 done 参数就由它说了算，否则等 transitionend / animationend
      if (hook && hook.length >= 2) hook(el, done);
      else whenTransitionEnds(el, spec.type, explicit, done);
    });
  });

  return {
    finished,
    cancel() {
      if (cancelled) return;
      cancelled = true;
      if (css) el.classList.remove(from, active, to);
      (enter ? spec.onEnterCancelled : spec.onLeaveCancelled)?.(el);
    },
  };
}
