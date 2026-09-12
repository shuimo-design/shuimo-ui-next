import { useState } from "react";
import { MDatePicker } from "@shuimo-design/react";

type Model = string | Date | null;

// Date 不是合法的 React 节点（Vue 的模板插值会自动 toString，React 不会），
// 所以提示文字这里显式转一道，输出和 Vue 那份一致
const hint = (value: Model): string => (value == null ? "未选" : String(value));

export default function DatePickerDemo() {
  // 旧文档示例
  const [plain, setPlain] = useState<Model>(null);
  const [month, setMonth] = useState<Model>(null);
  // 旧版允许直接传 Date 对象，写回的是格式化字符串
  const [withDefault, setWithDefault] = useState<Model>(new Date());

  // 新增能力
  const [year, setYear] = useState<Model>("2026");
  const [formatted, setFormatted] = useState<Model>("2026年09月09日");
  const [weekday, setWeekday] = useState<Model>(null);

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">普通日期选择框</p>
        <div className="demo__row">
          <MDatePicker value={plain} onValueChange={setPlain} />
          <span className="demo__hint">{hint(plain)}</span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">月份选择框：type=&quot;month&quot;，写回 YYYY-MM</p>
        <div className="demo__row">
          <MDatePicker value={month} onValueChange={setMonth} type="month" />
          <span className="demo__hint">{hint(month)}</span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">传递默认值：value 可以直接给 Date 对象</p>
        <div className="demo__row">
          <MDatePicker value={withDefault} onValueChange={setWithDefault} />
          <span className="demo__hint">日期：{String(withDefault)}</span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">年份选择 type=&quot;year&quot;、自定义 format、禁用</p>
        <div className="demo__row">
          <MDatePicker value={year} onValueChange={setYear} type="year" />
          <MDatePicker value={formatted} onValueChange={setFormatted} format="YYYY年MM月DD日" />
          <MDatePicker value="2026-09-09" disabled />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">周一起始 + disabledDate 禁掉周末 + 关掉清空按钮</p>
        <div className="demo__row">
          <MDatePicker
            value={weekday}
            onValueChange={setWeekday}
            firstDayOfWeek={1}
            disabledDate={(d: Date) => d.getDay() === 0 || d.getDay() === 6}
            clearable={false}
            placeholder="周末不可选"
          />
          <span className="demo__hint">{hint(weekday)}</span>
        </div>
      </div>
    </div>
  );
}
