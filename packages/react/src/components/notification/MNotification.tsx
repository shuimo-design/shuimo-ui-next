import { useCallback, useEffect, type CSSProperties, type ReactNode } from "react";
import {
  createNotificationItem,
  notificationClasses,
  notificationRole,
  notificationStyle,
  NOTIFICATION_CLOSE_LABEL,
  NOTIFICATION_DURATION,
  type NotificationProps as CoreNotificationProps,
} from "@shuimo-design/core";
import { useController } from "../../runtime";
import { MDeleteIcon } from "../delete-icon/MDeleteIcon";

export interface MNotificationProps extends CoreNotificationProps {
  /** 离场动画结束、可以从 DOM 移除时 */
  onClose?: () => void;
  /** 替代类型徽记 */
  icon?: ReactNode;
  /** 替代 content */
  children?: ReactNode;
  /** 渲染出口推下来的"请你离场"信号；手写 <MNotification> 时不用管它 */
  closing?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function MNotification(props: MNotificationProps) {
  const {
    title,
    content = "",
    type,
    duration = NOTIFICATION_DURATION,
    closable = true,
    placement = "top-right",
    seed = 1,
    closing = false,
    icon,
    children,
    className,
    style,
  } = props;

  // 倒计时、悬停暂停、进出场动画、尺寸测量全在 core 的控制器里，Vue 那边用的是同一份
  const [item, state] = useController(createNotificationItem, {
    placement,
    duration,
    seed,
    onClose: () => props.onClose?.(),
  });

  // ref 回调要引用恒定，否则每次渲染 React 都会先 setRoot(null) 再 setRoot(el)
  const rootRef = useCallback((el: HTMLElement | null) => item.setRoot(el), [item]);
  // 外部请求离场：状态在队列那边，控制器只接一个开关
  useEffect(() => item.setClosing(closing), [item, closing]);

  const classes = notificationClasses({ type, placement, closable, closing: state.closing });
  const hasContent = Boolean(children || content);

  return (
    <div
      ref={rootRef}
      className={[...classes, className].filter(Boolean).join(" ")}
      style={
        {
          ...notificationStyle({ type, seed, width: state.width, height: state.height }),
          ...style,
        } as CSSProperties
      }
      role={notificationRole(type)}
      onMouseEnter={item.onMouseEnter}
      onMouseLeave={item.onMouseLeave}
    >
      {icon ? (
        <span className="m-notification__icon m-notification__icon--custom" aria-hidden="true">
          {icon}
        </span>
      ) : type ? (
        <span className="m-notification__icon" aria-hidden="true" />
      ) : null}
      <div className="m-notification__body">
        <div className="m-notification__title">{title}</div>
        {hasContent ? <div className="m-notification__content">{children ?? content}</div> : null}
      </div>
      {closable ? (
        <MDeleteIcon
          className="m-notification__close"
          kind="cross"
          size={20}
          label={NOTIFICATION_CLOSE_LABEL}
          seed={seed}
          onClick={item.close}
        />
      ) : null}
    </div>
  );
}
