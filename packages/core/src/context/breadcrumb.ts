/**
 * 面包屑上下文的形状：MBreadcrumb 把分隔符的配置发给每个 MBreadcrumbItem。
 *
 * 这里只有纯值。"自定义分隔符内容"是节点，节点是框架概念（Vue 是插槽函数、React 是 ReactNode），
 * core 认不了，所以由两个壳各自在这个形状上补一个字段；
 * 但"到底该画哪种分隔符"这个判断留在 core，两个壳才不会各判一套。
 */

export interface BreadcrumbContextValue {
  /** 自定义分隔符文字；不传就画一笔斜杠 */
  readonly separator?: string;
}

export const BREADCRUMB_CONTEXT_DEFAULT: BreadcrumbContextValue = {};

/** 分隔符长什么样：自定义节点 > 文字 > 一笔斜杠 */
export type BreadcrumbSeparatorKind = "custom" | "text" | "slash";

/**
 * `custom` 由壳判断（有没有给分隔符节点），其余的判断在这里做。
 * 空串当成没给：`separator=""` 画不出东西，落回斜杠比留个空位好看。
 */
export function breadcrumbSeparatorKind(o: {
  custom: boolean;
  context: BreadcrumbContextValue | undefined;
}): BreadcrumbSeparatorKind {
  if (o.custom) return "custom";
  return o.context?.separator ? "text" : "slash";
}
