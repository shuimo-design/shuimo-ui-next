import { useState } from "react";
import { MButton, MPopover, type PopoverPlacement } from "@shuimo-design/react";

const placements: PopoverPlacement[] = ["top", "bottom", "left", "right"];

export default function PopoverDemo() {
  const [visible, setVisible] = useState(false);

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">普通气泡卡片：hover 触发</p>
        <div className="demo__row">
          <MPopover trigger="hover" panel={<div>君不见，黄河之水天上来</div>}>
            <MButton>将毛笔移入试试</MButton>
          </MPopover>
          <MPopover trigger="hover" content="奔流到海不复回" placement="top">
            <MButton>纯文字内容</MButton>
          </MPopover>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">点击控制：show + onShowChange 受控，内容里可以放操作</p>
        <div className="demo__row">
          <MPopover
            show={visible}
            onShowChange={setVisible}
            panel={
              <div style={{ textAlign: "right" }}>
                <div>君不见，黄河之水天上来</div>
                <div className="demo__row" style={{ justifyContent: "flex-end", marginTop: 8 }}>
                  <MButton onClick={() => setVisible(false)}>关闭</MButton>
                  <MButton type="primary" onClick={() => setVisible(false)}>
                    确定
                  </MButton>
                </div>
              </div>
            }
          >
            <MButton>点击我</MButton>
          </MPopover>
          <span className="demo__hint">visible {String(visible)}</span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">方位 placement 与手动控制</p>
        <div className="demo__row">
          {placements.map((placement) => (
            <MPopover
              key={placement}
              placement={placement}
              trigger="hover"
              content={`placement: ${placement}`}
            >
              <MButton>{placement}</MButton>
            </MPopover>
          ))}
          <MPopover trigger="focus" content="聚焦时出现，失焦收起">
            <MButton>focus 触发</MButton>
          </MPopover>
          <MPopover trigger="manual" show content="manual：只听 show 这个 prop">
            <MButton>manual</MButton>
          </MPopover>
          <MPopover disabled content="不会出现">
            <MButton disabled>禁用</MButton>
          </MPopover>
        </div>
      </div>
    </div>
  );
}
