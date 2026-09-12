import { useState } from "react";
import { MButton, MDrawer, type DrawerDirection } from "@shuimo-design/react";

const DIRECTIONS: DrawerDirection[] = ["top", "right", "bottom", "left"];
const LABELS: Record<DrawerDirection, string> = {
  top: "上",
  right: "右",
  bottom: "下",
  left: "左",
};

export default function DrawerDemo() {
  const [visible, setVisible] = useState(false);
  const [direction, setDirection] = useState<DrawerDirection>("right");

  return (
    <div className="demo">
      <p className="demo__caption">普通抽屉：默认从右侧滑出，纸框、四角回纹、挂牌和弹窗是同一套</p>
      <div className="demo__row">
        <MDrawer title="抽屉" active={<MButton>点击显示抽屉</MButton>}>
          <span>君不见，黄河之水天上来</span>
        </MDrawer>
        <MDrawer mask={{ show: false }} title="无蒙版" active={<MButton>无蒙版抽屉</MButton>}>
          <span>君不见，黄河之水天上来</span>
        </MDrawer>
      </div>

      <p className="demo__caption">
        四个方向 + 受控开关 +
        footer：关闭挂牌永远横跨一条竖框线，左滑出挂右边线、右滑出挂左边线、上下滑出挂右边线的右上角
      </p>
      <div className="demo__row">
        {DIRECTIONS.map((d) => (
          <MButton
            key={d}
            onClick={() => {
              setDirection(d);
              setVisible(true);
            }}
          >
            从{LABELS[d]}滑出
          </MButton>
        ))}
        <MDrawer
          open={visible}
          onOpenChange={setVisible}
          direction={direction}
          size={direction === "top" || direction === "bottom" ? 240 : 360}
          title="方向"
          footer={<MButton onClick={() => setVisible(false)}>关闭</MButton>}
        >
          <p style={{ margin: 0 }}>direction = {direction}</p>
        </MDrawer>
      </div>
    </div>
  );
}
