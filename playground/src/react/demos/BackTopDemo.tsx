import { useRef, useState, type CSSProperties } from "react";
import { MBackTop, MButton } from "@shuimo-design/react";

const LINES = Array.from({ length: 60 }, (_, i) => `第 ${i + 1} 行 —— 江湖的业务千篇一律。`);

const BOX: CSSProperties = {
  width: "480px",
  maxWidth: "100%",
  height: "200px",
  padding: "0 12px",
  border: "1px solid var(--m-border)",
  overflow: "auto",
};
const LINE: CSSProperties = { margin: "8px 0" };

export default function BackTopDemo() {
  const [clicks, setClicks] = useState(0);
  // target 传函数：按钮挂载时盒子已经在了，函数返回的就是它
  const box = useRef<HTMLDivElement>(null);

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">
          盯着文档站的正文区（target=&quot;.pg__main&quot;）：往下滚过
          200px，右下角出现一枚「顶」字印
        </p>
        <p className="demo__hint">点击次数 {clicks}；按钮传送到 body，位置由 right / bottom 定</p>
        <MBackTop target=".pg__main" onClick={() => setClicks((n) => n + 1)} />
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          盯着一个滚动盒子（target 传函数）；children 换掉印，right 挪开免得和上面那枚重叠
        </p>
        <div ref={box} style={BOX}>
          {LINES.map((line) => (
            <p key={line} style={LINE}>
              {line}
            </p>
          ))}
        </div>
        <MBackTop target={() => box.current!} visibilityHeight={100} right={100} bottom={40}>
          <MButton type="primary">回到顶部</MButton>
        </MBackTop>
      </div>
    </div>
  );
}
