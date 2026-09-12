import {
  cloneElement,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type Ref,
} from "react";
import { runTransition, type TransitionHooks, type TransitionRun } from "@shuimo-design/core";

export interface MTransitionProps extends TransitionHooks {
  /** 类名前缀，和 CSS 里写死的那套对上，比如 "m-dialog" */
  name: string;
  /** 是否显示 */
  in: boolean;
  /** 首帧就显示时要不要播入场，默认不播（对应 Vue 的 appear） */
  appear?: boolean;
  /** false = 一个类名都不加，只跑 JS 钩子 */
  css?: boolean;
  type?: "transition" | "animation";
  duration?: number | { enter: number; leave: number };
  /**
   * true（默认）是 v-if 语义：离场结束就把节点卸掉。
   * false 是 v-show 语义：离场后只 display:none 留在树里 ——
   * 弹窗用的是这个，首次打开后内容常驻，笔触边框和面板尺寸不用每次重算。
   */
  unmountOnLeave?: boolean;
  children: ReactElement;
}

/**
 * React 侧的过渡。类名时序由 core 的 runTransition 产出，和 Vue 原生 <Transition>
 * 完全一致，所以两边共用同一份 CSS。
 */
export function MTransition(props: MTransitionProps) {
  const { in: show, appear = false, unmountOnLeave = true, children, ...spec } = props;
  const node = useRef<HTMLElement | null>(null);
  const run = useRef<TransitionRun | null>(null);
  const [mounted, setMounted] = useState(show);
  const first = useRef(true);

  // cloneElement 里写 ref 会把孩子自己的 ref 顶掉。浮层正是靠那个 ref 把元素交给定位控制器的，
  // 顶掉之后控制器永远拿不到浮层元素，坐标算不出来，浮层就一直停在左上角、opacity: 0。
  // 所以这里把两个 ref 串起来：先记给自己，再原样转交给孩子的。
  // 回调的身份必须稳定（useCallback + 用 ref 存孩子的 ref），否则每次渲染 React 都会
  // 先 ref(null) 再 ref(node)，控制器会被反复摘挂。
  const childRef = useRef<Ref<HTMLElement> | undefined>(undefined);
  childRef.current = (children as ReactElement<{ ref?: Ref<HTMLElement> }>).props.ref;
  const setNode = useCallback((el: HTMLElement | null) => {
    node.current = el;
    const own = childRef.current;
    if (typeof own === "function") own(el);
    else if (own) own.current = el;
  }, []);

  useLayoutEffect(() => {
    const el = node.current;
    const isFirst = first.current;
    first.current = false;
    if (isFirst && !appear) return;
    if (show && !mounted) {
      // 先把节点挂上，下一轮再播入场
      setMounted(true);
      return;
    }
    if (!el) return;
    run.current?.cancel();
    if (show) {
      el.style.removeProperty("display");
      run.current = runTransition(el, "enter", spec);
    } else {
      run.current = runTransition(el, "leave", spec);
      void run.current.finished.then(() => {
        if (unmountOnLeave) setMounted(false);
        else el.style.display = "none";
      });
    }
    // spec 每次渲染都是新对象，进依赖数组会每帧重播
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, mounted]);

  if (!mounted && unmountOnLeave) return null;
  return cloneElement(children, { ref: setNode } as never);
}
