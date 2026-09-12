import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  DRAWER_TRANSITION,
  createModal,
  drawerBrush,
  drawerClasses,
  drawerStyle,
  resolveMask,
  resolvePortalTarget,
  type DrawerProps as CoreDrawerProps,
} from "@shuimo-design/core";
import { IconClose } from "../../icons";
import { useBrushBorder } from "../../ink";
import { useController, useMounted } from "../../runtime";
import { MTransition } from "../../transition";

export interface MDrawerProps extends CoreDrawerProps {
  /** 受控开关；不传就由组件自己记（配合 defaultOpen） */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onOpen?: () => void;
  onClose?: () => void;
  /** 触发元素：点一下就打开 */
  active?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MDrawer(props: MDrawerProps) {
  const {
    mask: maskProp = true,
    direction = "right",
    size,
    closeBtn = true,
    closeOnEsc = true,
    title,
    teleport = true,
    seed = 1,
    active,
    header,
    footer,
    children,
  } = props;

  const controlled = props.open !== undefined;
  const [uncontrolled, setUncontrolled] = useState(props.defaultOpen ?? false);
  const model = controlled ? props.open! : uncontrolled;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setUncontrolled(next);
      props.onOpenChange?.(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controlled],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);

  const mask = resolveMask(maskProp);
  const mounted = useMounted();
  const titleId = useId();

  const [modal] = useController(createModal, { closeOnEsc, onRequestClose: close });
  useEffect(() => modal.setOpen(model), [modal, model]);

  const was = useRef(model);
  useEffect(() => {
    if (was.current === model) return;
    was.current = model;
    if (model) props.onOpen?.();
    else props.onClose?.();
  });

  // 首次打开才渲染内容；之后留在树里用 display:none 收起，笔触边框和面板尺寸不用每次重算
  const [rendered, setRendered] = useState(model);
  useEffect(() => {
    if (model) setRendered(true);
  }, [model]);

  const brushRef = useBrushBorder(drawerBrush(seed));
  const panelRef = useMemo(
    () => (el: HTMLElement | null) => {
      brushRef(el);
      modal.setPanel(el);
    },
    [brushRef, modal],
  );

  const rootStyle = { ...drawerStyle({ seed, size }), ...props.style } as CSSProperties;

  const trigger = active ? (
    <span className="m-drawer__active" onClick={() => setOpen(true)}>
      {active}
    </span>
  ) : null;

  // 浮层在服务端一律不渲染（createPortal 在服务端会抛错），首帧也要和服务端一致
  const target = mounted ? resolvePortalTarget(teleport) : null;
  if (!mounted || !rendered) return trigger;

  const body = (
    <MTransition name={DRAWER_TRANSITION} in={model} unmountOnLeave={false}>
      <div className={drawerClasses(direction, mask.show).join(" ")} style={rootStyle}>
        <div className="m-drawer__mask" onClick={() => mask.clickClose && close()} />
        {/* 和弹窗一样包一层：四角回纹挂在这一层上，推拉动画也在这一层 */}
        <div className="m-drawer__frame">
          <div
            ref={panelRef}
            className={["m-drawer__panel", props.className].filter(Boolean).join(" ")}
            role="dialog"
            aria-modal="true"
            aria-labelledby={header || title ? titleId : undefined}
            tabIndex={-1}
            onKeyDown={(event: KeyboardEvent<HTMLElement>) => modal.trapFocus(event.nativeEvent)}
          >
            {closeBtn ? (
              <button type="button" className="m-drawer__close" aria-label="关闭" onClick={close}>
                {/* 牌顶的墨花和牌底的坠子只在 m.ink 层显示 */}
                <span className="m-drawer__close-splash" aria-hidden="true" />
                <IconClose />
                <span className="m-drawer__close-tassel" aria-hidden="true" />
              </button>
            ) : null}
            {header || title ? (
              <header id={titleId} className="m-drawer__header">
                {header ?? title}
              </header>
            ) : null}
            <div className="m-drawer__body">{children}</div>
            {footer ? <footer className="m-drawer__footer">{footer}</footer> : null}
          </div>
        </div>
      </div>
    </MTransition>
  );

  return (
    <>
      {trigger}
      {target ? createPortal(body, target) : body}
    </>
  );
}
