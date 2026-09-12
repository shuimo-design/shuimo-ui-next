import { useState, type CSSProperties, type ChangeEvent, type ReactNode } from "react";
import {
  checkboxAriaChecked,
  checkboxBrush,
  checkboxChecked,
  checkboxClasses,
  checkboxDisabled,
  checkboxHasLabel,
  checkboxInk,
  type CheckboxProps as CoreCheckboxProps,
} from "@shuimo-design/core";
import { useBrushBorder } from "../../ink";
import { useCheckboxGroup } from "./context";

export interface MCheckboxProps extends CoreCheckboxProps {
  /**
   * 受控勾选态；不传就由组件自己记（配合 defaultChecked）。
   * 为什么不叫 `value`：`value` 已经被"放进组里时代表的值"占了（Vue 那边 v-model 是另一个通道），
   * 所以这一对沿用 React 原生 input 的 checked / defaultChecked。
   */
  checked?: boolean;
  defaultChecked?: boolean;
  /** 勾选态变了（在组里时由组统一发，这里不发） */
  onCheckedChange?: (checked: boolean) => void;
  /** 用户操作导致勾选态变化 */
  onChange?: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
  /** 文字，优先于 label */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MCheckbox(props: MCheckboxProps) {
  const {
    value,
    label,
    disabled: ownDisabled = false,
    indeterminate = false,
    name,
    children,
  } = props;

  const group = useCheckboxGroup();
  // 受控 / 非受控两种都支持：传了 checked 就听外面的，没传就自己记一份
  const isControlled = props.checked !== undefined;
  const [uncontrolled, setUncontrolled] = useState(props.defaultChecked ?? false);
  const own = isControlled ? props.checked! : uncontrolled;

  // 在组里就听组的，单独用就听自己的；min/max 把这一项锁住时也算禁用。判断全在 core
  const checked = checkboxChecked({ group, value, own });
  const disabled = checkboxDisabled({ group, value, own: ownDisabled, checked });

  // 方框的笔触参数、勾选墨块与半选一横的遮罩都在 core 里，和 Vue 那边是同一份
  const boxRef = useBrushBorder(checkboxBrush());
  const inkStyle = checkboxInk();

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    if (disabled) return;
    const next = event.target.checked;
    if (group && value !== undefined) {
      group.toggle(value, next);
    } else {
      if (!isControlled) setUncontrolled(next);
      props.onCheckedChange?.(next);
    }
    props.onChange?.(next, event);
  }

  return (
    <label
      className={[...checkboxClasses({ checked, indeterminate, disabled }), props.className]
        .filter(Boolean)
        .join(" ")}
      style={{ ...inkStyle, ...props.style } as CSSProperties}
    >
      <input
        className="m-checkbox__input"
        type="checkbox"
        name={name}
        checked={checked}
        disabled={disabled}
        aria-checked={checkboxAriaChecked(checked, indeterminate)}
        onChange={onChange}
      />
      <span ref={boxRef} className="m-checkbox__box" aria-hidden="true">
        {/* 勾选是框里一块实墨，半选是一横；默认皮肤靠 CSS，m.ink 层换成毛边墨块 / 短笔触遮罩 */}
        <span className="m-checkbox__mark" />
      </span>
      {checkboxHasLabel(label, children !== undefined) ? (
        <span className="m-checkbox__label">{children ?? label}</span>
      ) : null}
    </label>
  );
}
