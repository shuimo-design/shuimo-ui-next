import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  createPopoverFocus,
  createPopoverTrigger,
  dropdownClasses,
  dropdownFirstItem,
  dropdownItemClasses,
  dropdownMenuKeyAction,
  dropdownReferenceAria,
  dropdownTriggerKeyAction,
  moveDropdownFocus,
  DROPDOWN_BORDER_STROKE,
  DROPDOWN_REFERENCE_ARIA,
  type DropdownItem,
  type DropdownItemScope,
  type DropdownKey,
  type DropdownProps as CoreDropdownProps,
} from "@shuimo-design/core";
import { MPopper } from "../../internal/MPopper";
import { MBorder } from "../border";
import { useController } from "../../runtime";

export interface MDropdownProps extends CoreDropdownProps {
  /** 受控展开；不传就由组件自己记（配合 defaultOpen） */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 选中一项（禁用项不触发）；选中后菜单自动收起 */
  onSelect?: (key: DropdownKey, item: DropdownItem) => void;
  /** 触发内容；第一个元素当参照元素 */
  children?: ReactNode;
  /** 自定义每一项的内容 */
  renderItem?: (scope: DropdownItemScope) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MDropdown(props: MDropdownProps) {
  const {
    items,
    trigger = "click",
    placement = "bottom-start",
    disabled = false,
    offset = 6,
    teleport = true,
    seed = 1,
    children,
    renderItem,
  } = props;

  const controlled = props.open !== undefined;
  const [uncontrolled, setUncontrolled] = useState(props.defaultOpen ?? false);
  const open = controlled ? props.open! : uncontrolled;

  const menuId = useId();
  const menu = useRef<HTMLElement | null>(null);

  const onChange = useCallback(
    (next: boolean) => {
      if (!controlled) setUncontrolled(next);
      props.onOpenChange?.(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controlled],
  );

  // 开合时序（hover / click、Escape、点外面）全在 core 的控制器里，和气泡是同一份
  const [popover, state] = useController(createPopoverTrigger, {
    trigger,
    disabled,
    openDelay: 0,
    closeDelay: 100,
    disableClickAway: false,
    show: open,
    onChange,
  });
  // 焦点搬运：ArrowDown 打开时送到第一项，选中 / Escape 时还给触发元素
  const focus = useRef<ReturnType<typeof createPopoverFocus> | null>(null);
  focus.current ??= createPopoverFocus({ target: dropdownFirstItem });

  const wrapperRef = useCallback((el: HTMLElement | null) => popover.setWrapper(el), [popover]);
  const floatRef = useCallback((el: HTMLElement | null) => popover.setPanel(el), [popover]);
  const menuRef = useCallback((el: HTMLElement | null) => {
    menu.current = el;
    focus.current?.setPanel(el);
  }, []);
  // 壳里的内容换了要重新挑参照元素，所以每次渲染后都对一遍（等价于 Vue 的 onUpdated）
  useEffect(() => popover.refresh());
  useEffect(() => focus.current?.setReference(state.reference), [state.reference]);

  const expanded = open && !disabled;

  // 参照元素标成「带菜单的按钮」，读屏能知道按下去会出一个菜单
  const prevReference = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = state.reference;
    const prev = prevReference.current;
    if (prev && prev !== el) {
      for (const name of DROPDOWN_REFERENCE_ARIA) prev.removeAttribute(name);
    }
    prevReference.current = el;
    if (!el) return;
    const aria = dropdownReferenceAria({ open: expanded, menuId });
    for (const name of DROPDOWN_REFERENCE_ARIA) {
      const value = aria[name];
      if (value === undefined) el.removeAttribute(name);
      else el.setAttribute(name, value);
    }
  }, [state.reference, expanded, menuId]);

  function select(item: DropdownItem) {
    if (item.disabled || disabled) return;
    props.onSelect?.(item.key, item);
    focus.current?.restoreFocus();
    popover.setOpen(false);
  }

  function onTriggerKeydown(event: KeyboardEvent<HTMLElement>) {
    if (disabled) return;
    const action = dropdownTriggerKeyAction(event.key);
    if (!action.prevent) return;
    event.preventDefault();
    // 没开就先开，菜单挂上后焦点会落到第一项；已经开着就直接挪
    popover.setOpen(true);
    focus.current?.requestFocus();
  }

  function onItemKeydown(event: KeyboardEvent<HTMLElement>, item: DropdownItem) {
    const action = dropdownMenuKeyAction(event.key);
    if (action.prevent) event.preventDefault();
    if (action.kind === "focus" && action.target) {
      moveDropdownFocus(menu.current, event.currentTarget, action.target);
    } else if (action.kind === "select") {
      select(item);
    } else if (action.kind === "close") {
      focus.current?.restoreFocus();
    }
  }

  return (
    <>
      <span
        ref={wrapperRef}
        className={[
          ...dropdownClasses({ wrapOnly: state.wrapOnly, open: expanded, disabled }),
          props.className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={props.style}
        onMouseEnter={popover.onTriggerEnter}
        onMouseLeave={popover.onTriggerLeave}
        onClick={popover.onTriggerClick}
        onFocus={(e) => popover.onTriggerFocusin(e.nativeEvent)}
        onBlur={(e) => popover.onTriggerFocusout(e.nativeEvent)}
        onKeyDown={onTriggerKeydown}
      >
        {children}
      </span>
      <MPopper
        open={expanded}
        reference={state.reference}
        placement={placement}
        offset={offset}
        teleport={teleport}
        onClickOutside={popover.onClickOutside}
      >
        <div
          ref={floatRef}
          className="m-dropdown__float"
          onMouseEnter={popover.onPanelEnter}
          onMouseLeave={popover.onPanelLeave}
        >
          <MBorder className="m-dropdown__panel" seed={seed} strokeWidth={DROPDOWN_BORDER_STROKE}>
            <ul id={menuId} ref={menuRef} className="m-dropdown__menu" role="menu">
              {items.map((item) => (
                <ItemRow
                  key={item.key}
                  item={item}
                  renderItem={renderItem}
                  onSelect={select}
                  onKeyDown={onItemKeydown}
                />
              ))}
            </ul>
          </MBorder>
        </div>
      </MPopper>
    </>
  );
}

/** 一项加上它上方的分隔线；拆出来是为了在 map 里给两个兄弟节点各自一个 key */
function ItemRow(props: {
  item: DropdownItem;
  renderItem?: (scope: DropdownItemScope) => ReactNode;
  onSelect: (item: DropdownItem) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>, item: DropdownItem) => void;
}) {
  const { item, renderItem } = props;
  return (
    <>
      {item.divided ? <li className="m-dropdown__divider" role="separator" /> : null}
      <li
        className={dropdownItemClasses(item).join(" ")}
        role="menuitem"
        tabIndex={-1}
        aria-disabled={item.disabled || undefined}
        onClick={() => props.onSelect(item)}
        onKeyDown={(event) => props.onKeyDown(event, item)}
      >
        {renderItem ? renderItem({ item }) : item.label}
      </li>
    </>
  );
}
