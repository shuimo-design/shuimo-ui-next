import type { InjectionKey, Ref } from "vue";
import type { StepStatus, StepsDirection } from "./types";

export interface StepsContext {
  /** 登记一步，返回注销函数；序号按登记顺序算 */
  register: (id: string) => () => void;
  indexOf: (id: string) => number;
  count: Ref<number>;
  active: Ref<number>;
  status: Ref<StepStatus>;
  direction: Ref<StepsDirection>;
  simple: Ref<boolean>;
}

export const stepsKey: InjectionKey<StepsContext> = Symbol("m-steps");
