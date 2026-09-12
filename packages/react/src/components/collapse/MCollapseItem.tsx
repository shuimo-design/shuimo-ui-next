import { useId, useState, type CSSProperties, type ReactNode } from "react";
import {
  collapseItemActive,
  collapseItemClasses,
  collapseItemDisabled,
  collapseItemDivider,
  collapseItemIds,
  collapseItemName,
  collapseLineOptions,
  type CollapseItemProps as CoreCollapseItemProps,
} from "@shuimo-design/core";
import { IconBrushChevronDown } from "../../icons";
import { useBrushLine } from "../divider";
import { useCollapse } from "./context";

// title 在 core 里是 string，这里放宽成任意节点（对应 Vue 的 title prop + title 插槽），
// 所以先 Omit 掉再重新声明 —— 直接覆盖会被 TS 判成"接口扩展不兼容"
export interface MCollapseItemProps extends Omit<CoreCollapseItemProps, "title"> {
  /** 标题；可以是任意节点 */
  title?: ReactNode;
  /** 受控的展开态（单独使用时才有意义）；不传就由组件自己记（配合 defaultValue） */
  value?: boolean;
  defaultValue?: boolean;
  onValueChange?: (expanded: boolean) => void;
  /** 单独使用（不在 MCollapse 里）时展开 / 收起的变化 */
  onChange?: (expanded: boolean) => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MCollapseItem(props: MCollapseItemProps) {
  // divider 不给默认值：要区分"没传"（跟随 MCollapse）和"传了 false"（自己不画）
  const { name, title, disabled: ownDisabled = false, divider: ownDivider, children } = props;

  const collapse = useCollapse();
  // 受控 / 非受控两种都支持：传了 value 就听外面的，没传就自己记一份
  const isControlled = props.value !== undefined;
  const [uncontrolled, setUncontrolled] = useState(props.defaultValue ?? false);
  const own = isControlled ? props.value! : uncontrolled;

  const uid = useId();
  const { headerId, contentId } = collapseItemIds(uid);
  /** 没给 name 时用生成的 id 顶上，放进组里也能被区分 */
  const key = collapseItemName(name, uid);

  // 展开态 / 画不画线 / 禁不禁用三件事的判断全在 core，和 Vue 那边是同一份
  const active = collapseItemActive({ collapse, name: key, own });
  const divider = collapseItemDivider({ collapse, own: ownDivider });
  const disabled = collapseItemDisabled({ collapse, own: ownDisabled });

  // 标题右侧那一笔按剩余宽度单独生成：标题长短不同，线的长度就不同，拿通用长线硬压会糊
  const lineRef = useBrushLine(collapseLineOptions());

  function onClick() {
    if (disabled) return;
    if (collapse) {
      collapse.toggle(key);
      return;
    }
    const next = !own;
    if (!isControlled) setUncontrolled(next);
    props.onValueChange?.(next);
    props.onChange?.(next);
  }

  return (
    <div
      className={[...collapseItemClasses({ active, disabled, divider }), props.className]
        .filter(Boolean)
        .join(" ")}
      style={props.style}
    >
      <button
        id={headerId}
        type="button"
        className="m-collapse-item__header"
        aria-expanded={active}
        aria-controls={contentId}
        disabled={disabled}
        onClick={onClick}
      >
        <span className="m-collapse-item__title">{title}</span>
        {/* 标题后一直画到右边缘的笔触线，再接一个一笔写出的箭头 */}
        {divider ? (
          <span ref={lineRef} className="m-collapse-item__line" aria-hidden="true" />
        ) : null}
        <span className="m-collapse-item__arrow" aria-hidden="true">
          <IconBrushChevronDown />
        </span>
      </button>
      <div
        id={contentId}
        className="m-collapse-item__wrap"
        role="region"
        aria-labelledby={headerId}
      >
        {/* 收起时 inert：还在 DOM 里参与高度动画，但不可聚焦、不进无障碍树 */}
        <div className="m-collapse-item__content" inert={!active}>
          <div className="m-collapse-item__body">{children}</div>
        </div>
      </div>
    </div>
  );
}
