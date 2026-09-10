import type { InjectionKey, Ref } from "vue";

export interface GridContext {
  /** 格子默认宽 */
  w: Ref<number | undefined>;
  /** 格子默认高 */
  h: Ref<number | undefined>;
  direction: Ref<"row" | "column">;
  /** 是否是 cols 网格模式 */
  cols: Ref<boolean>;
  /** 每道分隔的倾斜角 */
  gapRotate: Ref<number[]>;
  /** 格子挂载时登记自己，栅格按 DOM 顺序给它一个下标 */
  register: (el: HTMLElement) => void;
  unregister: (el: HTMLElement) => void;
  /** 格子在栅格里的下标；未登记时是 -1 */
  indexOf: (el: HTMLElement) => number;
}

export const gridKey: InjectionKey<GridContext> = Symbol("m-grid");
