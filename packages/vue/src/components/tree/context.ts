import type { InjectionKey, Ref, VNodeChild } from "vue";
import type { TreeKey, TreeLabelScope, TreeNode } from "./types";

export interface TreeCheckState {
  checked: boolean;
  indeterminate: boolean;
}

export interface TreeContext {
  checkable: Ref<boolean>;
  selectedKey: Ref<TreeKey | undefined>;
  isExpanded: (key: TreeKey) => boolean;
  checkState: (key: TreeKey) => TreeCheckState;
  toggleExpand: (node: TreeNode) => void;
  setChecked: (node: TreeNode, checked: boolean) => void;
  select: (node: TreeNode, event: MouseEvent | KeyboardEvent) => void;
  onKeydown: (node: TreeNode, event: KeyboardEvent) => void;
  /** 节点行挂载 / 卸载时登记，方向键靠它移焦点 */
  registerRow: (key: TreeKey, el: HTMLElement | null) => void;
  /** 节点文字：有默认插槽走插槽，否则直出 label */
  renderLabel: (scope: TreeLabelScope) => VNodeChild;
}

export const treeKey: InjectionKey<TreeContext> = Symbol("m-tree");
