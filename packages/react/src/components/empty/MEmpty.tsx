import type { CSSProperties, ReactNode } from "react";
import {
  emptyClasses,
  emptyHasFigure,
  emptyStyle,
  EMPTY_DESCRIPTION,
  type EmptyProps as CoreEmptyProps,
} from "@shuimo-design/core";

export interface MEmptyProps extends CoreEmptyProps {
  /**
   * 自定义插图，替换内置的（对应 Vue 的 image 插槽）。
   * 叫 figure 不叫 image：image 这个名字已经被"内置插图选哪张"占了
   */
  figure?: ReactNode;
  /** 说明文字，优先于 description（对应 Vue 的 description 插槽） */
  descriptionNode?: ReactNode;
  /** 说明下面的操作区（按钮等） */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MEmpty(props: MEmptyProps) {
  const { description = EMPTY_DESCRIPTION, imageSize = 120, image = "enso", seed = 1 } = props;
  // 有没有自定义插图是框架概念，只能在壳里判断，再交给 core 派生
  const figure = { image, imageSize, seed, custom: Boolean(props.figure) };

  return (
    <div
      className={[...emptyClasses(figure), props.className].filter(Boolean).join(" ")}
      style={{ ...emptyStyle(figure), ...props.style } as CSSProperties}
    >
      {emptyHasFigure(figure) ? (
        <div className="m-empty__image" aria-hidden="true">
          {props.figure ?? <span className="m-empty__figure" />}
        </div>
      ) : null}
      <p className="m-empty__description">{props.descriptionNode ?? description}</p>
      {props.children ? <div className="m-empty__extra">{props.children}</div> : null}
    </div>
  );
}
