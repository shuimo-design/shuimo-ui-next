import { useState } from "react";
import { MPagination } from "@shuimo-design/react";

export default function PaginationDemo() {
  const [current, setCurrent] = useState(1);
  const [big, setBig] = useState(6);
  // React 这边还没有 MSelect，layout 里的 sizes 整段不渲染，每页条数只能从外面给
  const [size] = useState(20);

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">普通分页</p>
        <MPagination current={current} onCurrentChange={setCurrent} total={11} />
        <p className="demo__hint">当前页：{current}</p>
      </div>
      <div className="demo__block">
        <p className="demo__caption">页数多时折叠，带跳页</p>
        <MPagination
          current={big}
          onCurrentChange={setBig}
          pageSize={size}
          total={1024}
          layout="total, sizes, prev, pager, next, jumper"
        />
        <p className="demo__hint">
          第 {big} 页，每页 {size} 条（sizes 区域要 MSelect，React 侧暂缺，整段不渲染）
        </p>
      </div>
      <div className="demo__block">
        <p className="demo__caption">不显示首末页、禁用</p>
        <MPagination current={8} total={300} showEdgePageNum={false} layout="prev, pager, next" />
        <MPagination current={2} total={50} disabled />
      </div>
    </div>
  );
}
