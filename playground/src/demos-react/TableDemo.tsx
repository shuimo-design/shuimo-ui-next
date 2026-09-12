import { useState } from "react";
import { MButton, MTable, MTableColumn, type ReactTableColumn } from "@shuimo-design/react";

interface Term {
  id: number;
  name: string;
}

const DATA: Term[] = [
  { id: 1, name: "立春" },
  { id: 2, name: "雨水" },
  { id: 3, name: "惊蛰" },
  { id: 4, name: "春分" },
  { id: 5, name: "清明" },
  { id: 6, name: "谷雨" },
  {
    id: 7,
    name: "立夏、小满、芒种、夏至、小暑、大暑、立秋、处暑、白露、秋分、寒露、霜降、立冬、小雪、大雪、冬至、小寒、大寒",
  },
];

export default function TableDemo() {
  const [clicked, setClicked] = useState("");
  const [stripe, setStripe] = useState(true);

  /** 列就是一个数组，顺序即列序；自定义单元格挂在列上的 render，和 Vue 那边同一个签名 */
  const columns: ReactTableColumn<Term>[] = [
    { prop: "id", label: "序号", width: 80 },
    {
      prop: "name",
      label: "节气",
      align: "left",
      renderHead: () => "节气（自定义表头）",
      render: ({ row, index }) =>
        `这里是 ${row.name} 的 render，id 为 ${row.id}，index 为 ${index}`,
    },
    {
      prop: "option",
      label: "操作",
      width: 120,
      render: ({ row }) => (
        <MButton type="text" onClick={() => setClicked(row.name)}>
          查看
        </MButton>
      ),
    },
  ];

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">
          用 columns 数组声明列（推荐）：顺序就是列序，服务端也算得出来；自定义单元格用列上的 render
        </p>
        <div className="demo__row">
          <MButton onClick={() => setStripe(!stripe)}>斑马纹：{stripe ? "开" : "关"}</MButton>
        </div>
        <MTable<Term>
          data={DATA.slice(0, 4)}
          columns={columns}
          stripe={stripe}
          rowKey="id"
          onRowClick={(row) => setClicked(row.name)}
        />
        <p className="demo__hint">onRowClick：{clicked || "点一行试试"}</p>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          语法糖：用 MTableColumn 子组件声明列也行（MTable 在渲染期按书写顺序读它们的 props，
          这些子组件本身永远返回 null）；height 限高后表体内滚动、表头吸顶
        </p>
        <MTable<Term> data={DATA} height="260px" onRowClick={(row) => setClicked(row.name)}>
          <MTableColumn<Term> width={80} prop="id" label="序号" />
          <MTableColumn<Term> prop="name" label="节气" />
          <MTableColumn<Term>
            prop="option"
            label="操作"
            width={120}
            render={({ row }) => (
              <MButton
                onClick={(event) => {
                  event.stopPropagation();
                  setClicked(`操作 ${row.name}`);
                }}
              >
                操作
              </MButton>
            )}
          />
        </MTable>
      </div>

      <div className="demo__block">
        <p className="demo__caption">对齐：整表 align="left"，单列自己覆盖为 right</p>
        <MTable<Term>
          data={DATA.slice(0, 3)}
          align="left"
          columns={[
            { prop: "id", label: "序号", width: 80, align: "right" },
            { prop: "name", label: "节气" },
          ]}
        />
      </div>

      <div className="demo__block">
        <p className="demo__caption">无内容</p>
        <MTable columns={[{ prop: "name", label: "参数" }]} />
      </div>

      <div className="demo__block">
        <p className="demo__caption">自定义空内容</p>
        <MTable columns={[{ prop: "name", label: "参数" }]} empty="千山鸟飞绝，万径人踪灭。" />
      </div>
    </div>
  );
}
