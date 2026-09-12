/** 表单数据对象：key 是 MFormItem 的 prop，支持 "a.b" 这种点路径 */
export type FormModel = Record<string, unknown>;

/** 校验时机：控件值变化 / 控件失焦；不写则两种时机都跑 */
export type FormTrigger = "change" | "blur";

/** 内置类型检查；required 之外只在值非空时才检查 */
export type FormRuleType = "string" | "number" | "boolean" | "array" | "email" | "url";

/**
 * 自定义校验函数：返回 true / undefined 算通过，返回 false 用 rule.message，
 * 返回字符串则把它当错误信息；可以是 async。
 */
export type FormValidator = (
  rule: FormRule,
  value: unknown,
  model: FormModel,
) => boolean | string | undefined | Promise<boolean | string | undefined>;

export interface FormRule {
  /** 必填：空字符串 / null / undefined / 空数组都算没填 */
  required?: boolean;
  /** 不通过时显示的文字；没写就用内置的中文默认文案 */
  message?: string;
  /** 值类型；数字比较大小，其余比较长度 */
  type?: FormRuleType;
  /** 最小值（number）或最短长度（string / array） */
  min?: number;
  /** 最大值（number）或最长长度（string / array） */
  max?: number;
  /** 固定长度（string / array）或固定值（number） */
  len?: number;
  /** 正则，只对字符串化后的值测试 */
  pattern?: RegExp;
  /** 自定义校验函数 */
  validator?: FormValidator;
  /** 触发时机，不写则 change 和 blur 都触发 */
  trigger?: FormTrigger | FormTrigger[];
}

/** 一个 prop 对应一条或多条规则 */
export type FormRules = Record<string, FormRule | FormRule[]>;

export type FormLabelPosition = "left" | "right" | "top";

export interface FormFieldError {
  prop: string;
  message: string;
}

export interface FormValidateResult {
  valid: boolean;
  /** 没通过的字段，按表单项出现顺序 */
  errors: FormFieldError[];
}

export interface FormProps {
  /** 表单数据对象，MFormItem 按 prop 从这里取值校验 */
  model?: FormModel;
  /** 按 prop 组织的校验规则；表单项自己的 rules 优先 */
  rules?: FormRules;
  /** 行内排布：表单项横向排开 */
  inline?: boolean;
  /** 标签宽度，数字按 px；默认 120px。labelPosition 为 top 时无效 */
  labelWidth?: string | number;
  /** 标签位置：左对齐（默认）/ 右对齐 / 在控件上方 */
  labelPosition?: FormLabelPosition;
  /** 整表单禁用，所有表单项里的控件跟着禁用 */
  disabled?: boolean;
  /** 允许原生 submit 真的提交跳转；默认 false，只发 submit 事件 */
  submit?: boolean;
  /** 是否显示错误文字，默认 true */
  showMessage?: boolean;
  /** 不显示必填星号 */
  hideRequiredAsterisk?: boolean;
}

export interface FormEmits {
  /** 表单提交（回车 / 提交按钮）；submit 为 false 时已阻止默认跳转 */
  submit: [event: SubmitEvent];
  /** 任一表单项校验完成 */
  validate: [prop: string, valid: boolean, message: string | undefined];
}

export interface FormSlots {
  default?: () => unknown;
}

export interface FormExpose {
  /** 校验全部（或指定 prop 的）表单项；不 reject，结果看返回值 */
  validate: (props?: string | string[]) => Promise<FormValidateResult>;
  /** 把指定（或全部）表单项的值恢复到挂载时的初值并清掉校验状态 */
  resetFields: (props?: string | string[]) => void;
  /** 只清掉校验状态，不动值 */
  clearValidate: (props?: string | string[]) => void;
}

export interface FormItemProps {
  /** 标签文字；label 插槽优先 */
  label?: string;
  /** 对应 model 里的字段名，校验、重置都靠它 */
  prop?: string;
  /** 只作用于本项的规则，优先于表单的 rules */
  rules?: FormRule | FormRule[];
  /** 必填快捷写法：等价于加一条 { required: true } 规则 */
  required?: boolean;
  /** 覆盖表单的标签宽度 */
  labelWidth?: string | number;
  /** 覆盖表单的 showMessage */
  showMessage?: boolean;
  /** 外部塞进来的错误信息（比如接口返回的），非空即显示为错误态 */
  error?: string;
  /** 指定 label 的 for / 控件的 id；不传自动生成 */
  for?: string;
}

export interface FormItemSlots {
  default?: () => unknown;
  /** 自定义标签内容 */
  label?: (scope: { label: string | undefined }) => unknown;
  /** 自定义错误信息内容 */
  error?: (scope: { message: string }) => unknown;
}

export type FormItemValidateState = "" | "validating" | "success" | "error";

export interface FormItemExpose {
  /** 跑一次本项的全部规则（不看 trigger） */
  validate: () => Promise<FormFieldError | undefined>;
  resetField: () => void;
  clearValidate: () => void;
  validateState: Readonly<{ value: FormItemValidateState }>;
  validateMessage: Readonly<{ value: string }>;
}
