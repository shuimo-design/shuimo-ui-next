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
  createPopoverTrigger,
  popoverClasses,
  popoverReferenceAria,
  popoverTipStyle,
  POPOVER_BORDER_STROKE,
  POPOVER_REFERENCE_ARIA,
  type PopoverProps as CorePopoverProps,
} from "@shuimo-design/core";
import { MPopper } from "../../internal/MPopper";
import { MBorder } from "../border";
import { useController } from "../../runtime";

export interface MPopoverProps extends CorePopoverProps {
  /** 受控显隐；不传就由组件自己记（配合 defaultShow） */
  show?: boolean;
  defaultShow?: boolean;
  onShowChange?: (open: boolean) => void;
  /** 显隐变化（用户操作引起的） */
  onVisibleChange?: (open: boolean) => void;
  /** 触发内容；第一个元素当参照元素 */
  children?: ReactNode;
  /** 气泡内容，等价于 content */
  panel?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MPopover(props: MPopoverProps) {
  const {
    placement = "bottom",
    trigger = "click",
    content,
    disabled = false,
    arrow = true,
    offset = 8,
    openDelay = 0,
    closeDelay = 100,
    disableClickAway = false,
    teleport = true,
    seed = 1,
    children,
    panel,
  } = props;

  const controlled = props.show !== undefined;
  const [uncontrolled, setUncontrolled] = useState(props.defaultShow ?? false);
  const show = controlled ? props.show! : uncontrolled;

  const panelId = useId();
  const [arrowEl, setArrowEl] = useState<HTMLElement | null>(null);

  const onChange = useCallback(
    (open: boolean) => {
      if (!controlled) setUncontrolled(open);
      props.onShowChange?.(open);
      props.onVisibleChange?.(open);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controlled],
  );

  // 开合时序（延时、hover / click / focus、Escape、点外面）全在 core 的控制器里，和 Vue 那边同一份
  const [popover, state] = useController(createPopoverTrigger, {
    trigger,
    disabled,
    openDelay,
    closeDelay,
    disableClickAway,
    show,
    onChange,
  });

  const wrapperRef = useCallback((el: HTMLElement | null) => popover.setWrapper(el), [popover]);
  const floatRef = useCallback((el: HTMLElement | null) => popover.setPanel(el), [popover]);
  // 壳里的内容换了要重新挑参照元素，所以每次渲染后都对一遍（等价于 Vue 的 onUpdated）
  useEffect(() => popover.refresh());

  const open = show && !disabled;

  // 点击触发时把展开状态标在参照元素上，读屏能知道这个按钮带着一个气泡
  const prevReference = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = state.reference;
    const prev = prevReference.current;
    if (prev && prev !== el) {
      for (const name of POPOVER_REFERENCE_ARIA) prev.removeAttribute(name);
    }
    prevReference.current = el;
    if (!el) return;
    const aria = popoverReferenceAria({ trigger, open, panelId });
    for (const name of POPOVER_REFERENCE_ARIA) {
      const value = aria[name];
      if (value === undefined) el.removeAttribute(name);
      else el.setAttribute(name, value);
    }
  }, [state.reference, open, trigger, panelId]);

  return (
    <>
      <span
        ref={wrapperRef}
        className={[
          ...popoverClasses({ wrapOnly: state.wrapOnly, open, disabled }),
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
      >
        {children}
      </span>
      <MPopper
        open={open}
        reference={state.reference}
        placement={placement}
        offset={offset}
        teleport={teleport}
        arrow={arrow ? arrowEl : null}
        onClickOutside={popover.onClickOutside}
      >
        <div
          id={panelId}
          ref={floatRef}
          className="m-popover__float"
          style={popoverTipStyle({ seed }) as CSSProperties}
          onMouseEnter={popover.onPanelEnter}
          onMouseLeave={popover.onPanelLeave}
          onBlur={(e) => popover.onPanelFocusout(e.nativeEvent)}
        >
          <MBorder className="m-popover__panel" seed={seed} strokeWidth={POPOVER_BORDER_STROKE}>
            {panel ?? content}
          </MBorder>
          {arrow ? <span ref={setArrowEl} className="m-popover__arrow" aria-hidden="true" /> : null}
        </div>
      </MPopper>
    </>
  );
}
