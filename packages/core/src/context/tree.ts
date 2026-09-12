/**
 * 树的上下文形状：MTree 放出去、TreeNode 递归着读。
 *
 * 为什么字段一律是"纯值"而不是 Ref / 取值函数：
 * 原来这份上下文写的是 `checkable: Ref<boolean>`、`isExpanded: (key) => boolean`，
 * 那是 Vue 响应式的产物 —— 父组件在自己的模板里读时才建立依赖。
 * React 里 getter 不会触发重渲染，同一个函数对象读到新值也没人知道，直接搬过去会静默失效。
 * 所以这里全部换成不可变快照：展开集合、勾选态表都是纯派生出来的值，
 * 内容变了就换一个新的 Set / Map，两个框架各自按自己的方式重渲染。
 *
 * 剩下的函数字段都是"动作"（点了、按了键），不参与派生，两边都只在事件里调。
 */
import type { TreeKey, TreeLabelScope, TreeNode } from "../components/tree/types";

export interface TreeCheckState {
  /** 自己勾上了 */
  readonly checked: boolean;
  /** 子孙里勾了一部分 */
  readonly indeterminate: boolean;
}

/** 表里查不到的节点一律按"没勾"算；引用恒定，省得每次渲染都造一个新对象 */
export const TREE_UNCHECKED: TreeCheckState = { checked: false, indeterminate: false };

/**
 * Label 是"渲染出来的东西"的类型：Vue 传 VNodeChild，React 传 ReactNode。
 * core 不认识这两种类型，所以留成泛型参数，默认 unknown。
 */
export interface TreeContextValue<Label = unknown> {
  /** 显示勾选框 */
  readonly checkable: boolean;
  /** 当前选中的节点 key */
  readonly selectedKey: TreeKey | undefined;
  /** 展开的 key（纯值：变了就是一个新的 Set） */
  readonly expanded: ReadonlySet<TreeKey>;
  /** 每个节点的勾选态，由 checkedKeys 纯派生出来 */
  readonly checkStates: ReadonlyMap<TreeKey, TreeCheckState>;
  /** 点箭头 */
  toggleExpand(node: TreeNode): void;
  /** 勾选框变了 */
  setChecked(node: TreeNode, checked: boolean): void;
  /** 点节点行 */
  select(node: TreeNode, event: MouseEvent | KeyboardEvent): void;
  /**
   * 行上按了键；要不要 preventDefault 由这里面决定。
   *
   * `selfTarget` = 事件是不是落在行本身（而不是行里的勾选框）。
   * 为什么不在这里自己算：React 的合成事件转成原生事件后，`currentTarget` 指的是
   * React 挂监听的那个根容器，不是行元素，算出来永远是 false。只能由壳在合成事件上算好传进来。
   */
  keydown(node: TreeNode, event: KeyboardEvent, selfTarget: boolean): void;
  /** 节点行挂载 / 卸载时登记，方向键靠它移焦点 */
  registerRow(key: TreeKey, el: HTMLElement | null): void;
  /** 节点文字：用户给了自定义渲染就走它，否则直出 label */
  renderLabel(scope: TreeLabelScope): Label;
}

/** 两个壳的报错文案保持一致 */
export const TREE_CONTEXT_ERROR = "TreeNode 只能放在 MTree 里用";
