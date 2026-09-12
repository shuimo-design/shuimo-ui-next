import { useState, type CSSProperties, type ReactNode } from "react";
import {
  badgeClasses,
  badgeContent,
  badgeInk,
  badgeVisible,
  type BadgeProps as CoreBadgeProps,
} from "@shuimo-design/core";
import { useMounted } from "../../runtime";

export interface MBadgeProps extends CoreBadgeProps {
  /** 被标注的内容；不传时角标独立显示，不做绝对定位（对应 Vue 的默认插槽） */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MBadge(props: MBadgeProps) {
  const { dot = false, children } = props;
  const content = badgeContent(props);
  // 素材登记要有样式表：服务端和水合首帧一律内联，挂载之后才升级成 data 属性
  const mounted = useMounted();

  // 数字变了就换个 key 让 sup 重挂一次，CSS 动画随之重播；首次挂载不弹。
  // 渲染期比上一次的文字，等价于 Vue 的 watch(content)，比放进 effect 少一帧闪动
  const [bump, setBump] = useState(0);
  const [seen, setSeen] = useState(content);
  if (seen !== content) {
    setSeen(content);
    setBump((n) => n + 1);
  }

  const ink = badgeInk(props, mounted);

  return (
    <span
      className={[...badgeClasses(props, Boolean(children)), props.className]
        .filter(Boolean)
        .join(" ")}
      style={{ ...ink.style, ...props.style } as CSSProperties}
      {...ink.attrs}
    >
      {children}
      {badgeVisible(props) ? (
        <sup
          key={bump}
          className={["m-badge__sup", ...(bump > 0 ? ["m-badge__sup--bump"] : [])].join(" ")}
          aria-hidden={dot ? "true" : undefined}
        >
          {content}
        </sup>
      ) : null}
    </span>
  );
}
