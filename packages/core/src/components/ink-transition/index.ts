/**
 * 墨迹转场的无框架部分。
 *
 * 这个组件的全部职责，就是把 ink/reveal 的 revealElement() 接到过渡的 enter / leave 上：
 * 进入时以毛边遮罩把元素擦出来，离开时反向擦掉。遮罩生成、动画时序、减弱动效的降级
 * 全在 revealElement 里，这里只负责"哪个阶段用什么参数"。
 *
 * 做成一个返回 TransitionHooks 的函数，两个壳共用同一份钩子：
 * Vue 把它接到原生 <Transition> 的事件上，React 把它展开给 MTransition。
 * 两边各写一遍的话，进出场时长、visibility 的清理时机迟早会错开一处。
 */
import { revealElement } from "../../ink/reveal";
import type { TransitionHooks } from "../../transition/runner";
import type { InkTransitionProps } from "./types";

export type { InkTransitionProps, InkTransitionSlots } from "./types";

/** 进入时长默认 900ms、离开 600ms —— 落墨比擦掉慢，和旧站的手感一致 */
export const INK_TRANSITION_DURATION = 900;
export const INK_TRANSITION_LEAVE_DURATION = 600;

/** 过渡的类名前缀。css 为 false 时一个类都不加，这里只是给 runner 一个名字占位 */
export const INK_TRANSITION_NAME = "m-ink-transition";

export type InkTransitionHookOptions = Omit<InkTransitionProps, "appear" | "mode">;

/**
 * 生成落墨转场的 enter / leave 钩子。
 *
 * 两个钩子都声明了第二个参数 done：Vue 的 <Transition> 和 core 的 runner 都按
 * "钩子的形参个数 >= 2" 判断要不要把结束时机交给钩子，少写一个参数动画还没跑完就被判定结束。
 */
export function inkTransitionHooks(options: InkTransitionHookOptions = {}): TransitionHooks {
  const {
    duration = INK_TRANSITION_DURATION,
    leaveDuration = INK_TRANSITION_LEAVE_DURATION,
    seed,
    direction = "right",
    raggedness,
    softness,
    reducedMotion,
  } = options;
  const mask = { seed, direction, raggedness, softness, reducedMotion };

  return {
    onEnter(el, done) {
      // 上一轮离场把元素藏起来了（revealElement 反向结束时会写 visibility: hidden）。
      // 同一个元素被复用时不清掉就再也显不出来
      el.style.visibility = "";
      void revealElement(el, { ...mask, duration }).then(done);
    },
    onLeave(el, done) {
      void revealElement(el, { ...mask, duration: leaveDuration, reverse: true }).then(done);
    },
    onAfterLeave(el) {
      el.style.visibility = "";
    },
  };
}
