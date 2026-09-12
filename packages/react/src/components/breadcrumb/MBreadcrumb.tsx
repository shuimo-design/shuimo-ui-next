import { useMemo, type CSSProperties, type ReactNode } from "react";
import {
  BREADCRUMB_LABEL,
  breadcrumbStyle,
  type BreadcrumbProps as CoreBreadcrumbProps,
} from "@shuimo-design/core";
import { BreadcrumbContext, type BreadcrumbReactContext } from "./context";
import { MBreadcrumbItem } from "./MBreadcrumbItem";

export interface MBreadcrumbProps extends CoreBreadcrumbProps {
  /** 自定义分隔符内容，优先于 separator 文字（对应 Vue 的 separator 插槽） */
  separatorNode?: ReactNode;
  /** 放 MBreadcrumbItem；给了 options 就忽略 */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MBreadcrumb(props: MBreadcrumbProps) {
  const { separator, options = [], separatorNode, children } = props;
  // 上下文只装纯值 + 一个节点；内容没变就不换引用，免得每次渲染把所有子项叫醒
  const context = useMemo<BreadcrumbReactContext>(
    () => ({ separator, separatorNode }),
    [separator, separatorNode],
  );

  return (
    <nav
      className={["m-breadcrumb", props.className].filter(Boolean).join(" ")}
      aria-label={BREADCRUMB_LABEL}
      // 分隔符那一笔斜杠：子项不传送到别处，变量声明在根上就够了
      style={{ ...breadcrumbStyle(), ...props.style } as CSSProperties}
    >
      <ol className="m-breadcrumb__list">
        <BreadcrumbContext.Provider value={context}>
          {options.length > 0
            ? options.map((option, index) => (
                <MBreadcrumbItem key={index} content={option.content} href={option.href} />
              ))
            : children}
        </BreadcrumbContext.Provider>
      </ol>
    </nav>
  );
}
