import { useContext, type CSSProperties, type ReactNode } from "react";
import {
  breadcrumbSeparatorKind,
  type BreadcrumbItemProps as CoreBreadcrumbItemProps,
} from "@shuimo-design/core";
import { BreadcrumbContext } from "./context";

export interface MBreadcrumbItemProps extends CoreBreadcrumbItemProps {
  /** 项内容，替代 content */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MBreadcrumbItem(props: MBreadcrumbItemProps) {
  const { content, href, children } = props;
  const breadcrumb = useContext(BreadcrumbContext);
  // 画哪种分隔符的判断在 core，两个壳才不会各判一套
  const kind = breadcrumbSeparatorKind({
    custom: Boolean(breadcrumb?.separatorNode),
    context: breadcrumb,
  });
  const body = children ?? content;

  return (
    <li
      className={["m-breadcrumb-item", props.className].filter(Boolean).join(" ")}
      style={props.style}
    >
      <span className="m-breadcrumb-item__separator" aria-hidden="true">
        {kind === "custom" ? breadcrumb?.separatorNode : null}
        {kind === "text" ? breadcrumb?.separator : null}
        {kind === "slash" ? <i className="m-breadcrumb-item__slash" /> : null}
      </span>
      {href ? (
        <a className="m-breadcrumb-item__content" href={href}>
          {body}
        </a>
      ) : (
        <span className="m-breadcrumb-item__content">{body}</span>
      )}
    </li>
  );
}
