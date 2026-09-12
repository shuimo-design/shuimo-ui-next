import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  buildTreeNodes,
  collectInitialExpanded,
  computeTreeCheckStates,
  createTreeRows,
  mergeTreeKeys,
  nextCheckedKeys,
  resolveTreeFields,
  toggleTreeKey,
  treeInkStyle,
  treeKeyAction,
  type TreeKey,
  type TreeLabelScope,
  type TreeNode as TreeNodeType,
  type TreeProps as CoreTreeProps,
} from "@shuimo-design/core";
import { TreeContextObject, type TreeContext } from "./context";
import { TreeNode } from "./TreeNode";

export interface MTreeProps extends CoreTreeProps {
  /** 受控的选中项；不传就由组件自己记（配合 defaultSelectedKey） */
  selectedKey?: TreeKey;
  defaultSelectedKey?: TreeKey;
  onSelectedKeyChange?: (key: TreeKey | undefined) => void;
  /** 受控的勾选项 */
  checkedKeys?: TreeKey[];
  defaultCheckedKeys?: TreeKey[];
  onCheckedKeysChange?: (keys: TreeKey[]) => void;
  /** 受控的展开项 */
  expandedKeys?: TreeKey[];
  defaultExpandedKeys?: TreeKey[];
  onExpandedKeysChange?: (keys: TreeKey[]) => void;
  /** 点击节点行（禁用节点不触发）；键盘回车 / 空格也算 */
  onNodeClick?: (node: TreeNodeType, event: MouseEvent | KeyboardEvent) => void;
  /** 勾选态变化，带上变化后的全部已勾选 key */
  onCheck?: (node: TreeNodeType, checkedKeys: TreeKey[]) => void;
  /** 展开 / 收起 */
  onExpand?: (node: TreeNodeType, expanded: boolean) => void;
  /** 自定义节点文字，对应 Vue 的默认插槽（作用域 { node, level }） */
  renderLabel?: (scope: TreeLabelScope) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MTree(props: MTreeProps) {
  const {
    data,
    fieldNames,
    checkable = false,
    checkStrictly = false,
    defaultExpandAll = false,
    selectable = true,
  } = props;

  const fields = useMemo(() => resolveTreeFields(fieldNames), [fieldNames]);
  // 一次性建出带 parent / level 的完整树：勾选联动和方向键都遍历它，不靠上下文逐层冒泡
  const nodes = useMemo(() => buildTreeNodes(data, fields), [data, fields]);

  /* ---------- 三个双向绑定，受控 / 非受控都支持 ---------- */

  // 初始展开（defaultExpandAll 或数据里标了 expand 的）只在建起来时算一次，之后完全由绑定值说了算，
  // 和 Vue 那边在 setup 里算一次是同一个时机
  const initialExpanded = useRef<TreeKey[] | undefined>(undefined);
  initialExpanded.current ??= collectInitialExpanded(nodes, fields, defaultExpandAll);

  const expandedControlled = props.expandedKeys !== undefined;
  const [ownExpanded, setOwnExpanded] = useState<TreeKey[]>(() =>
    mergeTreeKeys(props.defaultExpandedKeys ?? [], initialExpanded.current ?? []),
  );
  const expandedKeys = props.expandedKeys ?? ownExpanded;

  const checkedControlled = props.checkedKeys !== undefined;
  const [ownChecked, setOwnChecked] = useState<TreeKey[]>(props.defaultCheckedKeys ?? []);
  const checkedKeys = props.checkedKeys ?? ownChecked;

  // selectedKey 用 in 判受控：undefined 是"没选中"这个合法值，用 !== undefined 判会把受控的空值错当成非受控
  const selectedControlled = "selectedKey" in props;
  const [ownSelected, setOwnSelected] = useState<TreeKey | undefined>(props.defaultSelectedKey);
  const selectedKey = selectedControlled ? props.selectedKey : ownSelected;

  function setExpandedKeys(next: TreeKey[]) {
    if (!expandedControlled) setOwnExpanded(next);
    props.onExpandedKeysChange?.(next);
  }
  function setCheckedKeys(next: TreeKey[]) {
    if (!checkedControlled) setOwnChecked(next);
    props.onCheckedKeysChange?.(next);
  }
  function setSelectedKey(next: TreeKey) {
    if (!selectedControlled) setOwnSelected(next);
    props.onSelectedKeyChange?.(next);
  }

  /**
   * 自动展开出来的那几个 key 要让外面知道（Vue 那边是 setup 里写一次 v-model）：
   * 非受控时初值里已经带上了，只补一声通知；受控时得把合并后的值写回去。
   * ref 拦着只做一次，StrictMode 跑两轮也不会重复。
   */
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const initial = initialExpanded.current ?? [];
    if (initial.length === 0) return;
    const merged = mergeTreeKeys(expandedKeys, initial);
    if (!expandedControlled && merged === expandedKeys) props.onExpandedKeysChange?.(expandedKeys);
    else setExpandedKeys(merged);
  });

  const expanded = useMemo(() => new Set(expandedKeys), [expandedKeys]);
  const checkStates = useMemo(
    () => computeTreeCheckStates(nodes, checkedKeys, checkStrictly),
    [nodes, checkedKeys, checkStrictly],
  );

  // 方向键要把焦点挪到另一行上，得拿着行元素：这张表在 core 里，建一次就够
  const rows = useMemo(() => createTreeRows(), []);

  /* ---------- 动作 ---------- */

  function toggleExpand(node: TreeNodeType) {
    if (node.children.length === 0) return;
    setExpandedKeys(toggleTreeKey(expandedKeys, node.key));
    props.onExpand?.(node, !expanded.has(node.key));
  }

  function setChecked(node: TreeNodeType, checked: boolean) {
    const next = nextCheckedKeys({
      node,
      checked,
      checkStrictly,
      checkedKeys,
      states: checkStates,
    });
    setCheckedKeys(next);
    props.onCheck?.(node, next);
  }

  function select(node: TreeNodeType, event: MouseEvent | KeyboardEvent) {
    if (node.disabled) return;
    props.onNodeClick?.(node, event);
    if (selectable) setSelectedKey(node.key);
  }

  function keydown(node: TreeNodeType, event: KeyboardEvent, selfTarget: boolean) {
    const action = treeKeyAction(node, event.key, { nodes, expanded, selfTarget });
    if (action.prevent) event.preventDefault();
    if (action.kind === "focus" && action.key !== undefined) rows.focus(action.key);
    else if (action.kind === "toggle") toggleExpand(node);
    else if (action.kind === "select") select(node, event);
  }

  // 上下文每次渲染现造一份：React 里只有换掉 value 才会让子树重渲染
  const context: TreeContext = {
    checkable,
    selectedKey,
    expanded,
    checkStates,
    toggleExpand,
    setChecked,
    select,
    keydown,
    registerRow: rows.set,
    renderLabel: (scope: TreeLabelScope) =>
      props.renderLabel ? props.renderLabel(scope) : scope.node.label,
  };

  return (
    <div
      className={["m-tree", props.className].filter(Boolean).join(" ")}
      role="tree"
      style={{ ...treeInkStyle(), ...props.style } as CSSProperties}
    >
      <TreeContextObject.Provider value={context}>
        {nodes.map((node) => (
          <TreeNode key={String(node.key)} node={node} />
        ))}
      </TreeContextObject.Provider>
    </div>
  );
}
