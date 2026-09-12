/**
 * 表单项的校验状态机。原来整份在 MFormItem.vue 的 <script setup> 里，
 * 里面有三样真状态：校验态、错误文字、以及"竞态票据"。
 *
 * **竞态票据**（`seq`）是这样一件事：规则里的 `validator` 可以是 async 的，
 * 用户连打两次，第一次的请求可能比第二次回来得晚。回来时发现票号已经不是自己那一张，
 * 就直接丢掉结果 —— 否则旧答案会盖住新答案。
 *
 * 形状按 runtime/controller.ts 的三条铁律：
 * - `update()` 纯赋值，不通知也不跑校验；
 * - `getServerSnapshot()` 恒定返回同一个空状态（服务端算不出校验结果）；
 * - `connect()/disconnect()` 幂等可反复配对，初值只在第一次 connect 时捕获
 *   （React 的 StrictMode 会 connect→disconnect→connect 跑两轮，重捕一次值也是一样的值，
 *    但用一个标记锁住更稳：中间万一有别的代码改了 model，初值不该跟着漂）。
 */
import { createStore } from "../../runtime/store";
import type { Controller } from "../../runtime/controller";
import type { FormFieldHandle } from "../../context/form";
import type {
  FormFieldError,
  FormItemValidateState,
  FormModel,
  FormRule,
  FormRules,
  FormTrigger,
} from "./types";
import {
  cloneValue,
  getByPath,
  normalizeRules,
  rulesForTrigger,
  runRules,
  setByPath,
} from "./validate";

export interface FormItemOptions {
  /** 对应 model 里的字段名，支持 "a.b" 点路径 */
  prop: string | undefined;
  /** 只作用于本项的规则，优先于表单的 rules */
  ownRules: FormRule | FormRule[] | undefined;
  /** 必填快捷写法 */
  required: boolean;
  /** 外部塞进来的错误（接口返回的那种）：非空时校验直接用它，不跑规则 */
  error: string | undefined;
  formModel: FormModel | undefined;
  formRules: FormRules | undefined;
  /** 校验完回报给表单，表单转成 validate 事件 */
  onValidate: (prop: string, error: FormFieldError | undefined) => void;
}

export interface FormItemSnapshot {
  readonly state: FormItemValidateState;
  readonly message: string;
}

export interface FormItemController extends Controller<FormItemSnapshot, FormItemOptions> {
  /**
   * 登记给 MForm 的句柄。**引用恒定**：prop 变了是原地改它的字段，
   * 不重新登记，表单那边的登记顺序才不会被打乱（见 context/form.ts 的注释）。
   */
  readonly field: FormFieldHandle;
  validate(trigger?: FormTrigger): Promise<FormFieldError | undefined>;
  resetField(): void;
  clearValidate(): void;
}

const SERVER_SNAPSHOT: FormItemSnapshot = { state: "", message: "" };

/**
 * 当前生效的规则：自己的 rules 优先，其次按 prop 从表单的 rules 里取；
 * `required` 是快捷写法，等价于在最前面加一条 `{ required: true }`。
 * 纯派生，壳在渲染期直接调（算星号要不要显示），控制器内部跑校验时也调同一份。
 */
export function formItemRules(options: {
  prop: string | undefined;
  ownRules: FormRule | FormRule[] | undefined;
  required: boolean;
  formRules: FormRules | undefined;
}): FormRule[] {
  const { prop, ownRules, required, formRules } = options;
  const list = normalizeRules(ownRules ?? (prop ? formRules?.[prop] : undefined));
  if (required && !list.some((rule) => rule.required)) return [{ required: true }, ...list];
  return list;
}

export function createFormItem(initial: FormItemOptions): FormItemController {
  const store = createStore<FormItemSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  /** 竞态票据，见文件头的说明 */
  let seq = 0;
  /** 第一次 connect() 时捕获的值，resetField 用 */
  let initialValue: unknown;
  let captured = false;

  const rules = () => formItemRules(options);
  const currentValue = () =>
    options.prop ? getByPath(options.formModel, options.prop) : undefined;

  async function validate(trigger?: FormTrigger): Promise<FormFieldError | undefined> {
    const { prop, error } = options;
    // 外部塞的 error 优先，控件交互不会把它冲掉
    if (error) return prop ? { prop, message: error } : undefined;
    // 已经在报错的项，任何时机都全量复核：否则 blur 只跑 blur 规则一通过，
    // 就把 change 规则报的错清掉了。
    // 判据是"屏幕上还挂着错误文字"而不是 `state === "error"`：控件失焦时会连着跑两次
    // （先 change 后 blur），第二次进来时状态已经被第一次置成了 validating，
    // 拿 state 判就会漏掉它 —— 结果是错误被 blur 那次的"只跑必填规则、通过"给清掉，
    // 错误框闪一下消失、下面的按钮跟着上跳，鼠标按下和抬起落到不同元素上，click 就丢了。
    const all = rules();
    const list = store.get().message !== "" ? all : rulesForTrigger(all, trigger);
    if (!prop || list.length === 0) return undefined;
    const ticket = ++seq;
    store.set({ state: "validating" });
    const message = await runRules(list, currentValue(), options.formModel ?? {});
    if (ticket !== seq) return undefined;
    store.set({ state: message === undefined ? "success" : "error", message: message ?? "" });
    const result = message === undefined ? undefined : { prop, message };
    options.onValidate(prop, result);
    return result;
  }

  function clearValidate(): void {
    // 票号往前推一格：在飞的 async 校验回来时会发现自己过期，不会把状态又写回去
    seq++;
    store.set({ state: "", message: "" });
  }

  function resetField(): void {
    const { prop, formModel } = options;
    if (prop && formModel) setByPath(formModel, prop, cloneValue(initialValue));
    clearValidate();
  }

  const field: FormFieldHandle = {
    prop: initial.prop,
    validate: () => validate(),
    resetField,
    clearValidate,
  };

  return {
    field,
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,

    update(next) {
      options = next;
      // 句柄是同一个对象，prop 原地改（见 FormFieldHandle 的注释）
      field.prop = next.prop;
    },

    connect() {
      if (captured) return;
      captured = true;
      initialValue = cloneValue(currentValue());
    },
    disconnect() {
      // 初值不清：同一个表单项被 StrictMode 反复接上断开时，重置目标要始终是"第一次见到的值"
      seq++;
    },

    validate,
    resetField,
    clearValidate,
  };
}
