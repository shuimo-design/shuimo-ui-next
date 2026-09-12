import { useState } from "react";
import { MRadio, MRadioGroup, type RadioValue } from "@shuimo-design/react";

export default function RadioDemo() {
  // 旧文档「普通单选框」：单个 radio 自己记选中态，选中后把 value 报出来
  const [value, setValue] = useState<RadioValue | undefined>(undefined);
  const [season, setSeason] = useState<RadioValue>("chun");

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">普通单选框</p>
        <p className="demo__hint">选择参数: {value === undefined ? "（未选）" : String(value)}</p>
        <MRadio value="janghood" checked={value === "janghood"} onChange={setValue}>
          极客江湖
        </MRadio>
      </div>

      <div className="demo__block">
        <p className="demo__caption">单选组</p>
        <MRadioGroup value={season} onValueChange={setSeason}>
          <MRadio value="chun" label="春" />
          <MRadio value="xia" label="夏" />
          <MRadio value="qiu" label="秋" />
          <MRadio value="dong" label="冬" disabled />
        </MRadioGroup>
        <p className="demo__hint">当前：{String(season)}</p>
      </div>

      <div className="demo__block">
        <p className="demo__caption">竖排</p>
        <MRadioGroup value={season} onValueChange={setSeason} direction="vertical">
          <MRadio value="chun" label="竖排 · 春" />
          <MRadio value="xia" label="竖排 · 夏" />
        </MRadioGroup>
      </div>

      <div className="demo__block">
        <p className="demo__caption">禁用</p>
        <div className="demo__row">
          <MRadio value="a" checked label="禁用且选中" disabled />
          <MRadio value="b" label="禁用" disabled />
        </div>
      </div>
    </div>
  );
}
