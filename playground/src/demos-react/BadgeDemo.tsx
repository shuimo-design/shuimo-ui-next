import { useState, type CSSProperties } from "react";
import { MBadge, MButton } from "@shuimo-design/react";

// Vue 的 demo 用 <style scoped>，React 这边没有等价物，直接写行内样式
const row: CSSProperties = { gap: 28 };
const box: CSSProperties = {
  display: "inline-block",
  width: 40,
  height: 40,
  borderRadius: "var(--m-radius)",
  background: "var(--m-neutral)",
};

export default function BadgeDemo() {
  const [count, setCount] = useState(3);

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">
          朱砂小印：数字盖成一枚毛边小方印，超过 max 显示 "max+"；value
          变化时重盖一次，先略大按下再落实
        </p>
        <div className="demo__row" style={row}>
          <MBadge value={count}>
            <span style={box} />
          </MBadge>
          <MBadge value={count} max={10}>
            <span style={box} />
          </MBadge>
          <MButton onClick={() => setCount((n) => n + 1)}>+1</MButton>
          <MButton onClick={() => setCount(0)}>归零</MButton>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          语义色只换印泥：danger（默认，朱砂）/ primary / success / warn / info，印形不变
        </p>
        <div className="demo__row" style={row}>
          <MBadge value={5}>
            <span style={box} />
          </MBadge>
          <MBadge value={5} type="primary">
            <span style={box} />
          </MBadge>
          <MBadge value={5} type="success">
            <span style={box} />
          </MBadge>
          <MBadge value={5} type="warn">
            <span style={box} />
          </MBadge>
          <MBadge value={5} type="info">
            <span style={box} />
          </MBadge>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">小点是一滴洇开的朱砂；文字印、showZero、hidden、offset</p>
        <div className="demo__row" style={row}>
          <MBadge dot>
            <span style={box} />
          </MBadge>
          <MBadge value="新">
            <span style={box} />
          </MBadge>
          <MBadge value={0} showZero>
            <span style={box} />
          </MBadge>
          <MBadge value={9} hidden>
            <span style={box} />
          </MBadge>
          <MBadge value={9} offset={[-6, 6]}>
            <span style={box} />
          </MBadge>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          没有 children 时独立成印，回到文档流；seed 换一枚印的毛边走向
        </p>
        <div className="demo__row">
          <MBadge value={12} />
          <MBadge value={1000} max={999} type="primary" />
          <MBadge value="草稿" type="info" />
          <MBadge dot type="success" />
          <MBadge value={7} seed={9} />
        </div>
      </div>
    </div>
  );
}
