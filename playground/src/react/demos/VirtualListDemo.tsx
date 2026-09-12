import { useRef, useState, type CSSProperties } from "react";
import { MButton, MVirtualList, type VirtualListExpose } from "@shuimo-design/react";

const STEMS = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const FIXED = Array.from({ length: 10_000 }, (_, i) => `${STEMS[i % 12]} · 第 ${i + 1} 项`);

interface Note {
  title: string;
  body: string;
}

const ROW: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  height: "100%",
  padding: "0 12px",
};
const ROW_INDEX: CSSProperties = {
  minWidth: "3em",
  color: "var(--m-fg-muted)",
  fontVariantNumeric: "tabular-nums",
  textAlign: "right",
};
const NOTE: CSSProperties = { padding: "10px 12px" };
const NOTE_BODY: CSSProperties = {
  margin: "4px 0 0",
  color: "var(--m-fg-muted)",
  fontSize: "13px",
  lineHeight: 1.6,
};

export default function VirtualListDemo() {
  const [notes, setNotes] = useState<Note[]>(() =>
    Array.from({ length: 2_000 }, (_, i) => ({
      title: `札记 ${i + 1}`,
      body: "山色空蒙雨亦奇。".repeat(1 + (i % 5)),
    })),
  );
  const [target, setTarget] = useState(500);
  const [bottomHits, setBottomHits] = useState(0);
  const fixedList = useRef<VirtualListExpose>(null);

  function loadMore() {
    setBottomHits((n) => n + 1);
    setNotes((prev) =>
      prev.concat(
        Array.from({ length: 200 }, (_, i) => ({
          title: `札记 ${prev.length + i + 1}`,
          body: "水光潋滟晴方好。".repeat(1 + ((prev.length + i) % 4)),
        })),
      ),
    );
  }

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">定高：一万项，itemHeight 固定，只渲染可视区附近的几十个节点</p>
        <MVirtualList ref={fixedList} list={FIXED} itemHeight={36} height={240} divider>
          {({ data, index }) => (
            <div style={ROW}>
              <span style={ROW_INDEX}>{index + 1}</span>
              <span>{data}</span>
            </div>
          )}
        </MVirtualList>
        <div className="demo__row">
          <input
            type="number"
            min={1}
            max={FIXED.length}
            value={target}
            onChange={(event) => setTarget(Number(event.target.value))}
          />
          <MButton onClick={() => fixedList.current?.scrollTo(target - 1, "start")}>
            滚到第 {target} 项
          </MButton>
          <MButton onClick={() => fixedList.current?.scrollTo(target - 1, "center")}>居中</MButton>
          <MButton onClick={() => fixedList.current?.scrollTo(0)}>回顶</MButton>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          变高：不传 itemHeight，先按 estimatedItemHeight 估、渲染后实测；滚到底触发 reachBottom
          追加数据（已触发 {bottomHits} 次，共 {notes.length} 条）
        </p>
        <MVirtualList
          list={notes}
          estimatedItemHeight={56}
          height={280}
          buffer={4}
          divider
          onReachBottom={loadMore}
        >
          {({ data }) => (
            <div style={NOTE}>
              <strong>{data.title}</strong>
              <p style={NOTE_BODY}>{data.body}</p>
            </div>
          )}
        </MVirtualList>
      </div>
    </div>
  );
}
