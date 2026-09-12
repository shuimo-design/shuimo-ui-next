import type { TransitionProps } from "vue";
import type { TransitionHooks } from "@shuimo-design/core";

/** 钩子没声明 done 时给它一个空的，调用签名才统一 */
const NOOP = () => {};

type VueHook = (el: Element) => void;
type VueStageHook = (el: Element, done: () => void) => void;

function stage(hook: (el: HTMLElement, done: () => void) => void): VueStageHook {
  /*
   * 必须保留形参个数：Vue 的 <Transition> 和 core 的 runner 都按"钩子形参 >= 2"
   * 判断要不要把结束时机交给钩子。像 collapseHeightHooks.onLeave 那种只收一个参数、
   * 自己不调 done 的钩子，一旦被包成两个参数的函数，过渡就永远等不到结束（实测：提示条收不起来）。
   */
  return hook.length >= 2
    ? (el, done) => hook(el as HTMLElement, done)
    : (el) => hook(el as HTMLElement, NOOP);
}

function plain(hook: (el: HTMLElement) => void): VueHook {
  return (el) => hook(el as HTMLElement);
}

/**
 * 把 core 的过渡钩子接到 Vue 原生 <Transition> 的事件 props 上。
 *
 * 钩子本身一份都不重写 —— core 里的 collapseHeightHooks（MAlert 的收起）和
 * inkTransitionHooks（MInkTransition 的落墨）两个框架共用同一份实现，这里只补一层转接：
 * core 的钩子按 HTMLElement 写（它要碰 style、offsetHeight），Vue 的钩子签名是 Element，
 * 开了 strictFunctionTypes 之后前者不能直接当后者用。
 */
export function toVueTransitionHooks(hooks: TransitionHooks): TransitionProps {
  return {
    ...(hooks.onBeforeEnter && { onBeforeEnter: plain(hooks.onBeforeEnter) }),
    ...(hooks.onEnter && { onEnter: stage(hooks.onEnter) }),
    ...(hooks.onAfterEnter && { onAfterEnter: plain(hooks.onAfterEnter) }),
    ...(hooks.onEnterCancelled && { onEnterCancelled: plain(hooks.onEnterCancelled) }),
    ...(hooks.onBeforeLeave && { onBeforeLeave: plain(hooks.onBeforeLeave) }),
    ...(hooks.onLeave && { onLeave: stage(hooks.onLeave) }),
    ...(hooks.onAfterLeave && { onAfterLeave: plain(hooks.onAfterLeave) }),
    ...(hooks.onLeaveCancelled && { onLeaveCancelled: plain(hooks.onLeaveCancelled) }),
  };
}
