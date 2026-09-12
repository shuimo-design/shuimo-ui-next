import type { CSSProperties, MouseEvent, ReactNode } from "react";
import {
  tagClasses,
  tagCloseInert,
  tagInk,
  TAG_CLOSE_LABEL,
  type TagProps as CoreTagProps,
} from "@shuimo-design/core";
import { useMounted } from "../../runtime";

export interface MTagProps extends CoreTagProps {
  children?: ReactNode;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** 点了关闭按钮（禁用时不触发） */
  onClose?: (event: MouseEvent<HTMLElement>) => void;
  className?: string;
  style?: CSSProperties;
}

export function MTag(props: MTagProps) {
  const { closable = false, disabled = false, seed = 1, color } = props;
  // 素材登记要写样式表，服务端没有；首帧一律内联，挂载后才升级成 data 属性
  const mounted = useMounted();
  const ink = tagInk({ seed, color, registered: mounted });

  const onClose = (event: MouseEvent<HTMLElement>) => {
    // 关闭是标签内部的事，不该顺带触发外层的 click
    event.stopPropagation();
    if (tagCloseInert(props)) return;
    props.onClose?.(event);
  };

  return (
    <span
      className={[...tagClasses(props), props.className].filter(Boolean).join(" ")}
      style={{ ...ink.style, ...props.style } as CSSProperties}
      {...ink.attrs}
      onClick={props.onClick}
    >
      <span className="m-tag__label">{props.children}</span>
      {closable ? (
        <button
          type="button"
          className="m-tag__close"
          aria-label={TAG_CLOSE_LABEL}
          disabled={disabled}
          onClick={onClose}
        >
          <span className="m-tag__cross" aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
}
