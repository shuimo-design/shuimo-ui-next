import type { InjectionKey, Ref } from "vue";
import type { RadioValue } from "./types";

export interface RadioGroupContext {
  modelValue: Ref<RadioValue | undefined>;
  disabled: Ref<boolean>;
  /** 组内共用的原生 name */
  name: Ref<string>;
  select: (value: RadioValue) => void;
}

export const radioGroupKey: InjectionKey<RadioGroupContext> = Symbol("m-radio-group");
