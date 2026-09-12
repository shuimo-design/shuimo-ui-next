import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  createFormFields,
  formClasses,
  type FormExpose,
  type FormFieldError,
  type FormProps as CoreFormProps,
} from "@shuimo-design/core";
import { FormContext } from "./context";

export interface MFormProps extends CoreFormProps {
  /** 表单提交（回车 / 提交按钮）；submit 为 false 时已阻止默认跳转 */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  /** 任一表单项校验完成 */
  onValidate?: (prop: string, valid: boolean, message: string | undefined) => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const MForm = forwardRef<FormExpose, MFormProps>(function MForm(props, ref) {
  const {
    model,
    rules,
    inline = false,
    labelWidth = 120,
    labelPosition = "left",
    disabled = false,
    submit = false,
    showMessage = true,
    hideRequiredAsterisk = false,
    children,
    className,
    style,
  } = props;

  // 表单项集合（登记、按 prop 挑、整表校验 / 重置 / 清状态）整套都在 core，两个壳共用
  const store = useRef<ReturnType<typeof createFormFields> | null>(null);
  store.current ??= createFormFields();
  const fields = store.current;

  /**
   * 登记入口和回报入口都必须**引用恒定**：表单项是在 effect 里登记的，
   * 这两个函数一变身份，那个 effect 就会重跑一遍——先注销再登记，
   * 登记顺序会被打乱（校验结果要按登记顺序返回）。
   * onValidate 每次渲染都是新函数，所以收进 ref 里，回调本身不跟着变。
   */
  // fields 是同一个对象，它的方法引用天然恒定
  const addField = fields.add;
  const latest = useRef(props.onValidate);
  latest.current = props.onValidate;
  const onFieldValidate = useCallback((prop: string, error: FormFieldError | undefined) => {
    latest.current?.(prop, error === undefined, error?.message);
  }, []);

  const context = useMemo(
    () => ({
      model,
      rules,
      disabled,
      inline,
      labelWidth,
      labelPosition,
      showMessage,
      hideRequiredAsterisk,
      addField,
      onFieldValidate,
    }),
    [
      model,
      rules,
      disabled,
      inline,
      labelWidth,
      labelPosition,
      showMessage,
      hideRequiredAsterisk,
      addField,
      onFieldValidate,
    ],
  );

  useImperativeHandle(
    ref,
    () => ({
      validate: fields.validate,
      resetFields: fields.resetFields,
      clearValidate: fields.clearValidate,
    }),
    [fields],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // submit 为 false 时不让浏览器真的提交；页面用 validate() 自己决定何时发请求
    if (!submit) event.preventDefault();
    props.onSubmit?.(event);
  }

  return (
    <form
      className={[...formClasses({ labelPosition, inline, disabled }), className]
        .filter(Boolean)
        .join(" ")}
      style={style}
      noValidate
      onSubmit={handleSubmit}
    >
      <FormContext.Provider value={context}>{children}</FormContext.Provider>
    </form>
  );
});
