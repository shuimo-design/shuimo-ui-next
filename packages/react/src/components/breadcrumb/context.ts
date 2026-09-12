import { createContext, type ReactNode } from "react";
import type { BreadcrumbContextValue } from "@shuimo-design/core";

export interface BreadcrumbReactContext extends BreadcrumbContextValue {
  /** 自定义分隔符节点。节点是框架概念，core 的形状里没有它（Vue 那边对应 separator 插槽） */
  readonly separatorNode?: ReactNode;
}

/**
 * 上下文的形状在 core，这里只管 React 这一侧的容器。
 * 默认 undefined：单独用 MBreadcrumbItem 时要能认出来，落回默认分隔符。
 */
export const BreadcrumbContext = createContext<BreadcrumbReactContext | undefined>(undefined);
