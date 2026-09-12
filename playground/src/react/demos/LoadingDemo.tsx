import { useState, type CSSProperties } from "react";
import { MButton, MLoading } from "@shuimo-design/react";

// Vue 的 demo 用 <style scoped>，React 这边没有等价物，直接写行内样式
const boxStyle: CSSProperties = {
  width: 320,
  height: 140,
  padding: 12,
  border: "1px dashed var(--m-border)",
};
const indicatorStyle: CSSProperties = {
  display: "block",
  width: 20,
  height: 20,
  border: "3px solid transparent",
  borderTopColor: "var(--m-accent)",
  borderRadius: "50%",
  animation: "m-loading-spin 1s linear infinite",
};

export default function LoadingDemo() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">普通加载 / 可调速 / 带文字</p>
        <div className="demo__row">
          <MLoading />
          <MLoading speed={800} size={28} />
          <MLoading text="正在加载…" seed={4} />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">指示器插槽（React 走 indicator 属性）</p>
        <MLoading indicator={<span style={indicatorStyle} />} />
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          遮罩：自己写条件渲染和 position: relative（Vue 的 v-loading 指令还没有 React 对应物）
        </p>
        <div className="demo__row">
          <MButton onClick={() => setIsLoading((on) => !on)}>切换 loading 状态</MButton>
        </div>
        <div style={{ ...boxStyle, position: "relative" }}>
          <p>一段被盖住的内容。</p>
          <p>父元素要自己是定位上下文，遮罩才铺得住。</p>
          {isLoading ? <MLoading mask text="稍候" /> : null}
        </div>
      </div>
    </div>
  );
}
