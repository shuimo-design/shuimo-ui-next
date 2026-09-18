import { useState, type CSSProperties } from "react";
import { MButton, MCarousel, MCarouselItem, type ReactCarouselItem } from "@shuimo-design/react";

/** 示例图：三幅内联 SVG，山、水、云 */
function picture(label: string, ink: string, paper: string) {
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">` +
        `<rect width="320" height="200" fill="${paper}"/>` +
        `<path d="M0 160 C60 90 120 120 160 70 S260 100 320 60 V200 H0Z" fill="${ink}" opacity="0.85"/>` +
        `<text x="24" y="48" font-size="28" fill="${ink}" font-family="serif">${label}</text>` +
        `</svg>`,
    )
  );
}
const PICTURES: ReactCarouselItem[] = [
  { key: "shan", src: picture("山", "#1c1c1c", "#f7f4ec"), alt: "山" },
  { key: "shui", src: picture("水", "#1661ab", "#eef3f8"), alt: "水" },
  { key: "yun", src: picture("云", "#74787a", "#f2f0ea"), alt: "云" },
];

const BOX: CSSProperties = { maxWidth: 480 };
const CARD: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  alignItems: "center",
  padding: "48px 16px",
  border: "1px solid var(--m-border)",
  color: "var(--m-fg)",
};

export default function CarouselDemo() {
  const [current, setCurrent] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const onChange = (next: number, previous: number) =>
    setLog((prev) => [...prev.slice(-4), `${previous} → ${next}`]);

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">
          基础用法：items 一项一张，给了 src 就是一张铺满的图；箭头悬停时浮现，底部一排墨点
        </p>
        <MCarousel items={PICTURES} height={200} style={BOX} />
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          autoplay：true 每 4 秒翻一张，传数字指定毫秒；悬停、聚焦时暂停。arrows=&quot;always&quot;
          箭头常驻
        </p>
        <MCarousel items={PICTURES} height={200} autoplay={2500} arrows="always" style={BOX} />
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          current / onCurrentChange 受控；loop 关掉后两头的箭头禁用；onChange
          报新旧下标。容器可聚焦，← → 翻页，Home / End 到两头
        </p>
        <MCarousel
          current={current}
          onCurrentChange={setCurrent}
          onChange={onChange}
          items={PICTURES}
          height={200}
          loop={false}
          style={BOX}
        />
        <div className="demo__row">
          <MButton onClick={() => setCurrent(0)}>第一张</MButton>
          <MButton onClick={() => setCurrent(2)}>最后一张</MButton>
          <span className="demo__hint">
            当前 {current}；最近变化：{log.join("，") || "无"}
          </span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          direction=&quot;vertical&quot; 上下翻，指示器挪到右侧，↑ ↓ 翻页
        </p>
        <MCarousel items={PICTURES} height={200} direction="vertical" style={BOX} />
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          子组件写法：MCarouselItem 的 children 是这一张的内容，没给 height 时由当前那张撑开；seed
          换一粒墨点
        </p>
        <MCarousel seed={7} indicator="dots" arrows="always" style={BOX}>
          <MCarouselItem key="poem-1">
            <div style={CARD}>
              <strong>空山新雨后</strong>
              <span>天气晚来秋</span>
            </div>
          </MCarouselItem>
          <MCarouselItem key="poem-2">
            <div style={CARD}>
              <strong>明月松间照</strong>
              <span>清泉石上流</span>
            </div>
          </MCarouselItem>
          <MCarouselItem key="poem-3">
            <div style={CARD}>
              <strong>竹喧归浣女</strong>
              <span>莲动下渔舟</span>
            </div>
          </MCarouselItem>
        </MCarousel>
      </div>
    </div>
  );
}
