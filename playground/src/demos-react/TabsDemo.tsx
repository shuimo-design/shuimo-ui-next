import { useState } from "react";
import {
  MButton,
  MTabPane,
  MTabs,
  type ReactTabPane,
  type TabName,
  type TabsPosition,
} from "@shuimo-design/react";

const POSITIONS: TabsPosition[] = ["top", "bottom", "left", "right"];

/** 新写法：页就是一个数组，顺序即标签顺序 */
const BASIC: ReactTabPane[] = [
  { name: "shan", label: "山", content: <p style={{ margin: 0 }}>远山如黛，近水含烟。</p> },
  { name: "shui", label: "水", content: <p style={{ margin: 0 }}>流水不腐，户枢不蠹。</p> },
  { name: "yun", label: "云", disabled: true, content: "看不到。" },
  { name: "yue", label: "月", content: <p style={{ margin: 0 }}>月上柳梢头，人约黄昏后。</p> },
];

export default function TabsDemo() {
  const [active, setActive] = useState<TabName>("shan");
  const [log, setLog] = useState("还没切过");
  const [position, setPosition] = useState<TabsPosition>("top");

  const [seq, setSeq] = useState(3);
  const [editable, setEditable] = useState<ReactTabPane[]>([
    { name: "t1", label: "第一页", content: "白日依山尽" },
    { name: "t2", label: "第二页", content: "黄河入海流" },
    { name: "t3", label: "第三页", content: "欲穷千里目" },
  ]);
  const [editableActive, setEditableActive] = useState<TabName>("t1");

  return (
    <div className="demo">
      <p className="demo__caption">
        基础用法（panes 数组）：标签是手写体，导航条下一条笔触线，激活项压一横朱笔
      </p>
      <MTabs
        value={active}
        onValueChange={setActive}
        onChange={(name) => setLog(`切到了 ${String(name)}`)}
        panes={BASIC}
      />
      <p className="demo__hint">
        {log}（当前 {String(active)}）。方向键左右切换，Home / End 跳到两头
      </p>

      <p className="demo__caption">
        语法糖：用 MTabPane 子组件写也行（MTabs 在渲染期按书写顺序读它们的 props，
        这些子组件本身永远返回 null）。card 型：每个标签一条宣纸签条
      </p>
      <MTabs type="card">
        <MTabPane name="a" label="春">
          <p style={{ margin: 0 }}>春眠不觉晓，处处闻啼鸟。</p>
        </MTabPane>
        <MTabPane name="b" label="夏">
          <p style={{ margin: 0 }}>接天莲叶无穷碧，映日荷花别样红。</p>
        </MTabPane>
        <MTabPane name="c" label="秋">
          <p style={{ margin: 0 }}>停车坐爱枫林晚，霜叶红于二月花。</p>
        </MTabPane>
      </MTabs>

      <p className="demo__caption">位置：{position}</p>
      <div className="demo__row">
        {POSITIONS.map((p) => (
          <MButton key={p} onClick={() => setPosition(p)}>
            {p}
          </MButton>
        ))}
      </div>
      <div className="demo__block">
        <MTabs
          position={position}
          panes={[
            { name: "a", label: "第一", content: "line 型换位置，笔触线跟着换到对应那一边。" },
            { name: "b", label: "第二", content: "第二页。" },
            { name: "c", label: "第三", content: "第三页。" },
          ]}
        />
        <MTabs
          type="card"
          position={position}
          panes={[
            {
              name: "a",
              label: "甲",
              content: "card 型换位置，签条从对应那一边插进来，朝内容区那面不画框线。",
            },
            { name: "b", label: "乙", content: "乙。" },
          ]}
        />
      </div>

      <p className="demo__caption">
        可关闭 + extra：关闭只发 onTabRemove，增删由使用方改数组；删掉当前页会自动落到邻居
      </p>
      <MTabs
        type="card"
        closable
        value={editableActive}
        onValueChange={setEditableActive}
        panes={editable}
        onTabRemove={(name) => setEditable((list) => list.filter((t) => t.name !== name))}
        extra={
          <MButton
            type="text"
            onClick={() => {
              const next = seq + 1;
              setSeq(next);
              const name = `t${next}`;
              setEditable((list) => [
                ...list,
                { name, label: `第 ${next} 页`, content: `新开的第 ${next} 页` },
              ]);
              setEditableActive(name);
            }}
          >
            新增一页
          </MButton>
        }
      />

      <p className="demo__caption">stretch：标签平分宽度</p>
      <MTabs
        stretch
        panes={[
          { name: "a", label: "东", content: "东。" },
          { name: "b", label: "南", content: "南。" },
          { name: "c", label: "西", content: "西。" },
          { name: "d", label: "北", content: "北。" },
        ]}
      />

      <p className="demo__caption">labelNode + lazy：懒的那页首次激活才渲染</p>
      <MTabs
        panes={[
          {
            name: "a",
            labelNode: (
              <span>
                常驻 <small style={{ color: "var(--m-fg-muted)" }}>立即渲染</small>
              </span>
            ),
            content: <p style={{ margin: 0 }}>一直在。</p>,
          },
          {
            name: "b",
            lazy: true,
            labelNode: (
              <span>
                懒加载 <small style={{ color: "var(--m-fg-muted)" }}>切到才渲染</small>
              </span>
            ),
            content: <p style={{ margin: 0 }}>现在才挂上来。</p>,
          },
        ]}
      />

      <p className="demo__caption">整组禁用</p>
      <MTabs
        disabled
        panes={[
          { name: "a", label: "不能点", content: "全部禁用。" },
          { name: "b", label: "也不能点", content: "看不到。" },
        ]}
      />
    </div>
  );
}
