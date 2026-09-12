import { MBreadcrumb, MBreadcrumbItem } from "@shuimo-design/react";

const options = [
  { content: "首页", href: "#breadcrumb" },
  { content: "列表" },
  { content: "详情" },
];

export default function BreadcrumbDemo() {
  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">用 options 渲染</p>
        <MBreadcrumb options={options} />
      </div>
      <div className="demo__block">
        <p className="demo__caption">用子项渲染</p>
        <MBreadcrumb>
          <MBreadcrumbItem href="#breadcrumb">首页</MBreadcrumbItem>
          <MBreadcrumbItem>列表</MBreadcrumbItem>
        </MBreadcrumb>
      </div>
      <div className="demo__block">
        <p className="demo__caption">自定义分隔符：文字 / 节点</p>
        <MBreadcrumb separator=">" options={options} />
        <MBreadcrumb
          options={options}
          separatorNode={<span style={{ color: "var(--m-accent)" }}>·</span>}
        />
      </div>
    </div>
  );
}
