import { useState } from "react";
import { MButton, MStep, MSteps, type StepStatus } from "@shuimo-design/react";

export default function StepsDemo() {
  const [active, setActive] = useState(1);
  const [status, setStatus] = useState<StepStatus>("process");

  return (
    <div className="demo">
      <p className="demo__caption">
        基础用法：active 是当前步序号（从 0 起），之前的算完成，之后的算等待
      </p>
      <MSteps active={active} status={status}>
        <MStep title="磨墨" description="松烟入砚，徐徐研开" />
        <MStep title="润笔" description="饱蘸浓淡" />
        <MStep title="落纸" description="一气呵成" />
        <MStep title="钤印" description="朱砂一点" />
      </MSteps>
      <div className="demo__row">
        <MButton onClick={() => setActive((n) => (n >= 4 ? 0 : n + 1))}>下一步</MButton>
        <MButton onClick={() => setStatus((s) => (s === "error" ? "process" : "error"))}>
          {status === "error" ? "恢复" : "当前步出错"}
        </MButton>
        <span className="demo__hint">
          active = {active}，status = {status}
        </span>
      </div>

      <p className="demo__caption">紧凑版：只有节点和标题</p>
      <MSteps active={2} simple>
        <MStep title="磨墨" />
        <MStep title="润笔" />
        <MStep title="落纸" />
        <MStep title="钤印" />
      </MSteps>

      <p className="demo__caption">出错：status=&quot;error&quot; 只作用在当前步</p>
      <MSteps active={2} status="error">
        <MStep title="磨墨" description="松烟入砚" />
        <MStep title="润笔" description="饱蘸浓淡" />
        <MStep title="落纸" description="墨洇了" />
        <MStep title="钤印" description="朱砂一点" />
      </MSteps>

      <p className="demo__caption">单步覆盖 status、自定义 icon / title / description 节点</p>
      <MSteps active={1}>
        <MStep title="登录" icon={<span style={{ fontSize: 12 }}>印</span>} />
        <MStep
          titleNode={
            <>
              填写<small style={{ color: "var(--m-fg-muted)" }}>（可选）</small>
            </>
          }
          descriptionNode={<em>节点传进来的描述</em>}
        />
        <MStep title="跳过" status="finish" description="被标成完成" />
        <MStep title="完成" />
      </MSteps>

      <p className="demo__caption">纵向</p>
      <div className="demo__row" style={{ alignItems: "flex-start", gap: 64 }}>
        <MSteps active={1} direction="vertical">
          <MStep title="磨墨" description="松烟入砚，徐徐研开" />
          <MStep title="润笔" description="饱蘸浓淡" />
          <MStep title="落纸" description="一气呵成" />
          <MStep title="钤印" description="朱砂一点" />
        </MSteps>
        <MSteps active={2} direction="vertical" simple>
          <MStep title="磨墨" />
          <MStep title="润笔" />
          <MStep title="落纸" />
          <MStep title="钤印" />
        </MSteps>
      </div>
    </div>
  );
}
