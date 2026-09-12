import { useState } from "react";
import { MSwitch, type SwitchValue } from "@shuimo-design/react";

export default function SwitchDemo() {
  const [basic, setBasic] = useState<SwitchValue>(false);
  const [withText, setWithText] = useState<SwitchValue>(true);
  const [withSlot, setWithSlot] = useState<SwitchValue>(true);
  const [loading, setLoading] = useState<SwitchValue>(false);
  const [disabled, setDisabled] = useState<SwitchValue>(false);
  const [changed, setChanged] = useState<SwitchValue>(false);
  const [lastChange, setLastChange] = useState<SwitchValue>();
  const [controlled, setControlled] = useState<SwitchValue>(false);
  const [asked, setAsked] = useState<SwitchValue>();
  const [mode, setMode] = useState<SwitchValue>("day");

  function onControlledChange(next: SwitchValue) {
    // 受控：组件不自己改值，这里模拟"问过之后才切"
    setAsked(next);
    window.setTimeout(() => setControlled(next === true), 600);
  }

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">普通开关</p>
        <div className="demo__row">
          <span>参数值为：{String(basic)}</span>
          <MSwitch value={basic} onValueChange={setBasic} />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">activeText / inactiveText</p>
        <div className="demo__row">
          <MSwitch
            value={withText}
            onValueChange={setWithText}
            activeText="active"
            inactiveText="inactive"
          />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">active / inactive 节点覆盖文字</p>
        <div className="demo__row">
          <MSwitch
            value={withSlot}
            onValueChange={setWithSlot}
            activeText="active"
            inactiveText="inactive"
            active={<span>这里是 active slot</span>}
          />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">loading / disabled</p>
        <div className="demo__row">
          <MSwitch value={loading} onValueChange={setLoading} loading />
          <MSwitch value loading />
          <MSwitch value={disabled} onValueChange={setDisabled} disabled />
          <MSwitch value disabled />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">change 事件</p>
        <div className="demo__row">
          <MSwitch
            value={changed}
            onValueChange={setChanged}
            inactiveText="bye"
            onChange={setLastChange}
          />
          <span className="demo__hint">change → {String(lastChange ?? "（还没切过）")}</span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">controlled：只发 change，值由外部延迟 600ms 再改</p>
        <div className="demo__row">
          <span>参数值为：{String(controlled)}</span>
          <MSwitch value={controlled} controlled onChange={onControlledChange} />
          <span className="demo__hint">想切到 → {String(asked ?? "—")}</span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">activeValue / inactiveValue：非布尔值</p>
        <div className="demo__row">
          <MSwitch
            value={mode}
            onValueChange={setMode}
            activeValue="night"
            inactiveValue="day"
            activeText="夜"
            inactiveText="昼"
          />
          <span className="demo__hint">mode = {String(mode)}</span>
        </div>
      </div>
    </div>
  );
}
