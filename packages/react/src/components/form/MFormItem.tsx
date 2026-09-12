import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  createFormItem,
  formItemClasses,
  formItemInk,
  formItemLabelStyle,
  formItemRules,
  formItemShowError,
  formItemState,
  type FormItemExpose,
  type FormItemProps as CoreFormItemProps,
} from "@shuimo-design/core";
import { useController, useMounted } from "../../runtime";
import { FormItemContext } from "../../internal/form-item";
import { MTransition } from "../../transition";
import { useForm } from "./context";

export interface MFormItemProps extends Omit<CoreFormItemProps, "label"> {
  /** 标签内容；对应 Vue 的 label prop 与 label 插槽两者 */
  label?: ReactNode;
  /** 自定义错误信息内容，对应 Vue 的 error 插槽 */
  renderError?: (message: string) => ReactNode;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const MFormItem = forwardRef<FormItemExpose, MFormItemProps>(function MFormItem(props, ref) {
  const {
    label,
    prop,
    rules: ownRules,
    required = false,
    labelWidth,
    // 不给默认值：要区分「没传」（跟随表单）和「传了 false」
    showMessage,
    error,
    for: forProp,
    renderError,
    children,
    className,
    style,
  } = props;

  const form = useForm();
  const generatedId = useId();
  const controlId = forProp ?? generatedId;
  const errorId = `${controlId}-error`;

  // 校验状态机（含 async 校验的竞态票据、resetField 的初值）整份在 core，和 Vue 那边是同一份
  const [controller, snapshot] = useController(createFormItem, {
    prop,
    ownRules,
    required,
    error,
    formModel: form.model,
    formRules: form.rules,
    onValidate: form.onFieldValidate,
  });

  // 登记的是控制器持有的那个句柄对象，引用恒定；prop 变了由控制器原地改它的字段。
  // 依赖里只有两个恒定引用，所以这个 effect 一辈子只跑一次 —— 登记顺序不会被打乱
  useEffect(() => form.addField(controller.field), [form.addField, controller]);

  // 外部 error 走渲染期派生，两边都不用 watch / effect（为什么见 core 的 formItemState 注释）
  const display = formItemState(snapshot, error);

  const rules = useMemo(
    () => formItemRules({ prop, ownRules, required, formRules: form.rules }),
    [prop, ownRules, required, form.rules],
  );
  const showAsterisk = rules.some((rule) => rule.required) && !form.hideRequiredAsterisk;
  const showError = formItemShowError({
    state: display.state,
    message: display.message,
    showMessage: showMessage ?? form.showMessage,
  });

  const labelStyle = formItemLabelStyle({
    labelPosition: form.labelPosition,
    labelWidth: labelWidth ?? form.labelWidth,
  });

  // 那一笔朱砂走素材登记：首帧一律内联（服务端登记不了），挂载后才升级成 data 属性，否则水合报不匹配
  const ink = formItemInk(useMounted());

  const context = useMemo(
    () => ({
      id: controlId,
      disabled: form.disabled,
      validate(trigger: "change" | "blur") {
        void controller.validate(trigger);
      },
    }),
    [controlId, form.disabled, controller],
  );

  useImperativeHandle(
    ref,
    () => ({
      validate: () => controller.validate(),
      resetField: controller.resetField,
      clearValidate: controller.clearValidate,
    }),
    [controller],
  );

  const classes = formItemClasses({
    labelPosition: form.labelPosition,
    asterisk: showAsterisk,
    state: display.state,
    hasLabel: label !== undefined && label !== null,
  });

  return (
    <div
      className={[...classes, className].filter(Boolean).join(" ")}
      style={{ ...ink.style, ...style } as CSSProperties}
      {...ink.attrs}
    >
      {label === undefined || label === null ? null : (
        <label className="m-form-item__label" htmlFor={controlId} style={labelStyle}>
          {showAsterisk ? (
            <span className="m-form-item__asterisk" aria-hidden="true">
              *
            </span>
          ) : null}
          {label}
        </label>
      )}
      <div className="m-form-item__content">
        <FormItemContext.Provider value={context}>{children}</FormItemContext.Provider>
        <MTransition name="m-form-item-error" in={showError}>
          <div className="m-form-item__error" role="alert" id={errorId}>
            <span className="m-form-item__line" aria-hidden="true" />
            <span className="m-form-item__message">
              {renderError ? renderError(display.message) : display.message}
            </span>
          </div>
        </MTransition>
      </div>
    </div>
  );
});
