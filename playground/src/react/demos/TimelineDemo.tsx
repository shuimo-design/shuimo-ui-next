import { useState } from "react";
import { MButton, MTimeline, MTimelineItem, type TimelineItem } from "@shuimo-design/react";

const events: TimelineItem[] = [
  { key: "mo", label: "辰时", content: "磨墨。松烟入砚，徐徐研开。" },
  { key: "bi", label: "巳时", content: "润笔。饱蘸浓淡，试锋于废纸。", type: "primary" },
  { key: "zhi", label: "午时", content: "落纸。一气呵成，不作修饰。", type: "success" },
  { key: "yin", label: "申时", content: "钤印。朱砂一点，落款收笔。", type: "danger" },
];

const chapters: TimelineItem[] = [
  { label: "卷一", content: "山水", dot: "一" },
  { label: "卷二", content: "花鸟", dot: "二" },
  { label: "卷三", content: "人物", dot: "三" },
];

export default function TimelineDemo() {
  const [log, setLog] = useState<TimelineItem[]>([
    { label: "09:12", content: "开始上传" },
    { label: "09:15", content: "校验完成" },
  ]);
  const [reverse, setReverse] = useState(false);

  const append = () =>
    setLog((prev) => [
      ...prev,
      {
        label: `09:${String(20 + prev.length).padStart(2, "0")}`,
        content: `第 ${prev.length + 1} 步完成`,
      },
    ]);

  return (
    <div className="demo">
      <p className="demo__caption">基础用法：items 一项一条，type 决定节点颜色</p>
      <MTimeline items={events} />

      <p className="demo__caption">mode：right 轴线在右，alternate 左右交替</p>
      <div className="demo__row" style={{ alignItems: "flex-start", gap: 48 }}>
        <MTimeline items={events} mode="right" style={{ flex: 1 }} />
        <MTimeline items={events} mode="alternate" style={{ flex: 1 }} />
      </div>

      <p className="demo__caption">pending：末尾一段虚线和一个幽灵节点；reverse 倒序</p>
      <MTimeline items={log} pending="进行中…" reverse={reverse} />
      <div className="demo__row">
        <MButton onClick={append}>追加一步</MButton>
        <MButton onClick={() => setReverse((v) => !v)}>{reverse ? "正序" : "倒序"}</MButton>
      </div>

      <p className="demo__caption">dot 传一个字，节点变成带字的圈</p>
      <MTimeline items={chapters} />

      <p className="demo__caption">子组件写法：MTimelineItem 的 children 是内容，dotNode 是节点</p>
      <MTimeline>
        <MTimelineItem label="庚子" type="muted">
          <strong>初学</strong>，临《芥子园画谱》
        </MTimelineItem>
        <MTimelineItem label="辛丑" content="始画山水" />
        <MTimelineItem label="壬寅" dotNode={<span style={{ fontSize: 11 }}>印</span>}>
          第一次刻印
        </MTimelineItem>
      </MTimeline>

      <p className="demo__caption">renderDot / renderItem：整条时间线统一自定义</p>
      <MTimeline
        items={events}
        mode="alternate"
        renderDot={({ index }) => index + 1}
        renderItem={({ item }) => (
          <>
            <em>{item.label}</em> · {item.content}
          </>
        )}
      />
    </div>
  );
}
