import { useState } from "react";
import { MButton, MCell, MGrid, type ReactGridCell } from "@shuimo-design/react";

const POEMS = ["春江潮水连海平", "海上明月共潮生", "滟滟随波千万里", "何处春江无月明"];

/** 新写法：格子就是一个数组，顺序即排列顺序，gapRotate 按下标分角 */
const POEM_CELLS: ReactGridCell[] = POEMS.map((poem) => ({
  key: poem,
  border: true,
  content: poem,
}));

export default function GridDemo() {
  const [tilt, setTilt] = useState(15);

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">横向排列，格子均分宽度，gap 控制间距（cells 数组写法）</p>
        <MGrid gap={16} h={64} cells={POEM_CELLS} />
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          语法糖：用 MCell 子组件写也行（MGrid 在渲染期按书写顺序读它们的 props）。 给了 w
          的格子按宽来，其余均分剩下的
        </p>
        <MGrid gap={12} h={48}>
          <MCell w={120} border>
            <div style={{ padding: 12 }}>120px</div>
          </MCell>
          <MCell border>
            <div style={{ padding: 12 }}>自适应</div>
          </MCell>
          <MCell w={200} border>
            <div style={{ padding: 12 }}>200px</div>
          </MCell>
        </MGrid>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          gapRotate：每道分隔一个倾斜角，相邻格子自动错位拼出斜缝（当前 {tilt}°）。 第 i
          道缝分给数组里第 i 和第 i+1 个格子，顺序完全由数组决定
        </p>
        <MGrid gap={10} h={96} gapRotate={[tilt, -tilt, tilt]} cells={POEM_CELLS} />
        <div className="demo__row">
          <MButton onClick={() => setTilt(Math.max(0, tilt - 5))}>-5°</MButton>
          <MButton onClick={() => setTilt(Math.min(40, tilt + 5))}>+5°</MButton>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          单个格子的四边：points 简写（上 右 下 左）或 a / b / c / d 单独给。 MCell 也能脱离 MGrid
          单独用
        </p>
        <div className="demo__row">
          <MCell w={140} h={90} border points="0 12">
            <div style={{ padding: 24, textAlign: "center" }}>points=&quot;0 12&quot;</div>
          </MCell>
          <MCell w={140} h={90} border a={8} c={8}>
            <div style={{ padding: 24, textAlign: "center" }}>a=8 c=8</div>
          </MCell>
          <MCell w={140} h={90} border points={10}>
            <div style={{ padding: 24, textAlign: "center" }}>points=10</div>
          </MCell>
          <MCell w={140} h={90} border b={-20} d={-20}>
            <div style={{ padding: 24, textAlign: "center" }}>b=-20 d=-20</div>
          </MCell>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">纵向排列</p>
        <MGrid
          direction="column"
          gap={8}
          h={36}
          style={{ width: 240 }}
          cells={POEM_CELLS.slice(0, 3)}
        />
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          cols 等宽网格：span 跨列、offset 留空；cols 也可以按断点给 &#123; xs: 2, md: 4, lg: 6
          &#125;
        </p>
        <MGrid
          cols={{ xs: 2, md: 4, lg: 6 }}
          gap={12}
          rowGap={8}
          h={40}
          cells={[
            { border: true, span: 2, content: "span 2" },
            { border: true, content: "1" },
            { border: true, content: "1" },
            { border: true, offset: 1, span: 2, content: "offset 1, span 2" },
            { border: true, content: "1" },
            { border: true, content: "1" },
          ]}
        />
        <p className="demo__hint">拖动窗口宽度看列数变化。</p>
      </div>
    </div>
  );
}
