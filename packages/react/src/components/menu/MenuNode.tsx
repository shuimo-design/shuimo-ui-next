import type { MenuTreeNode } from "@shuimo-design/core";
import { useMenuContext } from "./context";
import { MMenuItem } from "./MMenuItem";

/**
 * 递归渲染 data 整理出来的一层。
 *
 * Vue 那边要用一个函数组件把祖先的 label 插槽在层级里转发下去（插槽只能逐层传），
 * React 直接把 render prop 往下传就行 —— 这是纯框架手法，core 里不表达这件事。
 */
export function MenuNode({ node }: { node: MenuTreeNode }) {
  const menu = useMenuContext();
  return (
    <MMenuItem
      name={node.key}
      label={node.label}
      disabled={node.disabled}
      data={node.data}
      renderLabel={menu.renderLabel}
    >
      {node.children.length > 0
        ? node.children.map((child) => <MenuNode key={String(child.key)} node={child} />)
        : null}
    </MMenuItem>
  );
}
