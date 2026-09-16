import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  BACK_TOP_LABEL,
  BACK_TOP_OFFSET,
  BACK_TOP_TRANSITION,
  BACK_TOP_VISIBILITY_HEIGHT,
  backTopClasses,
  backTopStamp,
  backTopStyle,
  createBackTop,
  resolvePortalTarget,
  type BackTopProps as CoreBackTopProps,
} from "@shuimo-design/core";
import { useController, useMounted } from "../../runtime";
import { MTransition } from "../../transition";
import { MStamp } from "../stamp/MStamp";

export interface MBackTopProps extends CoreBackTopProps {
  /** 替换按钮内容；默认是一枚印文「顶」的小方印 */
  children?: ReactNode;
  /** 点了按钮；随后滚回顶部 */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  style?: CSSProperties;
}

export function MBackTop(props: MBackTopProps) {
  const {
    target,
    visibilityHeight = BACK_TOP_VISIBILITY_HEIGHT,
    right = BACK_TOP_OFFSET,
    bottom = BACK_TOP_OFFSET,
    seed = 1,
    children,
  } = props;

  // 目标解析、滚动监听、可见性判断、滚回顶部全在 core 的控制器里，Vue 那边用的是同一份
  const [backTop, state] = useController(createBackTop, { target, visibilityHeight });

  // 传送到 body 的内容不进服务端 HTML：createPortal 在服务端会直接抛错，首帧也要和服务端一致
  const mounted = useMounted();
  const portal = mounted ? resolvePortalTarget(true) : null;
  if (!portal) return null;

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(event);
    backTop.scrollToTop();
  };

  return createPortal(
    <MTransition name={BACK_TOP_TRANSITION} in={state.visible}>
      <button
        type="button"
        className={[...backTopClasses({ custom: children !== undefined }), props.className]
          .filter(Boolean)
          .join(" ")}
        style={{ ...backTopStyle({ right, bottom }), ...props.style } as CSSProperties}
        aria-label={BACK_TOP_LABEL}
        onClick={onClick}
      >
        <span className="m-back-top__seal">{children ?? <MStamp {...backTopStamp(seed)} />}</span>
      </button>
    </MTransition>,
    portal,
  );
}
