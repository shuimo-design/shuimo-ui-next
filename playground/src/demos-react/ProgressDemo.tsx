import { useEffect, useState, type CSSProperties } from "react";
import { MButton, MProgress } from "@shuimo-design/react";

export default function ProgressDemo() {
  const [progress, setProgress] = useState(36);
  const [loopPer, setLoopPer] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setLoopPer((n) => (n < 1000 ? n + 1 : 0)), 16);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">建议实践：value 20 / max 100，显示百分比</p>
        <div className="demo__row">
          <MProgress value={20} max={100} showInfo />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">隐藏信息：value 300 / max 1000</p>
        <div className="demo__row">
          <MProgress value={300} max={1000} showInfo={false} />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">动起来 + children 自定义文字</p>
        <div className="demo__row">
          <MProgress value={loopPer} max={1000}>
            <span>{Math.ceil(loopPer / 10)}%</span>
          </MProgress>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">status / strokeWidth / 自定义宽度</p>
        <div className="demo__row">
          <MProgress value={progress} />
          <MProgress value={progress} status="success" strokeWidth={4} />
          <MProgress value={progress} status="warn" />
          <MProgress value={100} status="danger">
            {({ percent }) => `${percent} 分`}
          </MProgress>
        </div>
        <div className="demo__row">
          <MProgress
            value={progress}
            strokeWidth={12}
            style={{ "--m-progress-w": "360px" } as CSSProperties}
          />
        </div>
        <div className="demo__row">
          <MButton onClick={() => setProgress((n) => Math.max(0, n - 10))}>-10</MButton>
          <MButton onClick={() => setProgress((n) => Math.min(100, n + 10))}>+10</MButton>
        </div>
      </div>
    </div>
  );
}
