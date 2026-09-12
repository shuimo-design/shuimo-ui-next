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
  tooltipClasses,
  tooltipTipStyle,
  TOOLTIP_BORDER_STROKE,
  type TooltipProps as CoreTooltipProps,
} from "@shuimo-design/core";
import { MPopper } from "../../internal/MPopper";
import { MBorder } from "../border";
import { useController } from "../../runtime";

export interface MTooltipProps extends CoreTooltipProps {
  /** 受控显隐；不传就由组件自己记（配合 defaultShow） */
  show?: boolean;
  defaultShow?: boolean;
  onShowChange?: (open: boolean) => void;
  /** 显隐变化（用户操作引起的） */
  onVisibleChange?: (open: boolean) => void;
  /** 被提示的内容；第一个元素当参照元素，并挂上 aria-describedby */
  children?: ReactNode;
  /** 提示内容，等价于 content */
  tip?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MTooltip(props: MTooltipProps) {
  const {
    placement = "bottom",
    trigger = "hover",
    content,
    disabled = false,
    arrow = true,
    offset = 6,
    openDelay = 80,
    closeDelay = 80,
    disableClickAway = false,
    teleport = true,
    seed = 1,
    children,
    tip,
  } = props;

  const controlled = props.show !== undefined;
  const [uncontrolled, setUncontrolled] = useState(props.defaultShow ?? false);
  const show = controlled ? props.show! : uncontrolled;

  const tooltipId = useId();
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
  const [tooltip, state] = useController(createPopoverTrigger, {
    trigger,
    disabled,
    openDelay,
    closeDelay,
    disableClickAway,
    show,
    onChange,
  });

  const wrapperRef = useCallback((el: HTMLElement | null) => tooltip.setWrapper(el), [tooltip]);
  const floatRef = useCallback((el: HTMLElement | null) => tooltip.setPanel(el), [tooltip]);
  // 壳里的内容换了要重新挑参照元素，所以每次渲染后都对一遍（等价于 Vue 的 onUpdated）
  useEffect(() => tooltip.refresh());

  const open = show && !disabled;

  // 提示打开时挂到参照元素的 aria-describedby 上，读屏聚焦到它就会读出提示
  const prevReference = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = state.reference;
    const prev = prevReference.current;
    if (prev && prev !== el) prev.removeAttribute("aria-describedby");
    prevReference.current = el;
    if (!el) return;
    if (open) el.setAttribute("aria-describedby", tooltipId);
    else el.removeAttribute("aria-describedby");
  }, [state.reference, open, tooltipId]);

  return (
    <>
      <span
        ref={wrapperRef}
        className={[
          ...tooltipClasses({ wrapOnly: state.wrapOnly, open, disabled }),
          props.className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={props.style}
        onMouseEnter={tooltip.onTriggerEnter}
        onMouseLeave={tooltip.onTriggerLeave}
        onClick={tooltip.onTriggerClick}
        onFocus={(e) => tooltip.onTriggerFocusin(e.nativeEvent)}
        onBlur={(e) => tooltip.onTriggerFocusout(e.nativeEvent)}
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
        onClickOutside={tooltip.onClickOutside}
      >
        <div
          id={tooltipId}
          ref={floatRef}
          className="m-tooltip__float"
          role="tooltip"
          style={tooltipTipStyle({ seed }) as CSSProperties}
          onMouseEnter={tooltip.onPanelEnter}
          onMouseLeave={tooltip.onPanelLeave}
          onBlur={(e) => tooltip.onPanelFocusout(e.nativeEvent)}
        >
          <MBorder className="m-tooltip__panel" seed={seed} strokeWidth={TOOLTIP_BORDER_STROKE}>
            {tip ?? content}
          </MBorder>
          {arrow ? <span ref={setArrowEl} className="m-tooltip__arrow" aria-hidden="true" /> : null}
        </div>
      </MPopper>
    </>
  );
}
