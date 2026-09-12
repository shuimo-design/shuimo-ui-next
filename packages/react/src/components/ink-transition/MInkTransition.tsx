import { useMemo, type ReactElement } from "react";
import {
  INK_TRANSITION_NAME,
  inkTransitionHooks,
  type InkTransitionProps as CoreInkTransitionProps,
} from "@shuimo-design/core";
import { MTransition } from "../../transition";

export interface MInkTransitionProps extends Omit<CoreInkTransitionProps, "mode"> {
  /** 是否显示。对应 Vue 那边写在插槽里的 v-if */
  in: boolean;
  /** 要擦入 / 擦掉的那个元素，必须是单个能接 ref 的元素 */
  children: ReactElement;
}

/**
 * 墨迹转场：进入时从毛边遮罩里擦出来，离开时反向擦掉。
 *
 * 钩子来自 core 的 inkTransitionHooks，和 Vue 那边是同一份；这里只是把它们交给 MTransition。
 * css={false} 表示一个类名都不加 —— 这个组件的动画全在 Web Animations 里，没有对应的 CSS 规则。
 */
export function MInkTransition(props: MInkTransitionProps) {
  const {
    in: show,
    appear = false,
    children,
    duration,
    leaveDuration,
    seed,
    direction,
    raggedness,
    softness,
    reducedMotion,
  } = props;

  const hooks = useMemo(
    () =>
      inkTransitionHooks({
        duration,
        leaveDuration,
        seed,
        direction,
        raggedness,
        softness,
        reducedMotion,
      }),
    [duration, leaveDuration, seed, direction, raggedness, softness, reducedMotion],
  );

  return (
    <MTransition name={INK_TRANSITION_NAME} css={false} in={show} appear={appear} {...hooks}>
      {children}
    </MTransition>
  );
}
