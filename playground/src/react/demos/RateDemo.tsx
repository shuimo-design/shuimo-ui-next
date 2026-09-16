import { useState, type CSSProperties } from "react";
import { MRate } from "@shuimo-design/react";

const texts = ["差", "一般", "还行", "不错", "很好"];
const seasons = ["春", "夏", "秋", "冬"];

export default function RateDemo() {
  const [basic, setBasic] = useState(3);
  const [half, setHalf] = useState(2.5);
  const [hovered, setHovered] = useState(0);
  const [texted, setTexted] = useState(4);
  const [custom, setCustom] = useState(2);

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">基本用法：点击落值，再点当前值归零</p>
        <div className="demo__row">
          <MRate value={basic} onValueChange={setBasic} />
          <span className="demo__hint">{basic}</span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">allowHalf：指针落在一格左半就是半格；onHoverChange 报预览值</p>
        <div className="demo__row">
          <MRate value={half} onValueChange={setHalf} allowHalf onHoverChange={setHovered} />
          <span className="demo__hint">
            value: {half} / hover: {hovered}
          </span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">texts：每档右侧文字，悬停时跟着预览值变</p>
        <div className="demo__row">
          <MRate value={texted} onValueChange={setTexted} texts={texts} />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">尺寸：sm / md / lg</p>
        <div className="demo__row">
          <MRate value={3} size="sm" />
          <MRate value={3} />
          <MRate value={3} size="lg" />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">readonly 只展示；disabled 不响应且退出 Tab 序列；count 可改</p>
        <div className="demo__row">
          <MRate value={3.5} allowHalf readonly />
          <MRate value={2} disabled />
          <MRate value={6} count={10} size="sm" />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          renderCharacter：自定义每一格；seed 换一组墨团；朱砂色用 --m-rate-active
        </p>
        <div className="demo__row">
          <MRate
            value={custom}
            onValueChange={setCustom}
            count={4}
            renderCharacter={({ index, active }) => (
              <span style={{ fontWeight: active ? 700 : 400 }}>{seasons[index]}</span>
            )}
          />
          <MRate
            value={4}
            seed={9}
            style={{ "--m-rate-active": "var(--m-seal)" } as CSSProperties}
          />
        </div>
      </div>
    </div>
  );
}
