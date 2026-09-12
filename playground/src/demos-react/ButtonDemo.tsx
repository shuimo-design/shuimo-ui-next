import { useState } from "react";
import { MButton, MMessage } from "@shuimo-design/react";

export default function ButtonDemo() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const submit = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1600);
  };

  return (
    <div className="demo">
      <p className="demo__caption">普通按钮</p>
      <div className="demo__row">
        <MButton onClick={() => setCount((n) => n + 1)}>普通按钮 {count}</MButton>
        <MButton text="文字属性" />
      </div>

      <p className="demo__caption">类型</p>
      <div className="demo__row">
        <MButton>默认</MButton>
        <MButton type="primary">主要</MButton>
        <MButton type="confirm">确认</MButton>
        <MButton type="error">错误</MButton>
        <MButton type="warning">警告</MButton>
        <MButton type="text">文字</MButton>
      </div>

      <p className="demo__caption">禁用</p>
      <div className="demo__row">
        <MButton disabled>禁用按钮</MButton>
        <MButton type="primary" disabled>
          主要
        </MButton>
        <MButton type="confirm" disabled>
          确认
        </MButton>
        <MButton type="error" disabled>
          错误
        </MButton>
        <MButton type="warning" disabled>
          警告
        </MButton>
        <MButton type="text" disabled>
          文字
        </MButton>
      </div>

      <p className="demo__caption">事件</p>
      <div className="demo__row">
        <MButton onClick={() => MMessage.success("点击事件触发")}>点击事件</MButton>
      </div>

      <p className="demo__caption">加载中</p>
      <div className="demo__row">
        <MButton type="primary" loading={loading} onClick={submit}>
          {loading ? "提交中" : "点我提交"}
        </MButton>
        <MButton loading>加载</MButton>
        <MButton type="confirm" loading>
          确认
        </MButton>
      </div>

      <p className="demo__caption">链接与原生类型</p>
      <div className="demo__row">
        <MButton href="https://shuimo.design">链接</MButton>
        <MButton href="https://shuimo.design" disabled>
          禁用链接
        </MButton>
        <MButton nativeType="submit" type="confirm">
          submit
        </MButton>
      </div>

      <p className="demo__caption">修改大小：覆盖 --m-button-height / --m-button-width</p>
      <div className="demo__row">
        <MButton
          style={
            { "--m-button-height": "80px", "--m-button-width": "180px" } as React.CSSProperties
          }
        >
          默认
        </MButton>
        <MButton
          type="primary"
          style={
            { "--m-button-height": "80px", "--m-button-width": "180px" } as React.CSSProperties
          }
        >
          主要
        </MButton>
      </div>
    </div>
  );
}
