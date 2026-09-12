import { MTable, type ReactTableColumn } from "@shuimo-design/react";
import { apiTables, type NameRow, type PropRow } from "../shared/api";

/**
 * 页底的属性 / 事件 / 内容表。数据和挑列的逻辑都在 ../shared/api.ts，
 * 这里只负责画表格；Vue 版（src/vue/ApiDoc.vue）画的是同样三张表。
 */

const propColumns: ReactTableColumn<PropRow>[] = [
  {
    prop: "name",
    label: "名称",
    width: 180,
    render: ({ row }) => (
      <>
        <code className="api__code">{row.name}</code>
        {row.required ? <span className="api__required">必填</span> : null}
        {/* 受控属性配套的非受控初值和变化回调 */}
        {row.extra ? <span className="api__extra">配套：{row.extra}</span> : null}
      </>
    ),
  },
  {
    prop: "type",
    label: "类型",
    render: ({ row }) => <code className="api__code">{row.type}</code>,
  },
  {
    prop: "default",
    label: "默认值",
    width: 110,
    render: ({ row }) =>
      row.default ? (
        <code className="api__code">{row.default}</code>
      ) : (
        <span className="api__none">—</span>
      ),
  },
  { prop: "description", label: "说明" },
];

const nameColumns: ReactTableColumn<NameRow>[] = [
  {
    prop: "name",
    label: "名称",
    width: 180,
    render: ({ row }) => <code className="api__code">{row.name}</code>,
  },
  { prop: "description", label: "说明" },
];

export default function ApiDoc({ name }: { name: string }) {
  const tables = apiTables(name, "react");
  if (!tables) return null;

  return (
    <section className="api">
      <h3 className="api__title">API</h3>

      {tables.props.length ? (
        <div className="api__block">
          <h4 className="api__sub">属性 Props</h4>
          <MTable data={tables.props} columns={propColumns} align="left" />
        </div>
      ) : null}

      {tables.events.length ? (
        <div className="api__block">
          <h4 className="api__sub">{tables.eventsTitle}</h4>
          <MTable data={tables.events} columns={nameColumns} align="left" />
        </div>
      ) : null}

      {tables.slots.length ? (
        <div className="api__block">
          <h4 className="api__sub">{tables.slotsTitle}</h4>
          <MTable data={tables.slots} columns={nameColumns} align="left" />
        </div>
      ) : null}
    </section>
  );
}
