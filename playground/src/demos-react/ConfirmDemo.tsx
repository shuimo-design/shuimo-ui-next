import { useState } from "react";
// 没有 useConfirm()：确认框由树里的 <MOverlayOutlet> 渲染，直接调 MConfirm.show 就行
import { MButton, MConfirm } from "@shuimo-design/react";

export default function ConfirmDemo() {
  const [result, setResult] = useState("");
  const [open, setOpen] = useState(false);

  // 旧文档示例：await 拿结果
  const showConfirm = async () => {
    const ok = await MConfirm.show({ content: "君不见，黄河之水天上来" });
    setResult(ok ? "确定" : "取消");
  };

  const showNoMask = async () => {
    const ok = await MConfirm.show({
      title: "无遮罩",
      content: "后面的页面还能点",
      mask: { show: false },
      confirmText: "知道了",
      cancelText: "再想想",
    });
    setResult(ok ? "知道了" : "再想想");
  };

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">函数式调用（旧文档示例）</p>
        <div className="demo__row">
          <MButton onClick={showConfirm}>点击弹出确认框</MButton>
          <MButton onClick={showNoMask}>无遮罩、自定义按钮文字</MButton>
        </div>
        <p className="demo__hint">结果：{result || "—"}</p>
      </div>

      <div className="demo__block">
        <p className="demo__caption">声明式：open + onOpenChange + children</p>
        <div className="demo__row">
          <MButton onClick={() => setOpen(true)}>打开</MButton>
        </div>
        <MConfirm
          open={open}
          onOpenChange={setOpen}
          title="删除文件"
          onConfirm={() => setResult("删了")}
          onCancel={() => setResult("留着")}
          footer={({ confirm: ok, cancel }) => (
            <>
              <MButton type="primary" onClick={ok}>
                删除
              </MButton>
              <MButton type="text" onClick={cancel}>
                算了
              </MButton>
            </>
          )}
        >
          <p style={{ margin: 0 }}>
            将删除 <b>山水.psd</b>，此操作不可恢复。
          </p>
        </MConfirm>
      </div>
    </div>
  );
}
