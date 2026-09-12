import { useState } from "react";
import { MSlider, type SliderValue } from "@shuimo-design/react";

export default function SliderDemo() {
  const [basic, setBasic] = useState<SliderValue>(0);
  const [bounded, setBounded] = useState<SliderValue>(25);
  const [current, setCurrent] = useState<SliderValue>(50);
  const [committed, setCommitted] = useState(50);
  const [stepped, setStepped] = useState<SliderValue>(40);
  const [span, setSpan] = useState<SliderValue>([20, 60]);

  function onChange(value: SliderValue) {
    setCommitted(Array.isArray(value) ? value[0] : value);
  }

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">普通滑动条</p>
        <div className="demo__row">
          <MSlider value={basic} onValueChange={setBasic} />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">边界：min -50 / max 50</p>
        <div className="demo__row">
          <span>{String(bounded)}</span>
          <MSlider value={bounded} onValueChange={setBounded} min={-50} max={50} />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">change：拖动中值实时变，松手才发 change</p>
        <div>
          <div className="demo__hint">current value: {String(current)}</div>
          <div className="demo__hint">change value: {committed}</div>
        </div>
        <div className="demo__row">
          <MSlider
            value={current}
            onValueChange={setCurrent}
            min={0}
            max={100}
            onChange={onChange}
          />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">showInfo：轨道上方显示 min / 百分比 / max</p>
        <div className="demo__row">
          <MSlider value={stepped} onValueChange={setStepped} showInfo step={5} />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">range + formatTooltip</p>
        <div className="demo__row">
          <MSlider
            value={span}
            onValueChange={setSpan}
            range
            step={5}
            formatTooltip={(v: number) => `${v}%`}
          />
          <span className="demo__hint">
            {Array.isArray(span) ? span.join(" ~ ") : String(span)}
          </span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">disabled / 自定义宽度</p>
        <div className="demo__row">
          <MSlider value={30} disabled />
          <MSlider value={70} style={{ "--m-slider-w": "320px" } as React.CSSProperties} />
        </div>
      </div>
    </div>
  );
}
