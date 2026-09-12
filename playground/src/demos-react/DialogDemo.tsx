import { useState } from "react";
import { MButton, MDialog } from "@shuimo-design/react";

export default function DialogDemo() {
  const [controlled, setControlled] = useState(false);
  const [bound, setBound] = useState(false);
  const [name, setName] = useState("");

  return (
    <div className="demo">
      <p className="demo__caption">普通弹窗：active 当触发器，点遮罩、按 ESC、点右上角挂牌都能关</p>
      <div className="demo__row">
        <MDialog title="弹窗" active={<MButton>点击显示弹窗</MButton>}>
          <span>君不见，黄河之水天上来</span>
        </MDialog>
        <MDialog mask={false} title="无蒙版" active={<MButton>无蒙版弹窗</MButton>}>
          <span>晴空一鹤排云上，便引诗情到碧霄。</span>
        </MDialog>
        <MDialog height={480} title="设置高度" active={<MButton>高 480px</MButton>}>
          <div>山河风景元无异，城郭人民半已非。</div>
        </MDialog>
      </div>

      <p className="demo__caption">控制关闭：不给挂牌、不许点遮罩，只能走底部按钮</p>
      <div className="demo__row">
        <MDialog
          open={controlled}
          onOpenChange={setControlled}
          title="控制关闭"
          closeBtn={false}
          mask={{ clickClose: false }}
          closeOnEsc={false}
          active={<MButton>点击显示弹窗</MButton>}
          footer={
            <MButton type="primary" onClick={() => setControlled(false)}>
              关闭
            </MButton>
          }
        >
          <p style={{ margin: 0 }}>这扇窗只能从下面这个按钮关。</p>
        </MDialog>
      </div>

      <p className="demo__caption">受控开关 + header / footer：React 这边是 open + onOpenChange</p>
      <div className="demo__row">
        <MButton onClick={() => setBound(true)}>点击这里</MButton>
        <MDialog
          open={bound}
          onOpenChange={setBound}
          width={420}
          seed={7}
          header="题名"
          footer={
            <>
              <MButton onClick={() => setBound(false)}>取消</MButton>
              <MButton type="confirm" onClick={() => setBound(false)}>
                确定
              </MButton>
            </>
          }
        >
          <input
            className="m-input__native"
            placeholder="写下你的名字"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", font: "inherit" }}
          />
        </MDialog>
        <span className="demo__hint">
          bound {String(bound)} · name {name || "空"}
        </span>
      </div>
    </div>
  );
}
