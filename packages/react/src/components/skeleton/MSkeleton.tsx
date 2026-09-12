import { useEffect, type CSSProperties, type ReactNode } from "react";
import {
  createSkeleton,
  skeletonClasses,
  skeletonRows,
  type SkeletonProps as CoreSkeletonProps,
} from "@shuimo-design/core";
import { useController } from "../../runtime";
import { MSkeletonItem } from "./MSkeletonItem";

export interface MSkeletonProps extends CoreSkeletonProps {
  /** 真实内容，loading 为 false 时渲染（对应 Vue 的默认插槽） */
  children?: ReactNode;
  /** 自定义骨架排布，用 MSkeletonItem 拼 */
  template?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MSkeleton(props: MSkeletonProps) {
  const {
    loading = true,
    animated = false,
    rows = 3,
    avatar = false,
    title = true,
    throttle = 0,
    children,
    template,
  } = props;

  // throttle 窗口内什么都不画：数据很快回来的话，用户根本看不到骨架闪一下。定时器在 core 的控制器里
  const [skeleton, state] = useController(createSkeleton, { loading, throttle });
  useEffect(() => skeleton.setLoading(loading), [skeleton, loading]);

  if (!loading) return <>{children}</>;
  if (!state.visible) return null;

  const paragraph = skeletonRows(rows);

  return (
    <div
      className={[...skeletonClasses(animated), props.className].filter(Boolean).join(" ")}
      style={props.style}
      aria-busy="true"
    >
      {template ?? (
        <div className="m-skeleton__default">
          {avatar ? <MSkeletonItem className="m-skeleton__avatar" variant="circle" /> : null}
          <div className="m-skeleton__content">
            {title ? <MSkeletonItem className="m-skeleton__title" variant="h3" /> : null}
            {paragraph.length > 0 ? (
              <div className="m-skeleton__paragraph">
                {paragraph.map((i) => (
                  <MSkeletonItem key={i} className="m-skeleton__row" variant="text" />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
