import type { WipeMaskOptions } from "../../ink/reveal/mask";

export interface InkTransitionProps extends WipeMaskOptions {
  /** 进入时长 ms，默认 900 */
  duration?: number;
  /** 离开时长 ms，默认 600 */
  leaveDuration?: number;
  /** 首次渲染也播放，默认 false */
  appear?: boolean;
  /** 透传给 <Transition> 的 mode */
  mode?: "in-out" | "out-in" | "default";
  /** 强制跳过动画；未传则跟随 prefers-reduced-motion */
  reducedMotion?: boolean;
}

export interface InkTransitionSlots {
  default?: () => unknown;
}
