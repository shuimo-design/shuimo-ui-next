import type { CSSProperties } from "react";
import { skeletonItemClasses, type SkeletonItemProps } from "@shuimo-design/core";
import { IconEye } from "../../icons";

export interface MSkeletonItemProps extends SkeletonItemProps {
  className?: string;
  style?: CSSProperties;
}

export function MSkeletonItem(props: MSkeletonItemProps) {
  const { variant = "text" } = props;
  return (
    <div
      className={[...skeletonItemClasses(variant), props.className].filter(Boolean).join(" ")}
      style={props.style}
      aria-hidden="true"
    >
      {/* 图片占位在中间放一只眼睛，让人知道这块将来是图 */}
      {variant === "image" ? <IconEye className="m-skeleton-item__icon" /> : null}
    </div>
  );
}
