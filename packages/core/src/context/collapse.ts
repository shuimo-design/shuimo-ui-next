/**
 * 折叠面板传给子项的上下文：形状 + 纯派生。字段为什么一律是纯值，见 context/checkbox.ts 的说明。
 *
 * 展开项在对外的 v-model 上有两种形状（手风琴是单个 name，普通模式是 name 数组，全收起是 undefined），
 * 但子项只关心"我是不是展开的"，所以上下文里统一成一个数组，形状转换在下面的纯函数里做。
 */
import type { CollapseName } from "../components/collapse/types";

/** 对外那个 v-model 的取值：手风琴是单个 name，普通模式是数组，全收起是 undefined */
export type CollapseModel = CollapseName | CollapseName[] | undefined;

export interface CollapseContextValue {
  /** 当前展开的项，统一成数组 */
  readonly active: readonly CollapseName[];
  /** 标题右侧默认画不画笔触线；子项可以用自己的 divider 覆盖 */
  readonly divider: boolean;
  /** 整组禁用 */
  readonly disabled: boolean;
  /** 子项请求展开 / 收起自己。改值、发事件由容器自己做 */
  readonly toggle: (name: CollapseName) => void;
}

/** 把两种形状的 v-model 统一成数组读 */
export function collapseActiveNames(model: CollapseModel): CollapseName[] {
  if (model === undefined) return [];
  return Array.isArray(model) ? [...model] : [model];
}

export function collapseIsActive(active: readonly CollapseName[], name: CollapseName): boolean {
  return active.includes(name);
}

/**
 * 点了某一项之后 v-model 的新值。纯函数：
 * 手风琴下点开一项就顶掉别的（再点一下全收起，所以是 undefined）；
 * 普通模式下在数组里增删。
 */
export function collapseNextModel(
  model: CollapseModel,
  name: CollapseName,
  accordion: boolean,
): CollapseModel {
  const active = collapseActiveNames(model);
  const was = collapseIsActive(active, name);
  if (accordion) return was ? undefined : name;
  return was ? active.filter((n) => n !== name) : [...active, name];
}

/** 子项最终的展开态：在组里就听组的，单独用就听自己的布尔 v-model */
export function collapseItemActive(o: {
  collapse?: CollapseContextValue;
  name: CollapseName;
  own: boolean;
}): boolean {
  return o.collapse ? collapseIsActive(o.collapse.active, o.name) : o.own;
}

/** 画不画标题后那一笔：自己传了就听自己的，否则跟着组，都没有就画 */
export function collapseItemDivider(o: {
  collapse?: CollapseContextValue;
  own?: boolean;
}): boolean {
  return o.own ?? o.collapse?.divider ?? true;
}

/** 子项最终的禁用态：自己禁用或整组禁用 */
export function collapseItemDisabled(o: {
  collapse?: CollapseContextValue;
  own: boolean;
}): boolean {
  return o.own || (o.collapse?.disabled ?? false);
}
