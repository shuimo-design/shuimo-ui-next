import { useState, type CSSProperties } from "react";
import { MDarkMode } from "@shuimo-design/react";

export default function DarkModeDemo() {
  const [dark, setDark] = useState<boolean>();
  const [changes, setChanges] = useState(0);

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">
          点太极切换深浅；选择记在 localStorage（键 shuimo-theme），刷新后还在
        </p>
        <div className="demo__row">
          <MDarkMode dark={dark} onDarkChange={setDark} onChange={() => setChanges((n) => n + 1)} />
          <span className="demo__hint">
            dark = {String(dark)}，切换了 {changes} 次
          </span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">不自转 / 不做整页墨迹转场 / 禁用</p>
        <div className="demo__row">
          <MDarkMode rotate={false} />
          <MDarkMode transition={false} />
          <MDarkMode disabled />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">尺寸和黑白两色都是组件变量，可以覆盖</p>
        <div className="demo__row">
          <MDarkMode style={{ "--m-dark-mode-size": "48px" } as CSSProperties} />
          <MDarkMode
            style={
              { "--m-dark-mode-size": "64px", "--m-dark-mode-yin": "#861717" } as CSSProperties
            }
          />
          <MDarkMode style={{ "--m-dark-mode-size": "20px" } as CSSProperties} rotate={false} />
        </div>
      </div>

      <p className="demo__hint">
        多个实例改的是同一个 html[data-theme]，点任何一个都会一起变；没有 dark
        也没有本地记录时不动主题（默认亮色）， 传 autoMode 才写 data-theme="system" 跟随系统。
      </p>
    </div>
  );
}
