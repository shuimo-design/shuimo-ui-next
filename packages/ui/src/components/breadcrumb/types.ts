export interface BreadcrumbProps {
  /** 自定义分隔符文字；不传就画一笔斜杠。separator 插槽优先 */
  separator?: string;
  /** 用数据渲染子项；给了就忽略默认插槽 */
  options?: BreadcrumbItemProps[];
}

export interface BreadcrumbSlots {
  /** 放 MBreadcrumbItem */
  default?: () => unknown;
  /** 自定义分隔符内容 */
  separator?: () => unknown;
}

export interface BreadcrumbItemProps {
  /** 文字；默认插槽优先 */
  content?: string;
  /** 给了就渲染成 <a href> 链接 */
  href?: string;
}

export interface BreadcrumbItemSlots {
  /** 项内容，替代 content */
  default?: () => unknown;
}
