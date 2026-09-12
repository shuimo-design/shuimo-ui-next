/**
 * MForm 向下提供的上下文，以及"表单项集合"这件纯逻辑。
 *
 * 为什么要重写：原来这份放在 `packages/vue/src/components/form/context.ts`，
 * 每个字段都是 `Ref<T>` —— 那是 Vue 响应式的产物，父组件改一个值、子组件读 `.value` 就重渲染。
 * React 里没有这回事：搬过去之后 getter 不触发重渲染，禁用态、labelWidth 这些会静默失效。
 * 所以这里字段一律是**纯值**，由两个容器各自负责把新值推下去
 * （Vue provide 一个 computed，React useMemo + Provider）。
 */
import type {
  FormFieldError,
  FormLabelPosition,
  FormModel,
  FormRules,
  FormTrigger,
  FormValidateResult,
} from "../components/form/types";

/**
 * MFormItem 向 MForm 登记的句柄：表单整体校验 / 重置时逐个调用。
 *
 * `prop` 是**纯值**，而表单项的 prop 是会变的（比如 v-for 里换了字段）。
 * 所以这个句柄对象由表单项一直持有、prop 变了就**原地改字段**（`handle.prop = next`），
 * 登记进来的始终是同一个对象引用 —— 这样表单不用重新登记，登记顺序也就不会被打乱。
 */
export interface FormFieldHandle {
  prop: string | undefined;
  validate(trigger?: FormTrigger): Promise<FormFieldError | undefined>;
  resetField(): void;
  clearValidate(): void;
}

export interface FormContextValue {
  model: FormModel | undefined;
  rules: FormRules | undefined;
  disabled: boolean;
  inline: boolean;
  labelWidth: string | number;
  labelPosition: FormLabelPosition;
  showMessage: boolean;
  hideRequiredAsterisk: boolean;
  /** 登记一个表单项，返回注销函数 */
  addField(field: FormFieldHandle): () => void;
  onFieldValidate(prop: string, error: FormFieldError | undefined): void;
}

/** 没有外层 MForm 时表单项用这一份；引用恒定，服务端和客户端拿到同一个对象 */
export const FORM_CONTEXT_DEFAULT: FormContextValue = {
  model: undefined,
  rules: undefined,
  disabled: false,
  inline: false,
  labelWidth: 120,
  labelPosition: "left",
  showMessage: true,
  hideRequiredAsterisk: false,
  addField: () => () => {},
  onFieldValidate: () => {},
};

export interface FormFields {
  /** 登记，返回注销函数 */
  add(field: FormFieldHandle): () => void;
  /** 不传 props 就是"所有有 prop 的表单项"，传了就按 prop 过滤 */
  pick(props?: string | string[]): FormFieldHandle[];
  validate(props?: string | string[]): Promise<FormValidateResult>;
  resetFields(props?: string | string[]): void;
  clearValidate(props?: string | string[]): void;
}

/**
 * 表单持有的表单项集合。纯逻辑，两个框架共用。
 *
 * **用数组不用 Set，因为校验结果要按登记顺序返回。** 登记顺序是这样来的：
 * Vue 的 `onMounted` 对静态兄弟节点就是文档顺序；React 的 effect 对静态兄弟节点
 * 同样按树顺序跑。但 Suspense / 并发切片下 React 不保证这一点 ——
 * 这是已知取舍：表单项通常是静态的，不值得为了这点把表单改成"传数据进来"的 API。
 * 真要保证顺序，就自己按 prop 的顺序读 `errors`。
 */
export function createFormFields(): FormFields {
  const fields: FormFieldHandle[] = [];

  function pick(props?: string | string[]): FormFieldHandle[] {
    if (props === undefined) return fields.filter((field) => field.prop !== undefined);
    const wanted = new Set(Array.isArray(props) ? props : [props]);
    return fields.filter((field) => field.prop !== undefined && wanted.has(field.prop));
  }

  return {
    add(field) {
      fields.push(field);
      // 注销函数而不是 removeField(field)：两个壳的清理时机都是"拿着闭包调一下"，
      // 少一次按引用查找，也就不会出现"登记了两次、注销了一次"的半残状态
      return () => {
        const index = fields.indexOf(field);
        if (index >= 0) fields.splice(index, 1);
      };
    },
    pick,
    async validate(props) {
      const results = await Promise.all(pick(props).map((field) => field.validate()));
      const errors = results.filter((error): error is FormFieldError => error !== undefined);
      return { valid: errors.length === 0, errors };
    },
    resetFields(props) {
      for (const field of pick(props)) field.resetField();
    },
    clearValidate(props) {
      for (const field of pick(props)) field.clearValidate();
    },
  };
}
