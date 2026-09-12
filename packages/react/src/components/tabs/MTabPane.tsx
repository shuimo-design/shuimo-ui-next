import type { ReactNode } from "react";
import type { TabName } from "@shuimo-design/core";

export interface MTabPaneProps {
  /** 标签标识，写进 MTabs 的 value；不传则按书写顺序自动生成 */
  name?: TabName;
  /** 标签文字；labelNode 优先 */
  label?: string;
  /** 标签上的富内容，优先于 label */
  labelNode?: ReactNode;
  /** 禁用后不能被选中 */
  disabled?: boolean;
  /** 是否显示关闭按钮；不传则跟随 MTabs */
  closable?: boolean;
  /** 首次激活时才渲染内容，之后切走只是隐藏 */
  lazy?: boolean;
  /** 面板内容 */
  children?: ReactNode;
}

/**
 * 标记组件：自己一个节点都不渲染，永远返回 null。
 *
 * MTabs 在**渲染期**用 `Children.toArray` 按书写顺序读这里的 props，拼成和 `panes` 属性
 * 一模一样的配置数组 —— 不等挂载、不碰 DOM，所以服务端渲染的顺序就是对的。
 * 等价的写法是给 MTabs 传 `panes`。
 */
export function MTabPane(_props: MTabPaneProps): null {
  return null;
}
