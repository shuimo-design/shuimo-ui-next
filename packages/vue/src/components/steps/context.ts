import type { ComputedRef, InjectionKey } from "vue";
import type { StepIndexContextValue, StepsContextValue } from "@shuimo-design/core";

/**
 * 上下文的形状（字段都是纯值）在 core，这里只管 Vue 这一侧的容器：纯值外面包一层 computed。
 *
 * 两份上下文：整组配置一份发给所有步，位置一步一份 —— 位置由 MSteps 按 children 顺序数出来
 * （不再让每一步登记，理由见 core 的 context/steps.ts）。
 * 注入不到就是"单独用 MStep"，core 的默认值会接住。
 */
export const stepsKey: InjectionKey<ComputedRef<StepsContextValue>> = Symbol("m-steps");
export const stepIndexKey: InjectionKey<ComputedRef<StepIndexContextValue>> =
  Symbol("m-step-index");
