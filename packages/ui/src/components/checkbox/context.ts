import type { InjectionKey, Ref } from "vue";
import type { CheckboxValue } from "./types";

export interface CheckboxGroupContext {
  modelValue: Ref<CheckboxValue[]>;
  disabled: Ref<boolean>;
  /** 当前能否再勾选 / 取消（min/max 限制） */
  canCheck: (value: CheckboxValue) => boolean;
  canUncheck: (value: CheckboxValue) => boolean;
  toggle: (value: CheckboxValue, checked: boolean) => void;
}

export const checkboxGroupKey: InjectionKey<CheckboxGroupContext> = Symbol("m-checkbox-group");
