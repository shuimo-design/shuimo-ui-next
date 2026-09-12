import { useState, type CSSProperties, type ChangeEvent, type ReactNode } from "react";
import {
  radioChecked,
  radioClasses,
  radioDisabled,
  radioHasLabel,
  radioInk,
  radioNativeName,
  type RadioProps as CoreRadioProps,
} from "@shuimo-design/core";
import { useRadioGroup } from "./context";

export interface MRadioProps extends CoreRadioProps {
  /**
   * 受控选中态；不传就由组件自己记（配合 defaultChecked）。
   * 为什么不叫 `value`：`value` 已经被"这一项代表的值"占了（Vue 那边 v-model 是另一个通道），
   * 所以这一对沿用 React 原生 input 的 checked / defaultChecked。
   */
  checked?: boolean;
  defaultChecked?: boolean;
  /** 选中态变了（在组里时由组统一发，这里不发） */
  onCheckedChange?: (checked: boolean) => void;
  /** 用户操作选中了这一项 */
  onChange?: (value: CoreRadioProps["value"], event: ChangeEvent<HTMLInputElement>) => void;
  /** 文字，优先于 label */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MRadio(props: MRadioProps) {
  const { value, label, disabled: ownDisabled = false, name, children } = props;

  const group = useRadioGroup();
  // 受控 / 非受控两种都支持：传了 checked 就听外面的，没传就自己记一份
  const isControlled = props.checked !== undefined;
  const [uncontrolled, setUncontrolled] = useState(props.defaultChecked ?? false);
  const own = isControlled ? props.checked! : uncontrolled;

  // 在组里就比组的值；单独用时自己只记"选没选中"这一个布尔，
  // 转成 core 要的"当前选中的值"（没选就是 undefined）再比，两个壳走同一条判断
  const checked = radioChecked({ group, own: own ? value : undefined, value });
  const disabled = radioDisabled({ group, own: ownDisabled });
  const nativeName = radioNativeName({ group, name });

  // 外圈墨圈和中心墨点两张遮罩都在 core 里生成，和 Vue 那边是同一份
  const inkStyle = radioInk();

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    if (disabled || !event.target.checked) return;
    if (group) {
      group.select(value);
    } else {
      if (!isControlled) setUncontrolled(true);
      props.onCheckedChange?.(true);
    }
    props.onChange?.(value, event);
  }

  return (
    <label
      className={[...radioClasses({ checked, disabled }), props.className]
        .filter(Boolean)
        .join(" ")}
      style={{ ...inkStyle, ...props.style } as CSSProperties}
    >
      <input
        className="m-radio__input"
        type="radio"
        name={nativeName}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span className="m-radio__dot" aria-hidden="true" />
      {radioHasLabel(label, children !== undefined) ? (
        <span className="m-radio__label">{children ?? label}</span>
      ) : null}
    </label>
  );
}
