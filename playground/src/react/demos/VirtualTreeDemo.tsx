import { useRef, useState } from "react";
import {
  MButton,
  MInputNumber,
  MVirtualTree,
  type TreeKey,
  type TreeNodeData,
  type VirtualTreeExpose,
} from "@shuimo-design/react";

/** 120 个根 × 各 2 枝 × 各 3 叶，全部展开 840 行，不虚拟化会一次全渲染 */
const DATA: TreeNodeData[] = Array.from({ length: 120 }, (_, i) => ({
  key: `root-${i}`,
  label: `山 ${i}`,
  children: Array.from({ length: 2 }, (_, j) => ({
    key: `branch-${i}-${j}`,
    label: `岭 ${i}-${j}`,
    children: Array.from({ length: 3 }, (_, k) => ({
      key: `leaf-${i}-${j}-${k}`,
      label: `石 ${i}-${j}-${k}`,
    })),
  })),
}));

export default function VirtualTreeDemo() {
  const [expanded, setExpanded] = useState<TreeKey[]>([]);
  const [checked, setChecked] = useState<TreeKey[]>([]);
  const [selected, setSelected] = useState<TreeKey | undefined>(undefined);
  const [target, setTarget] = useState(80);
  const tree = useRef<VirtualTreeExpose>(null);

  function jump() {
    const i = Math.floor(target / 6);
    const j = Math.floor((target % 6) / 3);
    const k = target % 3;
    tree.current?.scrollToKey(`leaf-${i}-${j}-${k}`, "center");
  }

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">
          840 行全部展开也只渲染可视区附近：展开 / 勾选联动 / 键盘（含 Home、End
          这种要跨窗口跳的）都和 MTree 一个口径
        </p>
        <MVirtualTree
          ref={tree}
          data={DATA}
          itemHeight={32}
          height={280}
          checkable
          defaultExpandAll
          expandedKeys={expanded}
          checkedKeys={checked}
          selectedKey={selected}
          onExpandedKeysChange={setExpanded}
          onCheckedKeysChange={setChecked}
          onSelectedKeyChange={setSelected}
        />
        <div className="demo__row">
          <MInputNumber value={target} min={0} max={839} onValueChange={(v) => setTarget(v ?? 0)} />
          <MButton onClick={jump}>滚到第 {target} 行的节点</MButton>
          <MButton onClick={() => tree.current?.scrollTo(0)}>回顶</MButton>
        </div>
      </div>
    </div>
  );
}
