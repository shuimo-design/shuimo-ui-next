import { useRef, useState } from "react";
import { createPrinter, MButton, MPrinter, type MPrinterHandle } from "@shuimo-design/react";

const LINE: React.CSSProperties = { margin: 0, minHeight: "1.6em", fontSize: 18 };
const BRUSH_LINE: React.CSSProperties = {
  ...LINE,
  fontFamily: "var(--m-font-brush)",
  fontSize: 24,
};

// 旧版 MPrinter 是这个控制台打印器，现在叫 createPrinter
const consolePrinter = createPrinter("极客江湖");

export default function PrinterDemo() {
  const [rounds, setRounds] = useState(0);
  const [speed, setSpeed] = useState(80);
  const [text, setText] = useState("行到水穷处，坐看云起时。");
  const printer = useRef<MPrinterHandle>(null);

  function printToConsole() {
    consolePrinter.suggest("建议");
    consolePrinter.info("信息");
    consolePrinter.error("异常");
  }

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">逐字打出，末尾一枚墨点在闪</p>
        <p style={LINE}>
          <MPrinter ref={printer} text={text} speed={speed} onEnd={() => setRounds((n) => n + 1)} />
        </p>
        <div className="demo__row">
          <MButton onClick={() => printer.current?.restart()}>重打</MButton>
          <MButton onClick={() => printer.current?.finish()}>直接写完</MButton>
          <MButton onClick={() => setSpeed((s) => (s === 80 ? 30 : 80))}>速度 {speed}ms</MButton>
          <MButton
            onClick={() =>
              setText((t) =>
                t.includes("云") ? "空山新雨后，天气晚来秋。" : "行到水穷处，坐看云起时。",
              )
            }
          >
            换一句
          </MButton>
        </div>
        <p className="demo__hint">打完 {rounds} 次</p>
      </div>

      <div className="demo__block">
        <p className="demo__caption">循环：打完停一会再来一遍；多行文字换行照样保留</p>
        <p style={BRUSH_LINE}>
          <MPrinter
            text={"千山鸟飞绝，万径人踪灭。\n孤舟蓑笠翁，独钓寒江雪。"}
            speed={120}
            pause={1500}
            loop
          />
        </p>
      </div>

      <div className="demo__block">
        <p className="demo__caption">不要光标</p>
        <p style={LINE}>
          <MPrinter text="安静地写完这一行。" cursor={false} />
        </p>
      </div>

      <div className="demo__block">
        <p className="demo__caption">控制台打印（旧文档示例）：打开开发者工具看</p>
        <div className="demo__row">
          <MButton onClick={printToConsole}>点击再次打印</MButton>
        </div>
      </div>
    </div>
  );
}
