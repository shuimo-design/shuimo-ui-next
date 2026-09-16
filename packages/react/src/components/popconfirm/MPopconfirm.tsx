import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  createPopoverFocus,
  createPopoverTrigger,
  popconfirmClasses,
  popconfirmFocusTarget,
  popconfirmReferenceAria,
  popconfirmStyle,
  POPCONFIRM_BORDER_STROKE,
  POPCONFIRM_CANCEL_TEXT,
  POPCONFIRM_OK_TEXT,
  POPCONFIRM_REFERENCE_ARIA,
  type PopconfirmProps as CorePopconfirmProps,
} from "@shuimo-design/core";
import { MPopper } from "../../internal/MPopper";
import { MBorder } from "../border";
import { MButton } from "../button";
import { useController } from "../../runtime";

export interface MPopconfirmProps extends CorePopconfirmProps {
  /** 受控显隐；不传就由组件自己记（配合 defaultOpen） */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 点了确定 */
  onConfirm?: () => void;
  /** 点了取消、点到气泡外面或按了 Esc */
  onCancel?: () => void;
  /** 触发内容；第一个元素当参照元素 */
  children?: ReactNode;
  /** 替代 title 属性的显示内容（title 属性仍要传，读屏念的是它） */
  renderTitle?: () => ReactNode;
  /** 替代 content 属性 */
  renderContent?: () => ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MPopconfirm(props: MPopconfirmProps) {
  const {
    title,
    content,
    confirmText = POPCONFIRM_OK_TEXT,
    cancelText = POPCONFIRM_CANCEL_TEXT,
    confirmType = "primary",
    placement = "top",
    disabled = false,
    icon = true,
    offset = 8,
    teleport = true,
    seed = 1,
    children,
    renderTitle,
    renderContent,
  } = props;

  const controlled = props.open !== undefined;
  const [uncontrolled, setUncontrolled] = useState(props.defaultOpen ?? false);
  const open = controlled ? props.open! : uncontrolled;

  const panelId = useId();
  const titleId = useId();
  const [arrowEl, setArrowEl] = useState<HTMLElement | null>(null);

  // 焦点搬运：打开时落在取消按钮上，关闭时还给触发元素
  const focus = useRef<ReturnType<typeof createPopoverFocus> | null>(null);
  focus.current ??= createPopoverFocus({ target: popconfirmFocusTarget });

  const latest = useRef(props);
  latest.current = props;
  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setUncontrolled(next);
      latest.current.onOpenChange?.(next);
    },
    [controlled],
  );

  // 开合时序（点击、Escape、点外面）全在 core 的控制器里，和气泡是同一份。
  // 控制器发起的每一次收起（点外面、Esc、再点触发元素）都不是确定，一律算取消 —— 和 MConfirm 点遮罩的口径一致
  const onChange = useCallback(
    (next: boolean) => {
      if (!next) {
        latest.current.onCancel?.();
        focus.current?.restoreFocus();
      }
      setOpen(next);
    },
    [setOpen],
  );
  const [popover, state] = useController(createPopoverTrigger, {
    trigger: "click",
    disabled,
    openDelay: 0,
    closeDelay: 0,
    disableClickAway: false,
    show: open,
    onChange,
  });

  const wrapperRef = useCallback((el: HTMLElement | null) => popover.setWrapper(el), [popover]);
  const floatRef = useCallback(
    (el: HTMLElement | null) => {
      popover.setPanel(el);
      focus.current?.setPanel(el);
    },
    [popover],
  );
  // 壳里的内容换了要重新挑参照元素，所以每次渲染后都对一遍（等价于 Vue 的 onUpdated）
  useEffect(() => popover.refresh());
  useEffect(() => focus.current?.setReference(state.reference), [state.reference]);

  const expanded = open && !disabled;
  // 每次打开都把焦点送进去
  useEffect(() => {
    if (expanded) focus.current?.requestFocus();
  }, [expanded]);

  // 参照元素标成「带对话框的按钮」，读屏能知道按下去会弹确认
  const prevReference = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = state.reference;
    const prev = prevReference.current;
    if (prev && prev !== el) {
      for (const name of POPCONFIRM_REFERENCE_ARIA) prev.removeAttribute(name);
    }
    prevReference.current = el;
    if (!el) return;
    const aria = popconfirmReferenceAria({ open: expanded, panelId });
    for (const name of POPCONFIRM_REFERENCE_ARIA) {
      const value = aria[name];
      if (value === undefined) el.removeAttribute(name);
      else el.setAttribute(name, value);
    }
  }, [state.reference, expanded, panelId]);

  /** 按钮触发的关闭：先报结果、还焦点，再直接改开关，不经过控制器（否则会再报一次 cancel） */
  function settle(result: boolean) {
    if (!open) return;
    if (result) props.onConfirm?.();
    else props.onCancel?.();
    focus.current?.restoreFocus();
    setOpen(false);
  }

  const hasContent = content !== undefined || renderContent !== undefined;

  return (
    <>
      <span
        ref={wrapperRef}
        className={[
          ...popconfirmClasses({ wrapOnly: state.wrapOnly, open: expanded, disabled }),
          props.className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={props.style}
        onClick={popover.onTriggerClick}
      >
        {children}
      </span>
      <MPopper
        open={expanded}
        reference={state.reference}
        placement={placement}
        offset={offset}
        teleport={teleport}
        arrow={arrowEl}
        onClickOutside={popover.onClickOutside}
      >
        <div
          id={panelId}
          ref={floatRef}
          className="m-popconfirm__float"
          role="dialog"
          aria-labelledby={titleId}
          tabIndex={-1}
          style={popconfirmStyle({ seed }) as CSSProperties}
        >
          <MBorder
            className="m-popconfirm__panel"
            seed={seed}
            strokeWidth={POPCONFIRM_BORDER_STROKE}
          >
            <div className="m-popconfirm__body">
              {icon ? <span className="m-popconfirm__icon" aria-hidden="true" /> : null}
              <div className="m-popconfirm__main">
                <div id={titleId} className="m-popconfirm__title">
                  {renderTitle ? renderTitle() : title}
                </div>
                {hasContent ? (
                  <div className="m-popconfirm__content">
                    {renderContent ? renderContent() : content}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="m-popconfirm__footer">
              <MButton
                type={confirmType}
                className="m-popconfirm__confirm"
                onClick={() => settle(true)}
              >
                {confirmText}
              </MButton>
              <MButton className="m-popconfirm__cancel" onClick={() => settle(false)}>
                {cancelText}
              </MButton>
            </div>
          </MBorder>
          <span ref={setArrowEl} className="m-popconfirm__arrow" aria-hidden="true" />
        </div>
      </MPopper>
    </>
  );
}
