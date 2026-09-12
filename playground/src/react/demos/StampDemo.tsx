import { useState } from "react";
import { MButton, MStamp } from "@shuimo-design/react";

const CONTROLS: React.CSSProperties = { gap: 16, fontSize: 13 };
const LABEL: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6 };

export default function StampDemo() {
  const [seed, setSeed] = useState(7);
  const [mode, setMode] = useState<"yang" | "yin">("yang");
  const [roughness, setRoughness] = useState(0.5);
  const [carving, setCarving] = useState(0.8);
  const [bleed, setBleed] = useState(0.7);
  const [text, setText] = useState("水墨丹青");

  return (
    <div className="demo stamp-demo">
      <div className="demo__block">
        <p className="demo__caption">
          阳文（朱文）与阴文（白文）。印文是浏览器渲染的 SVG
          文字，边框、磨损、印泥白斑、刀刻崩口都是运行时按种子生成的
        </p>
        <div className="demo__row">
          <MStamp text="水墨" seed={seed} />
          <MStamp text="水墨" mode="yin" seed={seed} />
          <MStamp text={["水墨", "丹青"]} shape="square" seed={seed} />
          <MStamp text={["水墨", "丹青"]} shape="square" mode="yin" seed={seed} />
          <MButton onClick={() => setSeed(Math.floor(Math.random() * 100000))}>
            换个种子（{seed}）
          </MButton>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          形状：auto 贴文 / square / rect / circle / ellipse / polygon
        </p>
        <div className="demo__row">
          <MStamp text="听雨" seed={seed} />
          <MStamp text="听雨" shape="square" seed={seed} />
          <MStamp text="听雨" shape="rect" aspect={1.6} seed={seed} />
          <MStamp text="听雨" shape="circle" seed={seed} />
          <MStamp text="听雨" shape="ellipse" aspect={1.4} seed={seed} />
          <MStamp text="听雨" shape="polygon" sides={6} seed={seed} />
          <MStamp
            text="听雨"
            shape="polygon"
            sides={8}
            orientation="point-top"
            mode="yin"
            seed={seed}
          />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">多列印文：数组每项一列，第一项在最右；界格只在阴章上抠</p>
        <div className="demo__row">
          <MStamp text={["落梅听", "风雪"]} size={150} seed={seed} />
          <MStamp text={["落梅听", "风雪"]} size={150} mode="yin" gridLines seed={seed} />
          <MStamp
            text="宠辱不惊闲看庭前花开花落"
            size={180}
            shape="square"
            mode="yin"
            gridLines
            seed={seed}
          />
          <MStamp text="一期一会" size={120} shape="circle" direction="circular" seed={seed} />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          质感旋钮：磨损 roughness / 刀刻 carving / 印泥 bleed，全 0 就是干净的矢量章
        </p>
        <div className="demo__row" style={CONTROLS}>
          <label style={LABEL}>
            印文 <input value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <label style={LABEL}>
            模式
            <select value={mode} onChange={(e) => setMode(e.target.value as "yang" | "yin")}>
              <option value="yang">阳文</option>
              <option value="yin">阴文</option>
            </select>
          </label>
          <label style={LABEL}>
            磨损
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={roughness}
              onChange={(e) => setRoughness(Number(e.target.value))}
            />
            {roughness}
          </label>
          <label style={LABEL}>
            刀刻
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={carving}
              onChange={(e) => setCarving(Number(e.target.value))}
            />
            {carving}
          </label>
          <label style={LABEL}>
            印泥
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bleed}
              onChange={(e) => setBleed(Number(e.target.value))}
            />
            {bleed}
          </label>
        </div>
        <div className="demo__row">
          <MStamp
            text={text}
            size={200}
            shape="square"
            mode={mode}
            roughness={roughness}
            carving={carving}
            bleed={bleed}
            seed={seed}
          />
          <MStamp
            text={text}
            size={200}
            shape="square"
            mode={mode}
            roughness={0}
            carving={0}
            bleed={0}
            seed={seed}
          />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          颜色、字体、歪一点盖：color / font / rotate。默认字体先找篆体，找不到退衬线
        </p>
        <div className="demo__row">
          <MStamp text="闲章" color="#1a2847" seed={seed} />
          <MStamp text="闲章" font="'Songti SC', serif" seed={seed} />
          <MStamp text="闲章" font="'Kaiti SC', 'STKaiti', serif" mode="yin" seed={seed} />
          <MStamp text="闲章" rotate={-6} seed={seed} />
          <MStamp text="闲章" size={64} seed={seed} />
          <MStamp text="闲章" size={48} mode="yin" seed={seed} />
        </div>
      </div>
    </div>
  );
}
