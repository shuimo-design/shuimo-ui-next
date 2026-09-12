import { useState } from "react";
import { MInputNumber } from "@shuimo-design/react";

export default function InputNumberDemo() {
  const [number, setNumber] = useState<number | undefined>(0);
  const [price, setPrice] = useState<number | undefined>(9.5);

  return (
    <div className="demo">
      {/* 旧文档：普通数字输入框，限定 -10 ~ 10 */}
      <div className="demo__block">
        <p className="demo__caption">数字为：{String(number)}</p>
        <MInputNumber value={number} onValueChange={setNumber} max={10} min={-10} />
      </div>

      <div className="demo__block">
        <p className="demo__caption">步长与小数位、禁用、只读、不带按钮</p>
        <div className="demo__row">
          <MInputNumber
            value={price}
            onValueChange={setPrice}
            step={0.5}
            precision={2}
            placeholder="价"
          />
          <MInputNumber value={7} disabled />
          <MInputNumber value={7} readonly />
          <MInputNumber value={1} controls={false} />
        </div>
      </div>

      <p className="demo__hint">price {String(price)}</p>
    </div>
  );
}
