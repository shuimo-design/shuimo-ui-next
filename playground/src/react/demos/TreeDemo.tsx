import { useState } from "react";
import { MTree, type TreeKey, type TreeNodeData } from "@shuimo-design/react";

const treeData: TreeNodeData[] = [
  {
    key: "shan",
    label: "山",
    children: [
      { key: "yuan", label: "远山" },
      {
        key: "jin",
        label: "近山",
        children: [
          { key: "song", label: "松" },
          { key: "shi", label: "石" },
        ],
      },
    ],
  },
  {
    key: "shui",
    label: "水",
    children: [
      { key: "jiang", label: "江" },
      { key: "hu", label: "湖", disabled: true },
    ],
  },
  { key: "yun", label: "云" },
];

/** 数据里标 expand 的节点初始就是展开的（旧版写法） */
const expandData: TreeNodeData[] = [
  {
    key: "tang",
    label: "唐",
    expand: true,
    children: [
      { key: "libai", label: "李白" },
      { key: "dufu", label: "杜甫" },
    ],
  },
  { key: "song", label: "宋", children: [{ key: "sushi", label: "苏轼" }] },
];

/** 字段名不叫 key / label / children 时用 fieldNames 映射 */
const customData: TreeNodeData[] = [
  {
    id: 1,
    name: "文房",
    nodes: [
      { id: 2, name: "笔" },
      { id: 3, name: "墨" },
      { id: 4, name: "纸" },
      { id: 5, name: "砚" },
    ],
  },
];

export default function TreeDemo() {
  const [expanded, setExpanded] = useState<TreeKey[]>(["shan"]);
  const [selected, setSelected] = useState<TreeKey | undefined>(undefined);
  const [checked, setChecked] = useState<TreeKey[]>(["yuan"]);
  const [strictChecked, setStrictChecked] = useState<TreeKey[]>([]);

  return (
    <div className="demo">
      <p className="demo__caption">基础用法：点箭头展开，点文字选中</p>
      <MTree
        data={treeData}
        expandedKeys={expanded}
        onExpandedKeysChange={setExpanded}
        selectedKey={selected}
        onSelectedKeyChange={setSelected}
      />
      <p className="demo__hint">
        展开 {expanded.join("、") || "无"} · 选中 {selected ?? "无"}
      </p>

      <p className="demo__caption">勾选框：父子联动，禁用项不跟着变</p>
      <MTree
        data={treeData}
        checkable
        defaultExpandAll
        checkedKeys={checked}
        onCheckedKeysChange={setChecked}
      />
      <p className="demo__hint">勾选 {checked.join("、") || "无"}</p>

      <p className="demo__caption">checkStrictly：父子各自独立</p>
      <MTree
        data={treeData}
        checkable
        checkStrictly
        defaultExpandAll
        checkedKeys={strictChecked}
        onCheckedKeysChange={setStrictChecked}
      />
      <p className="demo__hint">勾选 {strictChecked.join("、") || "无"}</p>

      <p className="demo__caption">数据里带 expand 字段的节点初始展开</p>
      <MTree data={expandData} />

      <p className="demo__caption">fieldNames 映射 + 自定义节点渲染</p>
      <MTree
        data={customData}
        fieldNames={{ key: "id", label: "name", children: "nodes" }}
        defaultExpandAll
        renderLabel={({ node, level }) => (
          <>
            <span>{node.label}</span>
            {level > 0 ? (
              <small style={{ marginLeft: 6, color: "var(--m-fg-muted)" }}>第 {level} 层</small>
            ) : null}
          </>
        )}
      />
    </div>
  );
}
