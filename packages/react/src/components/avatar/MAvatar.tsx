import { useState, type CSSProperties, type ReactNode, type SyntheticEvent } from "react";
import {
  avatarClasses,
  avatarVars,
  type AvatarProps as CoreAvatarProps,
} from "@shuimo-design/core";
import { IconUser } from "../../icons";

export interface MAvatarProps extends CoreAvatarProps {
  /** 无图或图片加载失败时的兜底内容（对应 Vue 的默认插槽） */
  children?: ReactNode;
  /** 图片加载失败 */
  onError?: (event: SyntheticEvent<HTMLImageElement, Event>) => void;
  className?: string;
  style?: CSSProperties;
}

export function MAvatar(props: MAvatarProps) {
  const { src, alt, children } = props;
  // 记下"哪个地址加载失败了"而不是一个布尔：换了地址自然重新尝试，不用再补一个重置的副作用
  const [failedSrc, setFailedSrc] = useState<string | undefined>(undefined);
  const showImage = Boolean(src) && failedSrc !== src;

  function onError(event: SyntheticEvent<HTMLImageElement, Event>) {
    setFailedSrc(src);
    props.onError?.(event);
  }

  return (
    <span
      className={[...avatarClasses(props), props.className].filter(Boolean).join(" ")}
      style={{ ...avatarVars(props), ...props.style } as CSSProperties}
      role={showImage ? undefined : "img"}
      aria-label={showImage ? undefined : alt}
    >
      <span className="m-avatar__body">
        {showImage ? (
          <img className="m-avatar__img" src={src} alt={alt} onError={onError} />
        ) : (
          <span className="m-avatar__fallback">
            {children ?? <IconUser className="m-avatar__icon" />}
          </span>
        )}
      </span>
      <span className="m-avatar__frame" aria-hidden="true" />
    </span>
  );
}
