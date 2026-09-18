import type { ReactNode } from "react";
import type { CarouselItemProps } from "@shuimo-design/core";

export interface MCarouselItemProps extends CarouselItemProps {
  /** 这一张的内容，优先于 src（对应 Vue 的默认插槽） */
  children?: ReactNode;
}

/**
 * 标记组件：自己一个节点都不渲染，永远返回 null。
 *
 * MCarousel 在**渲染期**用 `Children.toArray` 按书写顺序读这里的 props，拼成和 `items` 属性
 * 一模一样的配置数组 —— 不等挂载、不碰 DOM，所以服务端渲染的顺序就是对的。
 * 等价的写法是给 MCarousel 传 `items`。
 */
export function MCarouselItem(_props: MCarouselItemProps): null {
  return null;
}
