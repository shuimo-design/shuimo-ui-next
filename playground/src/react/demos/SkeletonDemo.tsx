import { useState, type CSSProperties } from "react";
import { MButton, MSkeleton, MSkeletonItem, MSwitch } from "@shuimo-design/react";

// Vue 的 demo 用 <style scoped>，React 这边没有等价物，直接写行内样式
const cardStyle: CSSProperties = { display: "grid", gap: 8 };
const titleStyle: CSSProperties = { margin: 0, fontSize: 16, color: "var(--m-fg)" };
const textStyle: CSSProperties = { margin: 0, color: "var(--m-fg-muted)" };
const customStyle: CSSProperties = { display: "grid", gap: 12 };

export default function SkeletonDemo() {
  const [loading, setLoading] = useState(true);
  const [animated, setAnimated] = useState(true);

  // 模拟一次 80ms 就回来的请求：throttle 300 时骨架根本来不及露面
  const [fastLoading, setFastLoading] = useState(false);
  function reloadFast() {
    setFastLoading(true);
    setTimeout(() => setFastLoading(false), 80);
  }

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">默认：一行标题 + 三行段落，最后一行短一截</p>
        <MSkeleton />
      </div>

      <div className="demo__block">
        <p className="demo__caption">头像 / 行数 / 不要标题</p>
        <MSkeleton avatar rows={4} />
        <MSkeleton rows={2} title={false} />
      </div>

      <div className="demo__block">
        <p className="demo__caption">animated：一道淡墨从左扫到右（减弱动效时自动停）</p>
        <div className="demo__row">
          <MSwitch
            value={animated}
            onValueChange={(v) => setAnimated(v === true)}
            activeText="动"
            inactiveText="静"
          />
        </div>
        <MSkeleton avatar animated={animated} />
      </div>

      <div className="demo__block">
        <p className="demo__caption">loading 切换：为 false 时渲染 children 里的真实内容</p>
        <div className="demo__row">
          <MSwitch
            value={loading}
            onValueChange={(v) => setLoading(v === true)}
            activeText="加载中"
            inactiveText="已加载"
          />
        </div>
        <MSkeleton loading={loading} avatar animated>
          <div style={cardStyle}>
            <h4 style={titleStyle}>题西林壁</h4>
            <p style={textStyle}>横看成岭侧成峰，远近高低各不同。</p>
            <p style={textStyle}>不识庐山真面目，只缘身在此山中。</p>
          </div>
        </MSkeleton>
      </div>

      <div className="demo__block">
        <p className="demo__caption">template 属性：用 MSkeletonItem 自己拼排布</p>
        <MSkeleton
          animated
          template={
            <div style={customStyle}>
              <MSkeletonItem variant="image" />
              <MSkeletonItem variant="h1" />
              <MSkeletonItem variant="text" />
              <MSkeletonItem variant="text" />
              <div className="demo__row">
                <MSkeletonItem variant="button" />
                <MSkeletonItem variant="circle" />
              </div>
            </div>
          }
        />
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          throttle：loading 变 true 后等 300ms 才露出骨架；请求 80ms 就回来，所以不会闪一下
        </p>
        <div className="demo__row">
          <MButton disabled={fastLoading} onClick={reloadFast}>
            重新请求（80ms）
          </MButton>
        </div>
        <MSkeleton loading={fastLoading} throttle={300} rows={2}>
          <p style={textStyle}>请求已完成，骨架没有闪过。</p>
        </MSkeleton>
      </div>
    </div>
  );
}
