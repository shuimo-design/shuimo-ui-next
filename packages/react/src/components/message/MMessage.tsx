import { useCallback, useEffect, type CSSProperties, type ReactNode } from "react";
import {
  createMessageItem,
  messageClasses,
  messageStyle,
  MESSAGE_CLOSE_LABEL,
  type MessageProps as CoreMessageProps,
} from "@shuimo-design/core";
import { IconClose } from "../../icons";
import { useController } from "../../runtime";

export interface MMessageProps extends CoreMessageProps {
  /** 离场动画结束、可以从 DOM 移除时 */
  onClose?: () => void;
  /** 替代类型图标 */
  icon?: ReactNode;
  /** 替代 content */
  children?: ReactNode;
  /** 渲染出口推下来的"请你离场"信号；手写 <MMessage> 时不用管它 */
  closing?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function MMessage(props: MMessageProps) {
  const {
    type = "info",
    content = "",
    duration = 3000,
    direction = "top-right",
    dragAllow = true,
    closable = false,
    seed = 1,
    closing = false,
    icon,
    children,
    className,
    style,
  } = props;

  // 倒计时、悬停暂停、拖动关闭、进出场动画、尺寸测量全在 core 的控制器里，Vue 那边用的是同一份
  const [item, state] = useController(createMessageItem, {
    direction,
    duration,
    dragAllow,
    seed,
    onClose: () => props.onClose?.(),
  });

  // ref 回调要引用恒定，否则每次渲染 React 都会先 setRoot(null) 再 setRoot(el)
  const rootRef = useCallback((el: HTMLElement | null) => item.setRoot(el), [item]);
  // 外部请求离场：和 MDialog 的 modal.setOpen 一个路数，状态在队列那边，控制器只接一个开关
  useEffect(() => item.setClosing(closing), [item, closing]);

  const classes = messageClasses({
    type,
    direction,
    dragging: state.dragging,
    removing: state.removing,
    closing: state.closing,
  });

  return (
    <div
      ref={rootRef}
      className={[...classes, className].filter(Boolean).join(" ")}
      style={
        {
          ...messageStyle({
            type,
            seed,
            width: state.width,
            height: state.height,
            x: state.x,
            y: state.y,
          }),
          ...style,
        } as CSSProperties
      }
      role="status"
      onMouseEnter={item.onMouseEnter}
      onMouseLeave={item.onMouseLeave}
      onPointerDown={(event) => item.onPointerDown(event.nativeEvent)}
      onPointerMove={(event) => item.onPointerMove(event.nativeEvent)}
      onPointerUp={(event) => item.onPointerUp(event.nativeEvent)}
      onPointerCancel={(event) => item.onPointerUp(event.nativeEvent)}
    >
      <span
        className={["m-message__icon", icon ? "m-message__icon--custom" : ""]
          .filter(Boolean)
          .join(" ")}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="m-message__content">{children ?? content}</div>
      {closable ? (
        <button
          type="button"
          className="m-message__close"
          aria-label={MESSAGE_CLOSE_LABEL}
          onClick={item.close}
        >
          <IconClose />
        </button>
      ) : null}
    </div>
  );
}
