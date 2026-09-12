import { useState } from "react";
import { MBorder, MButton, MInkTransition } from "@shuimo-design/react";

export default function InkTransitionDemo() {
  const [showPanel, setShowPanel] = useState(true);
  // 换 key 就是重新挂一次，落墨会从头再走一遍
  const [revealKey, setRevealKey] = useState(0);

  return (
    <div className="demo">
      <div className="demo__row">
        <MButton onClick={() => setShowPanel((v) => !v)}>
          {showPanel ? "擦掉面板" : "擦入面板"}
        </MButton>
        <MButton onClick={() => setRevealKey((n) => n + 1)}>重放段落落墨</MButton>
      </div>
      <MInkTransition in={showPanel} direction="right" seed={3}>
        <MBorder seed={5}>
          <p style={{ margin: 0 }}>MInkTransition：进入时从左向右墨迹擦入，离开时反向擦掉。</p>
        </MBorder>
      </MInkTransition>
      <MInkTransition key={revealKey} in appear direction="down" duration={1200}>
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.8 }}>
          appear：首次挂载就播一次，以毛边遮罩自上而下落墨显现。江流天地外，山色有无中。
        </p>
      </MInkTransition>
      <p className="demo__hint">
        Vue 那边还有一个 v-ink-reveal 指令做同样的事；React 没有指令，用 appear 的 MInkTransition
        包一层即可。
      </p>
    </div>
  );
}
