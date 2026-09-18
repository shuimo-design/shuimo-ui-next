import { useMemo, type MouseEvent, type ReactNode } from "react";
import {
  buttonBrush,
  buttonClasses,
  buttonInert,
  buttonInk,
  isSolidButton,
  type ButtonProps as CoreButtonProps,
} from "@shuimo-design/core";
import { IconLoading } from "../../icons";
import { useBrushBorder } from "../../ink";
import { useMounted, useSize } from "../../runtime";

export interface MButtonProps extends CoreButtonProps {
  children?: ReactNode;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** 指向说明文字的 id（MUpload 的 tip 用） */
  "aria-describedby"?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function MButton(props: MButtonProps) {
  const {
    type = "default",
    text = "",
    disabled = false,
    loading = false,
    href,
    nativeType = "button",
  } = props;
  const solid = isSolidButton(type);
  const brushRef = useBrushBorder(buttonBrush(solid));
  const [sizeRef, size] = useSize("border-box");
  const mounted = useMounted();

  // 两个 ref 回调合成一个绑到根元素上
  const ref = useMemo(
    () => (el: HTMLElement | null) => {
      brushRef(el);
      sizeRef(el);
    },
    [brushRef, sizeRef],
  );

  const ink = buttonInk({ solid, width: size.width, height: size.height, registered: mounted });

  const onClick = (event: MouseEvent<HTMLElement>) => {
    if (buttonInert(props)) {
      event.preventDefault();
      return;
    }
    props.onClick?.(event);
  };

  const shared = {
    ref: ref as never,
    className: [...buttonClasses(props), props.className].filter(Boolean).join(" "),
    style: { ...ink.style, ...props.style } as React.CSSProperties,
    ...ink.attrs,
    "aria-disabled": disabled || undefined,
    "aria-busy": loading || undefined,
    "aria-describedby": props["aria-describedby"],
    onClick,
  };

  const body = (
    <>
      {loading ? <IconLoading className="m-button__spinner" /> : null}
      <span className="m-button__label">{props.children ?? text}</span>
    </>
  );

  return href ? (
    <a {...shared} href={href}>
      {body}
    </a>
  ) : (
    <button {...shared} type={nativeType} disabled={disabled}>
      {body}
    </button>
  );
}
