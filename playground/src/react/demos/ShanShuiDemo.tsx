import { useState, type CSSProperties } from "react";
import {
  MButton,
  MShanShui,
  type ShanShuiPalette,
  type ShanShuiParallax,
  type ShanShuiReadyPayload,
} from "@shuimo-design/react";

// Vue 的 demo 用 <style scoped>，React 这边没有等价物，直接写行内样式
const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 48,
  fontWeight: 400,
  letterSpacing: "0.4em",
  textIndent: "0.4em",
};
const subStyle: CSSProperties = { margin: "8px 0 0", color: "var(--m-fg-muted)" };
const smallStyle: CSSProperties = { width: 280 };

const PALETTES: { label: string; value: ShanShuiPalette }[] = [
  { label: "墨", value: "ink" },
  { label: "晨", value: "dawn" },
  { label: "暮", value: "dusk" },
];
const MODES: { label: string; value: ShanShuiParallax }[] = [
  { label: "跟随滚动", value: "scroll" },
  { label: "跟随鼠标", value: "pointer" },
  { label: "不动", value: "none" },
];

export default function ShanShuiDemo() {
  const [seed, setSeed] = useState(7);
  const [layers, setLayers] = useState(3);
  const [sun, setSun] = useState(true);
  const [geese, setGeese] = useState(true);
  const [boat, setBoat] = useState(true);
  const [palette, setPalette] = useState<ShanShuiPalette>("ink");
  const [parallax, setParallax] = useState<ShanShuiParallax>("scroll");
  const [ready, setReady] = useState<ShanShuiReadyPayload | null>(null);

  const toggle = (label: string, on: boolean, set: (v: boolean) => void) => (
    <MButton type={on ? "primary" : "default"} onClick={() => set(!on)}>
      {label}
    </MButton>
  );

  return (
    <div className="demo">
      <div className="demo__row">
        <MButton onClick={() => setSeed((n) => n + 1)}>换一幅（seed {seed}）</MButton>
        <MButton onClick={() => setLayers((n) => (n % 4) + 2)}>远山 {layers} 层</MButton>
        {toggle("朱砂日", sun, setSun)}
        {toggle("雁阵", geese, setGeese)}
        {toggle("孤舟", boat, setBoat)}
      </div>
      <div className="demo__row">
        {PALETTES.map((p) => (
          <MButton
            key={p.value}
            type={palette === p.value ? "primary" : "default"}
            onClick={() => setPalette(p.value)}
          >
            {p.label}
          </MButton>
        ))}
        {MODES.map((m) => (
          <MButton
            key={m.value}
            type={parallax === m.value ? "primary" : "default"}
            onClick={() => setParallax(m.value)}
          >
            {m.label}
          </MButton>
        ))}
      </div>
      <MShanShui
        seed={seed}
        layers={layers}
        sun={sun}
        geese={geese}
        boat={boat}
        palette={palette}
        parallax={parallax}
        height="420px"
        onReady={setReady}
      >
        <div>
          <h1 style={titleStyle}>山水</h1>
          <p style={subStyle}>远山、朱砂日、雁阵、孤舟，一个 seed 定一幅画</p>
        </div>
      </MShanShui>
      <p className="demo__hint">
        ready：{ready ? `seed ${ready.seed}、tier ${ready.tier}` : "等待遮罩图解码"}。
        滚动视差按横幅顶边越过视口顶边的距离算，页面在哪个容器里滚都一样；prefers-reduced-motion
        下不动。
      </p>

      <div className="demo__block">
        <p className="demo__caption">
          朴素版：tier 0 不生成
          SVG，远山是几块由深到浅的墩子，日头是个圆；没有墨迹引擎的页面看到的也是这个
        </p>
        <MShanShui seed={seed} tier={0} height="200px" parallax="none">
          <span>tier 0</span>
        </MShanShui>
      </div>

      <div className="demo__block">
        <p className="demo__caption">三种配色并排，同一个 seed 同一幅画，只换颜色</p>
        <div className="demo__row">
          {PALETTES.map((p) => (
            <MShanShui
              key={p.value}
              seed={seed}
              palette={p.value}
              height="180px"
              parallax="none"
              style={smallStyle}
            >
              <span>{p.label}</span>
            </MShanShui>
          ))}
        </div>
      </div>
    </div>
  );
}
