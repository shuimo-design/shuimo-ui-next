import { useState, type CSSProperties } from "react";
import { MButton, MRicePaper, type PaperPreset } from "@shuimo-design/react";
import { goldFleckUrl, paperTextureUrl, type GoldPreset } from "@shuimo-design/core/ink";

// Vue 的 demo 用 <style scoped>，React 这边没有等价物，直接写行内样式
const paperStyle: CSSProperties = {
  minHeight: 260,
  padding: 24,
  boxShadow: "0 8px 24px rgb(0 0 0 / 0.08)",
};
const compareStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  width: 300,
  height: 300,
  padding: 12,
  boxSizing: "border-box",
  backgroundColor: "rgb(252 250 240)",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
  fontSize: 13,
};
const smallStyle: CSSProperties = { width: 200, height: 200, padding: 25, boxSizing: "border-box" };
const discStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 150,
  height: 150,
  borderRadius: "50%",
  background: "rgb(from var(--m-accent) r g b / 0.2)",
  fontSize: "2rem",
  fontWeight: "bold",
};
const controlsStyle: CSSProperties = { gap: 16, fontSize: 13 };
const labelStyle: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6 };

const PRESETS: { label: string; value: PaperPreset | undefined }[] = [
  { label: "跟随主题", value: undefined },
  { label: "生宣", value: "raw" },
  { label: "熟宣", value: "processed" },
  { label: "仿古", value: "antique" },
  { label: "茶渍", value: "teaStained" },
  { label: "月白", value: "moonWhite" },
];
const GOLD_COLORS: GoldPreset[] = ["gold", "paleGold", "roseGold", "copper", "silver", "bronze"];
const BASE: [number, number, number] = [252, 250, 240];

export default function RicePaperDemo() {
  const [seed, setSeed] = useState(7);
  const [gold, setGold] = useState(true);
  const [deckle, setDeckle] = useState(false);
  const [landscape, setLandscape] = useState(true);
  const [parallax, setParallax] = useState(true);
  const [preset, setPreset] = useState<PaperPreset | undefined>(undefined);

  /** 旧站示例：用 CSS 变量调远山透明度 */
  const [opacity, setOpacity] = useState(0.32);

  /** 洒金对比：旧做法是滤镜里把噪声过阈值得到金点；新做法是 shuimo-core 移植来的矢量金箔 */
  const [goldColor, setGoldColor] = useState<GoldPreset>("gold");
  const [goldDensity, setGoldDensity] = useState(0.5);
  const [goldClustering, setGoldClustering] = useState(0.3);
  const [goldMax, setGoldMax] = useState(12);
  const goldOptions = {
    color: goldColor,
    density: goldDensity,
    clustering: goldClustering,
    sizeRange: [2, goldMax] as [number, number],
  };

  const oldStyle: CSSProperties = {
    ...compareStyle,
    backgroundImage: `url("${paperTextureUrl({ seed, baseColor: BASE, goldSpecks: true, fibers: 0, particles: 0 })}")`,
    backgroundSize: "384px 384px",
  };
  const bothStyle: CSSProperties = {
    ...compareStyle,
    backgroundImage: `url("${goldFleckUrl({ seed, ...goldOptions })}"), url("${paperTextureUrl({ seed, baseColor: BASE, goldSpecks: true })}")`,
    backgroundSize: "768px 768px, 384px 384px",
  };

  const toggle = (label: string, on: boolean, set: (v: boolean) => void, disabled = false) => (
    <MButton type={on ? "primary" : "default"} disabled={disabled} onClick={() => set(!on)}>
      {label}
    </MButton>
  );

  return (
    <div className="demo">
      <div className="demo__row">
        <MButton onClick={() => setSeed((n) => n + 1)}>换一张纸（seed {seed}）</MButton>
        {toggle("洒金", gold, setGold)}
        {toggle("毛边", deckle, setDeckle)}
        {toggle("远山", landscape, setLandscape)}
        {toggle("视差", parallax, setParallax, !landscape)}
      </div>
      <div className="demo__row">
        {PRESETS.map((p) => (
          <MButton
            key={p.label}
            type={preset === p.value ? "primary" : "default"}
            onClick={() => setPreset(p.value)}
          >
            {p.label}
          </MButton>
        ))}
      </div>
      <MRicePaper
        seed={seed}
        paper={preset}
        goldFlecks={gold}
        deckleEdge={deckle}
        landscape={landscape}
        parallax={parallax}
        style={paperStyle}
      >
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.8 }}>
          宣纸：一张可平铺的 SVG 纹理，颗粒、纤维、洒金在一个滤镜里合成，浏览器光栅化一次即缓存。
          底部两侧的远山是四张带种子的 SVG 剪影（左右各远近两层），跟着鼠标和滚动做视差； 同一个
          seed 永远是同一张纸、同一组山。切到暗色主题，山会换成灰白的调子。
        </p>
      </MRicePaper>
      <p className="demo__hint">
        整站背景直接 <code>layout=&quot;full-screen&quot;</code>，铺满视口并自己滚动；旧站的
        <code>type=&quot;cold|warm&quot;</code> 对应这里的{" "}
        <code>paper=&quot;moonWhite|antique&quot;</code>。
      </p>

      <div className="demo__block">
        <p className="demo__caption">
          洒金对比：左「旧」是滤镜里噪声过阈值出来的金点；中「新」是从 shuimo-core
          移植的矢量金箔（大片不规则、成簇、大片周围溅金粉、明暗各异、无缝平铺）；右是两者叠加。
        </p>
        <div className="demo__row">
          <div style={oldStyle}>
            <span>旧：滤镜金粉</span>
          </div>
          <MRicePaper
            style={compareStyle}
            paper="processed"
            seed={seed}
            goldFlecks={goldOptions}
            landscape={false}
          >
            <span>新：矢量金箔</span>
          </MRicePaper>
          <div style={bothStyle}>
            <span>叠加</span>
          </div>
        </div>
        <div className="demo__row" style={controlsStyle}>
          <label style={labelStyle}>
            金色
            <select value={goldColor} onChange={(e) => setGoldColor(e.target.value as GoldPreset)}>
              {GOLD_COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            密度
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={goldDensity}
              onChange={(e) => setGoldDensity(Number(e.target.value))}
            />
            {goldDensity}
          </label>
          <label style={labelStyle}>
            成簇
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={goldClustering}
              onChange={(e) => setGoldClustering(Number(e.target.value))}
            />
            {goldClustering}
          </label>
          <label style={labelStyle}>
            最大片
            <input
              type="range"
              min="4"
              max="32"
              step="1"
              value={goldMax}
              onChange={(e) => setGoldMax(Number(e.target.value))}
            />
            {goldMax}px
          </label>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          纤维与颗粒：左只有滤镜底纹（原来的样子），右叠了矢量纤维折线和颗粒（shuimo-core
          的做法），放大看纸面有丝
        </p>
        <div className="demo__row">
          <MRicePaper
            style={compareStyle}
            paper="raw"
            seed={seed}
            fibers={0}
            particles={0}
            landscape={false}
          >
            <span>只有底纹</span>
          </MRicePaper>
          <MRicePaper
            style={compareStyle}
            paper="raw"
            seed={seed}
            fibers={2}
            particles={0.8}
            landscape={false}
          >
            <span>纤维 2 / 颗粒 0.8</span>
          </MRicePaper>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">色调：旧站的冷 / 暖两色调，现在是纸色预设</p>
        <div className="demo__row">
          <MRicePaper style={smallStyle} paper="antique" seed={seed}>
            <div style={discStyle}>warm</div>
          </MRicePaper>
          <MRicePaper style={smallStyle} paper="moonWhite" seed={seed}>
            <div style={discStyle}>cold</div>
          </MRicePaper>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          远山透明度：<code>--m-rice-paper-landscape-opacity</code>（{opacity.toFixed(2)}）。
          多张宣纸同屏时每张都在听鼠标，示例页里会有点费，正式页面一张就够
        </p>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          style={{ maxWidth: 320 }}
        />
        <MRicePaper
          style={
            {
              ...paperStyle,
              "--m-rice-paper-landscape-opacity": String(opacity),
            } as CSSProperties
          }
          seed={seed}
          parallax={false}
        >
          <p style={{ margin: 0 }}>自定义透明度</p>
        </MRicePaper>
      </div>
    </div>
  );
}
