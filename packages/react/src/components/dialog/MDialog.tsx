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
  DIALOG_TRANSITION,
  createModal,
  dialogBrush,
  dialogScene,
  dialogStyle,
  resolveMask,
  resolvePortalTarget,
  type DialogProps as CoreDialogProps,
} from "@shuimo-design/core";
import { IconClose } from "../../icons";
import { useBrushBorder } from "../../ink";
import { useController, useMounted } from "../../runtime";
import { MTransition } from "../../transition";

export interface MDialogProps extends CoreDialogProps {
  /** 受控开关；不传就由组件自己记（配合 defaultOpen） */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 变为显示 */
  onOpen?: () => void;
  /** 变为隐藏（关闭按钮、ESC、点遮罩或外部改 open 都会触发） */
  onClose?: () => void;
  /** 触发元素：点一下就打开，省去自己维护开关 */
  active?: ReactNode;
  /** 头部，替代 title */
  header?: ReactNode;
  /** 底部操作区 */
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MDialog(props: MDialogProps) {
  const {
    mask: maskProp = true,
    closeBtn = true,
    closeOnEsc = true,
    title,
    width,
    height,
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
    // props 每次渲染都是新对象，只盯受控与否
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controlled],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);

  const mask = resolveMask(maskProp);
  const mounted = useMounted();
  const titleId = useId();
  const uid = useId();

  // 滚动锁、模态栈、ESC、焦点存还、Tab 循环全在 core 的控制器里，和 Vue 那边是同一份
  const [modal] = useController(createModal, { closeOnEsc, onRequestClose: close });
  useEffect(() => modal.setOpen(model), [modal, model]);

  // open / close 事件：只在真的翻转时发
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

  const brushRef = useBrushBorder(dialogBrush(seed));
  const panelRef = useMemo(
    () => (el: HTMLElement | null) => {
      brushRef(el);
      modal.setPanel(el);
    },
    [brushRef, modal],
  );

  const rootStyle = { ...dialogStyle({ seed, width, height }), ...props.style } as CSSProperties;
  const scene = dialogScene(seed, uid);

  const trigger = active ? (
    <span className="m-dialog__active" onClick={() => setOpen(true)}>
      {active}
    </span>
  ) : null;

  // 浮层在服务端一律不渲染：React 的 createPortal 在服务端会直接抛错，
  // 首帧也要和服务端一致，否则水合对不上
  const target = mounted ? resolvePortalTarget(teleport) : null;
  if (!mounted || !rendered) return trigger;

  const body = (
    <MTransition name={DIALOG_TRANSITION} in={model} unmountOnLeave={false}>
      <div
        className={["m-dialog", mask.show ? "m-dialog--masked" : ""].filter(Boolean).join(" ")}
        style={rootStyle}
      >
        <div className="m-dialog__mask" onClick={() => mask.clickClose && close()} />
        {/* 包一层：面板要用 clip-path 挖掉左上角的缺口（旧版那里没有纸、透出遮罩），四角回纹和题头小景挂在这一层上才不会被一起裁掉 */}
        <div className="m-dialog__frame">
          {/* 小景是自己生成的可信标记，不含用户内容 */}
          <span
            className="m-dialog__scene"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: scene }}
          />
          <div
            ref={panelRef}
            className={["m-dialog__panel", props.className].filter(Boolean).join(" ")}
            role="dialog"
            aria-modal="true"
            aria-labelledby={header || title ? titleId : undefined}
            tabIndex={-1}
            onKeyDown={(event: KeyboardEvent<HTMLElement>) => modal.trapFocus(event.nativeEvent)}
          >
            {closeBtn ? (
              <button type="button" className="m-dialog__close" aria-label="关闭" onClick={close}>
                {/* 牌顶的墨渍和牌底的坠子只在 m.ink 层显示 */}
                <span className="m-dialog__close-splash" aria-hidden="true" />
                <IconClose />
                <span className="m-dialog__close-tassel" aria-hidden="true" />
              </button>
            ) : null}
            {header || title ? (
              <header id={titleId} className="m-dialog__header">
                {header ?? title}
              </header>
            ) : null}
            <div className="m-dialog__body">{children}</div>
            {footer ? <footer className="m-dialog__footer">{footer}</footer> : null}
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
