import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  createFloating,
  floatingStyle,
  observeOutside,
  resolvePortalTarget,
  type Placement,
} from "@shuimo-design/core";
import { useController, useMounted } from "../runtime";
import { MTransition } from "../transition";

export interface MPopperProps {
  /** 是否显示 */
  open: boolean;
  /** 参照元素 */
  reference: HTMLElement | null | undefined;
  /** floating-ui 的 placement，默认 bottom-start */
  placement?: Placement;
  /** 与参照元素的间距 px，默认 6 */
  offset?: number;
  /** 浮层宽度跟随参照元素 */
  matchWidth?: boolean;
  /** 传送到 body；默认 true。关掉时渲染在原地（用于测试或受限容器） */
  teleport?: boolean;
  /** 浮层根元素的 role */
  role?: string;
  /** 箭头元素：传了就参与定位，算出的坐标写成浮层根上的 --m-popper-arrow-x / -y */
  arrow?: HTMLElement | null;
  /** 点在浮层与参照元素之外 */
  onClickOutside?: (event: PointerEvent) => void;
  children?: ReactNode;
}

/**
 * 浮层原语：定位、传送、淡入、外部点击上报。
 * 定位在 core 的控制器里（底下是框架无关的 @floating-ui/dom），Vue 那边用的是同一份。
 */
export function MPopper(props: MPopperProps) {
  const {
    open,
    reference,
    placement = "bottom-start",
    offset = 6,
    matchWidth = false,
    teleport = true,
    role,
    arrow,
    children,
  } = props;

  const mounted = useMounted();
  const floating = useRef<HTMLElement | null>(null);

  const [controller, state] = useController(createFloating, {
    placement,
    offset,
    matchWidth,
    open,
  });

  const floatingRef = useCallback(
    (el: HTMLElement | null) => {
      floating.current = el;
      controller.setFloating(el);
    },
    [controller],
  );

  useEffect(() => controller.setReference(reference ?? null), [controller, reference]);
  useEffect(() => controller.setArrow(arrow ?? null), [controller, arrow]);

  const onOutside = useRef(props.onClickOutside);
  onOutside.current = props.onClickOutside;
  useEffect(
    () =>
      observeOutside(
        () => floating.current,
        (event) => onOutside.current?.(event),
        { ignore: () => [reference ?? null] },
      ),
    [reference],
  );

  // 浮层在服务端不渲染：createPortal 在服务端会抛错，首帧也要和服务端一致
  if (!mounted) return null;
  const target = teleport ? resolvePortalTarget(true) : null;

  const body = (
    <MTransition name="m-popper" in={open}>
      <div
        ref={floatingRef}
        className="m-popper"
        style={floatingStyle(state) as CSSProperties}
        data-placement={state.placement}
        role={role}
      >
        {children}
      </div>
    </MTransition>
  );

  return target ? createPortal(body, target) : body;
}
