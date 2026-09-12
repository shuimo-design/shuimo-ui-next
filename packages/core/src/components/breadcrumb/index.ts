/**
 * 面包屑的无框架部分：无障碍名称、那一笔斜杠的素材、以及分隔符选哪种的判断。
 */
import { inkMarkUrl } from "../../ink/assets/mark";

export type {
  BreadcrumbItemProps,
  BreadcrumbItemSlots,
  BreadcrumbProps,
  BreadcrumbSlots,
} from "./types";
export {
  BREADCRUMB_CONTEXT_DEFAULT,
  breadcrumbSeparatorKind,
  type BreadcrumbContextValue,
  type BreadcrumbSeparatorKind,
} from "../../context/breadcrumb";

/** 导航的无障碍名称，两个壳必须一致 */
export const BREADCRUMB_LABEL = "面包屑";

/** 分隔符那一笔斜杠是固定素材，整个模块只生成一次 */
const SLASH = inkMarkUrl("slash", { seed: 2, strokeWidth: 2.2 });

/** 斜杠交给 m.ink 层当遮罩；子项不 Teleport，变量声明在根上就够了 */
export function breadcrumbStyle(): Record<string, string> {
  return { "--m-breadcrumb-slash": `url("${SLASH}")` };
}
