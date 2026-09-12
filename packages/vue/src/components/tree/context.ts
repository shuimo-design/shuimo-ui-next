/**
 * 树上下文的 Vue 容器。形状（字段、默认值、纯派生）在 core 的 context/tree.ts，
 * 这里只负责"怎么传下去"：InjectionKey + provide / inject。
 *
 * 注意 MTree 放出去的那个对象里，值字段是 **getter**（`get expanded() { ... }`）：
 * Vue 的响应式要在子组件读的那一刻才建立依赖，读一个存好的普通值是追不到更新的。
 * React 那边正相反 —— getter 不触发重渲染，所以它每次渲染现造一个带当前值的对象。
 * 这正是"上下文形状放 core、容器各写一份"的原因。
 */
import { inject, type InjectionKey, type VNodeChild } from "vue";
import { TREE_CONTEXT_ERROR, type TreeContextValue } from "@shuimo-design/core";

export type TreeContext = TreeContextValue<VNodeChild>;

export const treeKey: InjectionKey<TreeContext> = Symbol("m-tree");

/** 取树上下文；不在 MTree 里直接报错，比每处判空清楚 */
export function useTreeContext(): TreeContext {
  const tree = inject(treeKey);
  if (!tree) throw new Error(TREE_CONTEXT_ERROR);
  return tree;
}
