import { useCallback, useId, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import {
  treeCheckState,
  treeNodeClasses,
  treeRowClasses,
  TREE_COLLAPSE_LABEL,
  TREE_EXPAND_LABEL,
  type TreeNode as TreeNodeType,
} from "@shuimo-design/core";
import { MCheckbox } from "../checkbox";
import { useTreeContext } from "./context";

/** 递归渲染一个节点。Vue 那边是 SFC 自引用，这边就是函数组件自己调自己 */
export function TreeNode({ node }: { node: TreeNodeType }) {
  const tree = useTreeContext();
  const labelId = useId();

  const hasChildren = node.children.length > 0;
  const expanded = hasChildren && tree.expanded.has(node.key);
  const selected = tree.selectedKey === node.key;
  const check = treeCheckState(tree.checkStates, node.key);

  // registerRow 来自 core 的那张表，身份是稳的；ref 回调只跟着 key 变，不会每次渲染都摘了重挂
  const register = tree.registerRow;
  const rowRef = useCallback(
    (el: HTMLElement | null) => register(node.key, el),
    [register, node.key],
  );

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    // selfTarget 由壳算：core 那边拿不到可靠的 currentTarget（见 core 的 context/tree.ts）
    tree.keydown(node, event.nativeEvent, event.target === event.currentTarget);
  }

  return (
    <div
      className={treeNodeClasses({
        expanded,
        selected,
        disabled: node.disabled,
        leaf: !hasChildren,
      })}
      style={{ "--m-tree-level": node.level } as CSSProperties}
      role="treeitem"
      aria-expanded={hasChildren ? expanded : undefined}
      aria-selected={selected}
      aria-disabled={node.disabled || undefined}
      aria-level={node.level + 1}
      aria-labelledby={labelId}
    >
      <div
        ref={rowRef}
        className={treeRowClasses({ expanded, selected, disabled: node.disabled })}
        tabIndex={0}
        onClick={(event: MouseEvent<HTMLElement>) => tree.select(node, event.nativeEvent)}
        onKeyDown={onKeyDown}
      >
        {hasChildren ? (
          <button
            type="button"
            className="m-tree-row__arrow"
            tabIndex={-1}
            aria-label={expanded ? TREE_COLLAPSE_LABEL : TREE_EXPAND_LABEL}
            onClick={(event: MouseEvent<HTMLElement>) => {
              event.stopPropagation();
              tree.toggleExpand(node);
            }}
          >
            {/* 实心小三角，形状全靠 CSS（m.ink 层换成毛边墨尖遮罩），转向也在它身上 */}
            <span className="m-tree-row__arrow-shape" />
          </button>
        ) : (
          <span className="m-tree-row__arrow m-tree-row__arrow--placeholder" aria-hidden="true" />
        )}
        {tree.checkable ? (
          <MCheckbox
            className="m-tree-row__checkbox"
            checked={check.checked}
            indeterminate={check.indeterminate}
            disabled={node.disabled}
            // 点勾选框不该顺带把整行选中
            onClick={(event: MouseEvent<HTMLLabelElement>) => event.stopPropagation()}
            onCheckedChange={(value) => tree.setChecked(node, value)}
          />
        ) : null}
        <span id={labelId} className="m-tree-row__label">
          {tree.renderLabel({ node, level: node.level })}
        </span>
      </div>
      {hasChildren ? (
        <div className="m-tree-node__children" role="group">
          <div className="m-tree-node__children-inner" inert={!expanded}>
            {node.children.map((child) => (
              <TreeNode key={String(child.key)} node={child} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
