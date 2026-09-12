/**
 * 列表的无框架部分：项目符号的两团墨、class 派生、以及"数据项 → 激活态 / 兜底文字"的纯计算。
 * Vue 和 React 的列表各自只剩模板和上下文容器，这里的东西两边一字不差地共用。
 */
import { inkBlobUrl } from "../../ink/assets/blob";
import { inkVarBindings, type InkVarBindings } from "../../ink/registry";

export type {
  ListItemEmits,
  ListItemProps,
  ListItemScope,
  ListItemSlots,
  ListProps,
  ListSlots,
} from "./types";
export { LIST_CONTEXT_DEFAULT, resolveListMarker, type ListContextValue } from "../../context/list";

/**
 * 项目符号的两团墨：外圈和内点各用一个种子，毛边才不会一模一样。
 * 旧版是一张 34×34 的墨圈精灵图，这里改用素材库按种子生成，写成 CSS 变量给 m.ink 层当遮罩。
 * 两团都是固定素材（不随 props 变），整个模块只生成一次。
 */
const RING = inkBlobUrl({ seed: 3, raggedness: 0.2 });
const DOT = inkBlobUrl({ seed: 7, raggedness: 0.16 });

/**
 * 两团墨走素材登记：样式表里只写一次，列表元素上只挂一个短属性。
 *
 * `registered` 服务端和水合首帧必须传 false（退回内联 style），挂载后才传 true 升级成属性 ——
 * 服务端没有 document，登记拿不到样式表，两边输出对不上水合就会报属性不匹配。
 */
export function listInk(registered: boolean): InkVarBindings {
  return inkVarBindings({ "--m-list-blob-ring": RING, "--m-list-blob-dot": DOT }, registered);
}

/** 类名顺序要和 Vue 模板里"静态 class 在前、动态 class 在后"的产物一致，两个壳才一字不差 */
export function listItemClasses(o: { active: boolean; marker: boolean }): string[] {
  return [
    "m-list-item",
    ...(o.active ? ["m-list-item--active"] : []),
    ...(o.marker ? ["m-list-item--marker"] : []),
  ];
}

/** 数据项是对象且自带 boolean 的 active 时听它的，否则看 autoActive（旧版 `d.active ?? autoActive`） */
export function listItemActive<T>(item: T, autoActive: boolean): boolean {
  if (typeof item === "object" && item !== null && "active" in item) {
    const own = (item as { active?: unknown }).active;
    if (typeof own === "boolean") return own;
  }
  return autoActive;
}

/** 没给渲染内容时的兜底文字：基础类型直出，对象转 JSON */
export function listItemText<T>(item: T): string {
  return typeof item === "object" && item !== null ? JSON.stringify(item) : String(item);
}
