import { useState, type CSSProperties, type ReactNode } from "react";
import {
  switchChecked,
  switchClasses,
  switchInert,
  switchInk,
  switchNextValue,
  type SwitchProps as CoreSwitchProps,
  type SwitchValue,
} from "@shuimo-design/core";
import { useDisabled, useFormItem } from "../../internal/form-item";

export interface MSwitchProps extends CoreSwitchProps {
  /** 受控值；不传就由组件自己记（配合 defaultValue） */
  value?: SwitchValue;
  defaultValue?: SwitchValue;
  /** 值变了（`controlled` 为真时不发，由外部自己决定改不改） */
  onValueChange?: (value: SwitchValue) => void;
  /** 用户切换后，参数是（将要变成的）新值 */
  onChange?: (value: SwitchValue) => void;
  /** 替代 activeText */
  active?: ReactNode;
  /** 替代 inactiveText */
  inactive?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MSwitch(props: MSwitchProps) {
  const {
    disabled: disabledProp = false,
    loading = false,
    activeValue = true,
    inactiveValue = false,
    activeText,
    inactiveText,
    controlled = false,
    name,
    active,
    inactive,
  } = props;

  // 上下文形状在 core（context/form-item.ts），这两行只是 React 的 useContext 胶水
  const formItem = useFormItem();
  const disabled = useDisabled(disabledProp);

  // 受控 / 非受控两种都支持：传了 value 就听外面的，没传就自己记一份
  const isControlled = props.value !== undefined;
  const [uncontrolled, setUncontrolled] = useState<SwitchValue>(
    props.defaultValue ?? inactiveValue,
  );
  const model = isControlled ? props.value! : uncontrolled;

  const checked = switchChecked(model, activeValue);
  const inert = switchInert({ disabled, loading });
  // 轨道那"一抹"和滑钮外的手画方框都在 core 里生成，两个壳共用同一份遮罩
  const inkStyle = switchInk();

  function toggle() {
    if (inert) return;
    const next = switchNextValue(checked, activeValue, inactiveValue);
    // controlled 模式只把"将要变成的值"报出去，值改不改由外部决定（和 Vue 版同名 prop 一致）
    if (!controlled) {
      if (!isControlled) setUncontrolled(next);
      props.onValueChange?.(next);
    }
    props.onChange?.(next);
    formItem.validate("change");
  }

  return (
    <button
      id={formItem.id}
      type="button"
      className={[...switchClasses({ checked, disabled, loading }), props.className]
        .filter(Boolean)
        .join(" ")}
      style={{ ...inkStyle, ...props.style } as CSSProperties}
      role="switch"
      aria-checked={checked}
      aria-busy={loading || undefined}
      disabled={disabled}
      name={name}
      onClick={toggle}
    >
      {active || activeText ? (
        <span className="m-switch__text m-switch__text--active">{active ?? activeText}</span>
      ) : null}
      <span className="m-switch__track" aria-hidden="true">
        {/* 外层只管左右滑，里层只管转 45° 和 loading 时的慢转，两个 transform 不打架 */}
        <span className="m-switch__thumb">
          <span className="m-switch__core" />
        </span>
      </span>
      {inactive || inactiveText ? (
        <span className="m-switch__text m-switch__text--inactive">{inactive ?? inactiveText}</span>
      ) : null}
    </button>
  );
}
