/**
 * 步骤条上下文的形状，两份：
 * - `StepsContextValue`：MSteps 的整组配置，一份发给所有步；
 * - `StepIndexContextValue`：这一步排第几、一共几步，一步一份。
 *
 * 序号为什么不走登记表（`context/registry.ts`）：登记表的顺序取决于 setup / effect 的执行时机，
 * React 在 Fragment / Suspense / 并发切片下不保证它和 DOM 顺序一致，服务端更是压根没有 DOM。
 * 两个壳必须数出同一套序号，所以都改成由 MSteps 从 children 的顺序里数，再一层层发下去。
 *
 * 字段一律纯值，响应式包在外面（Vue 的 computed / React 的 createContext）。
 */
import type { StepStatus, StepsDirection } from "../components/steps/types";

export interface StepsContextValue {
  /** 当前步的序号，从 0 起 */
  readonly active: number;
  /** 当前步的状态 */
  readonly status: StepStatus;
  readonly direction: StepsDirection;
  readonly simple: boolean;
}

export const STEPS_CONTEXT_DEFAULT: StepsContextValue = {
  active: 0,
  status: "process",
  direction: "horizontal",
  simple: false,
};

export interface StepIndexContextValue {
  /** 这一步在组里排第几，从 0 起 */
  readonly index: number;
  /** 一共几步，用来判断自己是不是最后一步（最后一步不画连接线） */
  readonly count: number;
}

/** 不在 MSteps 里单独用 MStep 时：自己就是唯一的一步 */
export const STEP_INDEX_DEFAULT: StepIndexContextValue = { index: 0, count: 1 };
