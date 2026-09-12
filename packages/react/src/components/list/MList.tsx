import { useMemo, type CSSProperties, type ReactNode } from "react";
import {
  listInk,
  listItemActive,
  listItemText,
  type ListContextValue,
  type ListItemScope,
  type ListProps as CoreListProps,
} from "@shuimo-design/core";
import { useMounted } from "../../runtime";
import { ListContext } from "./context";
import { MListItem } from "./MListItem";

export interface MListProps<T> extends CoreListProps<T> {
  /**
   * 传了 data 就给一个渲染函数，按项调用（对应 Vue 的作用域插槽）；
   * 没传 data 时直接放 MListItem。
   */
  children?: ReactNode | ((scope: ListItemScope<T>) => ReactNode);
  className?: string;
  style?: CSSProperties;
}

export function MList<T>(props: MListProps<T>) {
  const { data, marker = true, autoActive = false, children } = props;
  // 上下文只装纯值；内容没变就不换引用，免得每次渲染把所有子项叫醒
  const context = useMemo<ListContextValue>(() => ({ marker }), [marker]);

  /**
   * 两团墨走素材登记，登记要往样式表插规则、服务端没有：
   * 首帧一律内联（registered=false），挂载后才升级成 data 属性，否则水合会报属性不匹配。
   */
  const mounted = useMounted();
  const ink = listInk(mounted);

  // children 一物两用：传了 data 时是渲染函数，没传 data 时是现成的节点
  const renderItem = typeof children === "function" ? children : undefined;
  const nodes = typeof children === "function" ? undefined : children;

  return (
    <ListContext.Provider value={context}>
      <ul
        className={["m-list", props.className].filter(Boolean).join(" ")}
        style={{ ...ink.style, ...props.style } as CSSProperties}
        {...ink.attrs}
      >
        {data
          ? data.map((item, index) => (
              <MListItem key={index} active={listItemActive(item, autoActive)}>
                {renderItem ? renderItem({ item, index }) : listItemText(item)}
              </MListItem>
            ))
          : // 没有 data 时子节点不带作用域（使用者自己放 MListItem，不会去读 item），
            // 和 Vue 那边用空对象顶上的写法对齐
            (renderItem?.({} as ListItemScope<T>) ?? nodes)}
      </ul>
    </ListContext.Provider>
  );
}
