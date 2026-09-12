import { useContext, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import {
  listItemClasses,
  resolveListMarker,
  type ListItemProps as CoreListItemProps,
} from "@shuimo-design/core";
import { ListContext } from "./context";

export interface MListItemProps extends CoreListItemProps {
  children?: ReactNode;
  onClick?: (event: MouseEvent<HTMLLIElement>) => void;
  className?: string;
  style?: CSSProperties;
}

export function MListItem(props: MListItemProps) {
  const { active = false, marker, children } = props;
  const list = useContext(ListContext);
  // marker 不给默认值：要能区分"没传"（跟随 MList）和"传了 false"
  const showMarker = resolveListMarker(marker, list);

  return (
    <li
      className={[...listItemClasses({ active, marker: showMarker }), props.className]
        .filter(Boolean)
        .join(" ")}
      style={props.style}
      onClick={props.onClick}
    >
      {/* 项目符号：一粒墨点；激活时外面再套一圈墨，点换成朱砂 */}
      {showMarker ? <span className="m-list-item__marker" aria-hidden="true" /> : null}
      <span className="m-list-item__inner">{children}</span>
    </li>
  );
}
