import { useState } from "react";
// 没有 useMessage()：消息由树里的 <MOverlayOutlet>（App.tsx 那侧的岛挂在同一棵 Vue 树下，
// 出口在 App.vue 里放了一个）渲染，直接调 MMessage.* 就行
import { MButton, MMessage, MSelect, type MessageDirection } from "@shuimo-design/react";

const DIRECTIONS: { label: string; value: MessageDirection }[] = [
  { label: "右上", value: "top-right" },
  { label: "左上", value: "top-left" },
  { label: "顶部居中", value: "top-center" },
  { label: "右下", value: "bottom-right" },
  { label: "左下", value: "bottom-left" },
  { label: "底部居中", value: "bottom-center" },
];

export default function MessageDemo() {
  const [direction, setDirection] = useState<MessageDirection>("top-right");

  // 旧文档示例：四种类型一起弹
  const callAll = () => {
    MMessage.success("success 的 message");
    MMessage.warning("warning 的 message");
    MMessage.info("info 的 message");
    MMessage.error("error 的 message");
  };

  const callAt = () => {
    MMessage.show({ content: `这是一条 ${direction} 的消息`, direction });
  };

  // 旧文档示例：拖拽关闭
  const callDraggable = () => {
    MMessage.show({
      content: "往上拖我，拖过三分之一松手就关",
      direction: "top-center",
      duration: 0,
    });
  };

  const callSticky = () => {
    MMessage.warning({ content: "我不会自己走，点右边的叉", duration: 0, closable: true });
  };

  const callLong = () => {
    MMessage.info(
      "君不见，黄河之水天上来，奔流到海不复回。君不见，高堂明镜悲白发，朝如青丝暮成雪。",
      6000,
    );
  };

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">函数式调用（旧文档示例）</p>
        <div className="demo__row">
          <MButton onClick={callAll}>点击显示 Message</MButton>
          <MButton onClick={callDraggable}>拖拽关闭</MButton>
          <MButton onClick={callSticky}>不自动关闭</MButton>
          <MButton onClick={callLong}>长文本</MButton>
          <MButton type="text" onClick={() => MMessage.closeAll()}>
            全部关掉
          </MButton>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">六个方向</p>
        <div className="demo__row">
          <MSelect
            value={direction}
            onValueChange={(v) => setDirection(v as MessageDirection)}
            options={DIRECTIONS}
            style={{ maxWidth: 160 }}
          />
          <MButton onClick={callAt}>在这里弹</MButton>
        </div>
        <p className="demo__hint">鼠标移上去会暂停倒计时；往屏幕外拖过三分之一松手即关</p>
      </div>

      <div className="demo__block">
        <p className="demo__caption">声明式：直接当组件放在页面里</p>
        <div className="demo__row">
          <MMessage type="success" content="保存成功" duration={0} dragAllow={false} />
          <MMessage type="warning" content="磁盘空间不足" duration={0} dragAllow={false} />
        </div>
        <div className="demo__row">
          <MMessage type="error" content="网络请求失败" duration={0} dragAllow={false} closable />
          <MMessage type="info" duration={0} dragAllow={false} icon="🖌">
            自定义图标与<b>富文本</b>内容
          </MMessage>
        </div>
      </div>
    </div>
  );
}
