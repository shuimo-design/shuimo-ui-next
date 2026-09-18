import { useRef, useState, type CSSProperties } from "react";
import { MButton, MReadingStroke } from "@shuimo-design/react";

const LINES = Array.from({ length: 80 }, (_, i) => `第 ${i + 1} 行 —— 一笔书，写到哪算哪。`);

const BOX: CSSProperties = {
  width: "480px",
  maxWidth: "100%",
  height: "200px",
  padding: "0 12px",
  border: "1px solid var(--m-border)",
  overflow: "auto",
};
const LINE: CSSProperties = { margin: "8px 0" };

export default function ReadingStrokeDemo() {
  const [percent, setPercent] = useState(0);
  const [seed, setSeed] = useState(1);
  // target 传函数：笔触挂载时盒子已经在了，函数返回的就是它
  const box = useRef<HTMLDivElement>(null);
  const [boxPercent, setBoxPercent] = useState(0);

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">
          盯着文档站的正文区（target=&quot;.pg__main&quot;）：视口顶部那根笔随着往下滚一路写过去，笔尖那一头化开
        </p>
        <p className="demo__hint">
          进度 {percent}%（change 只在跨过整数百分点时触发）。
          role=&quot;progressbar&quot;，aria-valuenow 是整数百分点
        </p>
        <div className="demo__row">
          <MButton onClick={() => setSeed((n) => n + 1)}>换一根笔（seed {seed}）</MButton>
        </div>
        <MReadingStroke
          target=".pg__main"
          seed={seed}
          onChange={(p) => setPercent(Math.round(p * 100))}
        />
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          盯着一个滚动盒子（target 传函数）；贴在视口底部，朱砂色、笔宽 6
        </p>
        <p className="demo__hint">盒子进度 {boxPercent}%</p>
        <div ref={box} style={BOX}>
          {LINES.map((line) => (
            <p key={line} style={LINE}>
              {line}
            </p>
          ))}
        </div>
        <MReadingStroke
          target={() => box.current}
          position="bottom"
          thickness={6}
          color="var(--m-seal)"
          onChange={(p) => setBoxPercent(Math.round(p * 100))}
        />
      </div>
    </div>
  );
}
