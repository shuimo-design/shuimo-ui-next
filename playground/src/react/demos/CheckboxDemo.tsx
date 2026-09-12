import { useState } from "react";
import { MCheckbox, MCheckboxGroup, type CheckboxValue } from "@shuimo-design/react";

export default function CheckboxDemo() {
  // 旧文档「普通复选框」：默认勾上
  const [value, setValue] = useState(true);
  // 旧文档「伴随 Group」
  const [data, setData] = useState<CheckboxValue[]>(["极客江湖", "水墨组件"]);
  const [picks, setPicks] = useState<CheckboxValue[]>(["shan"]);

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">普通复选框</p>
        <MCheckbox checked={value} onCheckedChange={setValue} label="极客江湖" />
        <p className="demo__hint">值：{String(value)}</p>
      </div>

      <div className="demo__block">
        <p className="demo__caption">禁用复选框</p>
        <div className="demo__row">
          <MCheckbox disabled label="极客江湖" />
          <MCheckbox checked disabled label="禁用且勾选" />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">半选</p>
        <MCheckbox checked={false} label="半选（只影响外观）" indeterminate />
      </div>

      <div className="demo__block">
        <p className="demo__caption">伴随 Group</p>
        <p className="demo__hint">已选中：{data.join("，")}</p>
        <MCheckboxGroup value={data} onValueChange={setData}>
          <MCheckbox label="极客江湖" value="极客江湖" />
          <MCheckbox label="水墨组件" value="水墨组件" />
        </MCheckboxGroup>
      </div>

      <div className="demo__block">
        <p className="demo__caption">限制数量 · 竖排</p>
        <MCheckboxGroup value={picks} onValueChange={setPicks} max={2} direction="vertical">
          <MCheckbox value="shan" label="山" />
          <MCheckbox value="shui" label="水" />
          <MCheckbox value="yun" label="云" />
          <MCheckbox value="shi" label="石" />
        </MCheckboxGroup>
        <p className="demo__hint">最多选两个：{picks.join("、") || "空"}</p>
      </div>

      <div className="demo__block">
        <p className="demo__caption">children 写文字</p>
        <MCheckbox defaultChecked>
          <em>江湖</em> 路远
        </MCheckbox>
      </div>
    </div>
  );
}
