/**
 * 表单的无框架部分：类名派生、标签宽度、那一笔朱砂错误线的墨迹参数。
 * 校验规则执行器在 validate.ts，校验状态机在 item-controller.ts，
 * 上下文形状和"表单项集合"在 context/form.ts。
 */
import { brushLineUrl } from "../../ink/assets/line";
import { inkVarBindings, type InkVarBindings } from "../../ink/registry";
import type { FormItemSnapshot } from "./item-controller";
import type { FormItemValidateState, FormLabelPosition } from "./types";

export type * from "./types";
export * from "./validate";
export {
  createFormItem,
  formItemRules,
  type FormItemController,
  type FormItemOptions,
  type FormItemSnapshot,
} from "./item-controller";

export function formClasses(options: {
  labelPosition: FormLabelPosition;
  inline: boolean;
  disabled: boolean;
}): string[] {
  const classes = ["m-form", `m-form--label-${options.labelPosition}`];
  if (options.inline) classes.push("m-form--inline");
  if (options.disabled) classes.push("m-form--disabled");
  return classes;
}

export function formItemClasses(options: {
  labelPosition: FormLabelPosition;
  /** 要不要显示必填星号（已经把 hideRequiredAsterisk 算进去了） */
  asterisk: boolean;
  state: FormItemValidateState;
  hasLabel: boolean;
}): string[] {
  const classes = ["m-form-item", `m-form-item--label-${options.labelPosition}`];
  if (options.asterisk) classes.push("m-form-item--required");
  if (options.state) classes.push(`m-form-item--${options.state}`);
  if (!options.hasLabel) classes.push("m-form-item--no-label");
  return classes;
}

/** 标签宽度；labelPosition 为 top 时标签独占一行，不需要定宽 */
export function formItemLabelStyle(options: {
  labelPosition: FormLabelPosition;
  /** 表单项自己的 labelWidth，没有就用表单的 */
  labelWidth: string | number | undefined;
}): Record<string, string> | undefined {
  if (options.labelPosition === "top") return undefined;
  const width = options.labelWidth ?? 120;
  return { width: typeof width === "number" ? `${width}px` : width };
}

/**
 * 出错时控件下方那一笔朱砂的参数。按内容区最大宽度（320px）生成一次，
 * 短于它时 CSS 只缩不拉（见 form.css 的 `--m-form-item-line-w`）。
 * 这里存参数而不是直接存生成好的 url：生成是在第一次用到时才做的，
 * 没用表单的应用不用为它付这份开销（brushLineUrl 自带缓存，之后都是查表）。
 */
export const FORM_ITEM_LINE = { seed: 11, length: 320, thickness: 2, flyingWhite: 0.1 } as const;

/**
 * 那一笔朱砂要交给 CSS 的三个变量。
 *
 * `registered` 必须显式传：这一笔是**固定素材**，每个表单项都一样，所以走素材登记表
 * （样式表里写一次、元素上只挂一个短属性）。但服务端没有 document，登记必然失败、只能内联 style；
 * 客户端首帧却登记得上、挂出 data 属性 —— 两边输出对不上，水合就报不匹配。
 * 规矩是：服务端和水合首帧一律传 false，挂载之后再传 true。
 */
export function formItemInk(registered: boolean): {
  attrs: Record<string, string>;
  style: Record<string, string>;
} {
  const line = brushLineUrl(FORM_ITEM_LINE);
  const ink: InkVarBindings = inkVarBindings({ "--m-form-item-line-mask": line.url }, registered);
  return {
    attrs: ink.attrs,
    style: {
      ...ink.style,
      "--m-form-item-line-band": `${line.height}px`,
      "--m-form-item-line-w": `${line.width}px`,
    },
  };
}

/**
 * 渲染时真正显示的校验态。
 *
 * 外部塞进来的 `error` prop **在渲染期派生**，不再用 watch 写进状态：
 * 原来两边各要写一个 watch 把它同步进状态机，React 那边还得是 effect（慢一帧，首帧会闪一下正常态），
 * 服务端更是根本不跑 effect。改成纯派生之后两边都不用 watch，SSR 也天然正确。
 * 语义：`error` 非空就一律显示为错误态、用它的文字；为空才看快照。
 */
export function formItemState(
  snapshot: FormItemSnapshot,
  error: string | undefined,
): { state: FormItemValidateState; message: string } {
  if (error) return { state: "error", message: error };
  return { state: snapshot.state, message: snapshot.message };
}

/**
 * 错误文字要不要显示。
 *
 * **校验中（`validating`）沿用上一次的错误，不把它闪掉。** 这不是审美问题，是个实打实的 bug：
 * 校验会先把状态置成 `validating`、跑完规则再置回 `error`。React 里这两次状态变化会
 * 各渲染一帧（中间隔着一个微任务），错误框因此会消失一帧又冒出来 —— 它下面的按钮跟着上下跳，
 * 浏览器的 mousedown 和 mouseup 就落到了不同元素上，click 事件根本不产生。
 * （2026-09-13 实测：React 版表单里"填完内容再点校验按钮"稳定点不动，就是这条。）
 * 让错误在校验期间留着，布局不动，两个框架的行为也一致了。
 */
export function formItemShowError(options: {
  state: FormItemValidateState;
  message: string;
  showMessage: boolean;
}): boolean {
  if (!options.showMessage || options.message === "") return false;
  return options.state === "error" || options.state === "validating";
}
