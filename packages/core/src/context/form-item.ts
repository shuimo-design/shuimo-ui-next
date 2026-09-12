/**
 * MFormItem 向它里面的控件（输入框、数字框、开关、选择器……）提供的上下文。
 *
 * 和 form.ts 同一个道理：字段是纯值，不是 Ref。控件拿它做三件事 ——
 * 把 `id` 写到原生元素上（label 的 for 才点得动）、跟着整项一起禁用、值变 / 失焦时报一声让表单项跑校验。
 */
export interface FormItemContextValue {
  /** 控件 id，给 label 的 for 用；控件应把它写到原生元素上 */
  id: string | undefined;
  /** 整项禁用（来自 MForm 的 disabled） */
  disabled: boolean;
  /** 控件值变化 / 失焦时通知表单项跑校验 */
  validate(trigger: "change" | "blur"): void;
}

/** 不在表单里时控件用这一份；引用恒定 */
export const FORM_ITEM_CONTEXT_DEFAULT: FormItemContextValue = {
  id: undefined,
  disabled: false,
  validate: () => {},
};

/**
 * 控件自身的 disabled 和表单项的 disabled 取或。
 * 这是 Vue 的 `useDisabled()` 和 React 的 `useDisabled()` 共用的那一行，
 * 免得两边各写一遍"到底谁优先"的规则。
 */
export function mergeDisabled(own: boolean | undefined, ctx: boolean | undefined): boolean {
  return Boolean(own || ctx);
}
