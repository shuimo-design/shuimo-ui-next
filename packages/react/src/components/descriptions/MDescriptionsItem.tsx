import type { ReactNode } from "react";
import type { DescriptionsItemProps } from "@shuimo-design/core";

export interface MDescriptionsItemProps extends DescriptionsItemProps {
  /** 值，优先于 value（对应 Vue 的默认插槽） */
  children?: ReactNode;
  /** 标签，优先于 label（对应 Vue 的 label 插槽） */
  labelNode?: ReactNode;
}

/**
 * 标记组件：自己一个节点都不渲染，永远返回 null。
 *
 * MDescriptions 在**渲染期**用 `Children.toArray` 按书写顺序读这里的 props，拼成和 `items`
 * 属性一模一样的配置数组 —— 不等挂载、不碰 DOM，所以服务端渲染的顺序就是对的。
 * 等价的写法是给 MDescriptions 传 `items`。
 */
export function MDescriptionsItem(_props: MDescriptionsItemProps): null {
  return null;
}
