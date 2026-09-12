import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  confirmBrush,
  confirmClasses,
  createModal,
  resolveMask,
  resolvePortalTarget,
  CONFIRM_CANCEL_TEXT,
  CONFIRM_OK_TEXT,
  CONFIRM_TRANSITION,
  type ConfirmProps as CoreConfirmProps,
} from "@shuimo-design/core";
import { useBrushBorder } from "../../ink";
import { useController, useMounted } from "../../runtime";
import { MTransition } from "../../transition";
import { MButton } from "../button";

export interface MConfirmProps extends CoreConfirmProps {
  /** 受控开关；不传就由组件自己记（配合 defaultOpen） */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 点了确定 */
  onConfirm?: () => void;
  /** 点了取消、遮罩或按了 Esc */
  onCancel?: () => void;
  /** 离场动画结束 */
  onClosed?: () => void;
  /** 替代底部按钮，参数里给了确定 / 取消两个方法 */
  footer?: (actions: { confirm: () => void; cancel: () => void }) => ReactNode;
  /** 替代 content */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MConfirm(props: MConfirmProps) {
  const {
    content = "",
    title,
    mask: maskProp = true,
    teleport = true,
    confirmText = CONFIRM_OK_TEXT,
    cancelText = CONFIRM_CANCEL_TEXT,
    closeOnEsc = true,
    seed = 1,
    footer,
    children,
  } = props;

  const controlled = props.open !== undefined;
  const [uncontrolled, setUncontrolled] = useState(props.defaultOpen ?? false);
  const open = controlled ? props.open! : uncontrolled;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setUncontrolled(next);
      props.onOpenChange?.(next);
    },
    // props 每次渲染都是新对象，只盯受控与否
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controlled],
  );

  function settle(result: boolean) {
    if (!open) return;
    // 先报结果再关：出口那边是听 confirm / cancel 定结果的，
    // 反过来的话 open 先变 false，出口会当成"被取消了"
    if (result) props.onConfirm?.();
    else props.onCancel?.();
    setOpen(false);
  }

  const confirm = () => settle(true);
  const cancel = () => settle(false);

  const mask = resolveMask(maskProp);
  const mounted = useMounted();
  const titleId = useId();
  const contentId = useId();

  // 滚动锁、模态栈、ESC、焦点存还、Tab 循环全在 core 的控制器里，和弹窗、抽屉是同一份
  const [modal] = useController(createModal, { closeOnEsc, onRequestClose: cancel });
  useEffect(() => modal.setOpen(open), [modal, open]);

  const brushRef = useBrushBorder(confirmBrush(seed));
  const panelRef = useMemo(
    () => (el: HTMLElement | null) => {
      brushRef(el);
      modal.setPanel(el);
    },
    [brushRef, modal],
  );

  // 浮层在服务端一律不渲染：React 的 createPortal 在服务端会直接抛错，
  // 首帧也要和服务端一致，否则水合对不上
  const target = mounted ? resolvePortalTarget(teleport) : null;
  if (!mounted) return null;

  const body = (
    <MTransition name={CONFIRM_TRANSITION} in={open} onAfterLeave={() => props.onClosed?.()}>
      <div
        className={confirmClasses(mask.show).join(" ")}
        onClick={(event) => {
          if (event.target === event.currentTarget && mask.clickClose) cancel();
        }}
      >
        <div
          ref={panelRef}
          className={["m-confirm__panel", props.className].filter(Boolean).join(" ")}
          style={props.style}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={contentId}
          tabIndex={-1}
          onKeyDown={(event: KeyboardEvent<HTMLElement>) => modal.trapFocus(event.nativeEvent)}
        >
          {title ? (
            <h3 id={titleId} className="m-confirm__title">
              {title}
            </h3>
          ) : null}
          <div id={contentId} className="m-confirm__content">
            {children ?? content}
          </div>
          <div className="m-confirm__footer">
            {footer ? (
              footer({ confirm, cancel })
            ) : (
              <>
                <MButton type="primary" onClick={confirm}>
                  {confirmText}
                </MButton>
                <MButton onClick={cancel}>{cancelText}</MButton>
              </>
            )}
          </div>
        </div>
      </div>
    </MTransition>
  );

  return target ? createPortal(body, target) : body;
}
