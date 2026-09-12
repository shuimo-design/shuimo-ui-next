import { useState, type CSSProperties } from "react";
import { MButton, MScroll, type ScrollPosition } from "@shuimo-design/react";

const LINES = Array.from(
  { length: 40 },
  (_, i) => `第 ${i + 1} 行 —— 江湖的业务千篇一律，复杂的代码好几百行。`,
);

const BOX: CSSProperties = { width: "400px", border: "1px solid var(--m-border)" };
const INSIDE: CSSProperties = {
  width: "800px",
  height: "800px",
  background:
    "linear-gradient(140deg, var(--m-success) 0%, var(--m-warn) 50%, var(--m-danger) 75%)",
};
const TEXT: CSSProperties = {
  width: "480px",
  maxWidth: "100%",
  padding: "0 12px",
  border: "1px solid var(--m-border)",
};
const LINE: CSSProperties = { margin: "8px 0", whiteSpace: "nowrap" };

export default function ScrollDemo() {
  const [position, setPosition] = useState<ScrollPosition>({ scrollTop: 0, scrollLeft: 0 });
  const [extra, setExtra] = useState(0);

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">双向滚动：内容 800×800，视口 400×400（旧文档示例）</p>
        <MScroll style={BOX} height={400} onScroll={setPosition}>
          <div style={INSIDE} />
        </MScroll>
        <p className="demo__hint">
          scrollTop {position.scrollTop} · scrollLeft {position.scrollLeft}
        </p>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          只限高：文字列表，滚动条悬停时才浮现；内容变化后滑块自动重算
        </p>
        <MScroll style={TEXT} maxHeight="220px">
          {LINES.map((line) => (
            <p key={line} style={LINE}>
              {line}
            </p>
          ))}
          {Array.from({ length: extra }, (_, i) => (
            <p key={`extra-${i}`} style={LINE}>
              追加的第 {i + 1} 行
            </p>
          ))}
        </MScroll>
        <div className="demo__row">
          <MButton onClick={() => setExtra((n) => n + 10)}>追加 10 行</MButton>
          <MButton onClick={() => setExtra(0)}>清空追加</MButton>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">always：滚动条常驻</p>
        <MScroll style={TEXT} height={120} always>
          {LINES.slice(0, 12).map((line) => (
            <p key={line} style={LINE}>
              {line}
            </p>
          ))}
        </MScroll>
      </div>
    </div>
  );
}
