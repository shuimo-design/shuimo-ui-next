export type TreeKey = string | number;

export interface TreeNodeData {
  /** 节点唯一标识 */
  key?: TreeKey;
  /** 节点文字 */
  label?: string;
  /** 子节点 */
  children?: TreeNodeData[];
  /** 禁用：不能选中 / 勾选，仍可展开 */
  disabled?: boolean;
  /** 初始是否展开（旧版数据里的 expand 字段）；之后由 v-model:expandedKeys 接管 */
  expand?: boolean;
  /** 用 fieldNames 映射时，实际字段名任意 */
  [field: string]: unknown;
}

export interface TreeFieldNames {
  /** 取 key 的字段名，默认 "key" */
  key?: string;
  /** 取文字的字段名，默认 "label" */
  label?: string;
  /** 取子节点的字段名，默认 "children" */
  children?: string;
  /** 取禁用态的字段名，默认 "disabled" */
  disabled?: string;
  /** 取初始展开态的字段名，默认 "expand" */
  expand?: string;
}

/** 组件内部整理过的节点，事件和插槽里拿到的都是它 */
export interface TreeNode {
  key: TreeKey;
  label: string;
  disabled: boolean;
  /** 层级，根为 0 */
  level: number;
  children: TreeNode[];
  parent: TreeNode | undefined;
  /** 原始数据 */
  data: TreeNodeData;
}

export interface TreeLabelScope {
  node: TreeNode;
  level: number;
}

export interface TreeProps {
  /** 树数据 */
  data: TreeNodeData[];
  /** 字段名映射 */
  fieldNames?: TreeFieldNames;
  /** 显示勾选框 */
  checkable?: boolean;
  /** 勾选时父子不联动（各自独立） */
  checkStrictly?: boolean;
  /** 初始展开全部 */
  defaultExpandAll?: boolean;
  /** 点击节点文字可选中 */
  selectable?: boolean;
}

export interface TreeEmits {
  /** 点击节点行（禁用节点不触发）；键盘回车 / 空格也算 */
  nodeClick: [node: TreeNode, event: MouseEvent | KeyboardEvent];
  /** 勾选态变化，带上变化后的全部已勾选 key */
  check: [node: TreeNode, checkedKeys: TreeKey[]];
  /** 展开 / 收起 */
  expand: [node: TreeNode, expanded: boolean];
}

export interface TreeSlots {
  /** 自定义节点文字，作用域 { node, level } */
  default?: (scope: TreeLabelScope) => unknown;
}
