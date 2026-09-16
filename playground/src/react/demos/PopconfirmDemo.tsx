import { useState } from "react";
import { MButton, MPopconfirm, type PopconfirmPlacement } from "@shuimo-design/react";

const placements: PopconfirmPlacement[] = ["top", "bottom", "left", "right"];

export default function PopconfirmDemo() {
  const [result, setResult] = useState("-");
  const [open, setOpen] = useState(false);

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">点击触发：确定 / 取消各发一个事件，点外面和 Esc 算取消</p>
        <div className="demo__row">
          <MPopconfirm
            title="确定删除这一项？"
            content="删除后不可恢复"
            onConfirm={() => setResult("confirm")}
            onCancel={() => setResult("cancel")}
          >
            <MButton type="error">删除</MButton>
          </MPopconfirm>
          <span className="demo__hint">result {result}</span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">按钮文字与类型、不带徽记、方位、禁用</p>
        <div className="demo__row">
          <MPopconfirm
            title="发布这篇文章？"
            confirmText="发布"
            cancelText="再看看"
            confirmType="confirm"
          >
            <MButton>发布</MButton>
          </MPopconfirm>
          <MPopconfirm title="不带徽记的确认" icon={false}>
            <MButton>无徽记</MButton>
          </MPopconfirm>
          {placements.map((placement) => (
            <MPopconfirm key={placement} placement={placement} title={`placement: ${placement}`}>
              <MButton>{placement}</MButton>
            </MPopconfirm>
          ))}
          <MPopconfirm title="不会弹出" disabled>
            <MButton disabled>禁用</MButton>
          </MPopconfirm>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">renderTitle / renderContent；open + onOpenChange 受控</p>
        <div className="demo__row">
          <MPopconfirm
            open={open}
            onOpenChange={setOpen}
            title="清空回收站"
            renderTitle={() => (
              <span>
                清空<b>回收站</b>？
              </span>
            )}
            renderContent={() => (
              <span>
                共 <b>12</b> 项将被永久删除
              </span>
            )}
          >
            <MButton>清空</MButton>
          </MPopconfirm>
          <span className="demo__hint">open {String(open)}</span>
        </div>
      </div>
    </div>
  );
}
