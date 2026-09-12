import { useState } from "react";
import { MCollapse, MCollapseItem, type CollapseModel } from "@shuimo-design/react";

export default function CollapseDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [log, setLog] = useState("还没动过");
  const [opened, setOpened] = useState<CollapseModel>(["one"]);
  const [accordion, setAccordion] = useState<CollapseModel>("a");

  function handleChange(value: boolean) {
    setIsOpen(value);
    setLog(`折叠面板状态改变：${value ? "展开" : "收起"}`);
  }

  const names = Array.isArray(opened) ? opened : opened === undefined ? [] : [opened];

  return (
    <div className="demo">
      <p className="demo__caption">基础用法：单个面板，标题后一笔画到边</p>
      <MCollapseItem title="欲卷珠帘春恨长">
        <p style={{ margin: 0 }}>却下水晶帘，玲珑望秋月</p>
      </MCollapseItem>

      <p className="demo__caption">禁用状态</p>
      <MCollapseItem title="众里寻他千百度" disabled>
        <p style={{ margin: 0 }}>蓦然回首，那人却在灯火阑珊处</p>
      </MCollapseItem>

      <p className="demo__caption">隐藏分割线</p>
      <MCollapseItem title="初极狭，才通人" divider={false}>
        <p style={{ margin: 0 }}>复行数十步，豁然开朗</p>
      </MCollapseItem>

      <p className="demo__caption">事件：受控 value + onChange</p>
      <MCollapseItem value={isOpen} title="庭院深深深几许" onChange={handleChange}>
        <p style={{ margin: 0 }}>乱红飞过秋千去</p>
      </MCollapseItem>
      <p className="demo__hint">
        {log}（当前 {isOpen ? "展开" : "收起"}）
      </p>

      <p className="demo__caption">自定义标题节点</p>
      <MCollapseItem
        title={
          <span>
            山重水复疑无路 <small style={{ color: "var(--m-fg-muted)" }}>陆游</small>
          </span>
        }
      >
        <div
          style={{
            padding: "8px 12px",
            background: "color-mix(in srgb, var(--m-ink) 6%, transparent)",
          }}
        >
          柳暗花明又一村
        </div>
      </MCollapseItem>

      <p className="demo__caption">成组：value 是展开项的 name 数组</p>
      <MCollapse value={opened} onValueChange={setOpened}>
        <MCollapseItem name="one" title="第一折">
          <p style={{ margin: 0 }}>江流天地外，山色有无中。</p>
        </MCollapseItem>
        <MCollapseItem name="two" title="第二折">
          <p style={{ margin: 0 }}>郡邑浮前浦，波澜动远空。</p>
        </MCollapseItem>
        <MCollapseItem name="three" title="禁用" disabled>
          <p style={{ margin: 0 }}>看不到。</p>
        </MCollapseItem>
      </MCollapse>
      <p className="demo__hint">展开：{names.join("、") || "无"}</p>

      <p className="demo__caption">手风琴：同一时刻只开一项</p>
      <MCollapse value={accordion} onValueChange={setAccordion} accordion>
        <MCollapseItem name="a" title="甲">
          <p style={{ margin: 0 }}>只开一个。</p>
        </MCollapseItem>
        <MCollapseItem name="b" title="乙">
          <p style={{ margin: 0 }}>开我就关掉甲。</p>
        </MCollapseItem>
      </MCollapse>
    </div>
  );
}
