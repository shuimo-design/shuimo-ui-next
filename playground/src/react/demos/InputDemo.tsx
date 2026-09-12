import { useState } from "react";
import { MInput } from "@shuimo-design/react";

export default function InputDemo() {
  const [value, setValue] = useState("大侠可尝试修改这里");
  const [text, setText] = useState("");
  const [password, setPassword] = useState("");
  const [counted, setCounted] = useState("");
  const [note, setNote] = useState("");

  return (
    <div className="demo">
      {/* 旧文档：普通输入框 / 占位符 / 禁用 */}
      <div className="demo__block">
        <p className="demo__caption">普通输入框、占位符、禁用、只读</p>
        <div className="demo__row">
          <MInput />
          <MInput placeholder="请大侠输入...." />
          <MInput value="不可编辑" disabled />
          <MInput value="只读" readonly />
        </div>
      </div>

      {/* 旧文档：参数（受控值） */}
      <div className="demo__block">
        <p className="demo__caption">受控值：{value}</p>
        <MInput value={value} onValueChange={setValue} />
      </div>

      <div className="demo__block">
        <p className="demo__caption">清空、密码切换、字数统计、前后缀</p>
        <div className="demo__row">
          <MInput value={text} onValueChange={setText} placeholder="题字" clearable />
          <MInput
            value={password}
            onValueChange={setPassword}
            type="password"
            placeholder="密码"
            showPassword
          />
          <MInput
            value={counted}
            onValueChange={setCounted}
            placeholder="限 10 字"
            maxlength={10}
            showCount
          />
          <MInput placeholder="金额" prefix="￥" suffix="元" />
        </div>
      </div>

      {/* 旧文档：文本输入框 */}
      <div className="demo__block">
        <p className="demo__caption">多行文本</p>
        <MInput
          value={note}
          onValueChange={setNote}
          type="textarea"
          placeholder="落款"
          rows={4}
          maxlength={200}
          showCount
        />
        <MInput type="textarea" value="不能拖拽改大小" resize="none" rows={2} />
      </div>

      <p className="demo__hint">
        text {text || "空"} · note {note.length} 字
      </p>
    </div>
  );
}
