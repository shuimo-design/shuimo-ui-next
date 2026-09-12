import { useState } from "react";
import { MButton, MConfigProvider, useConfig, type ConfigSize } from "@shuimo-design/react";

// 一个只负责把 useConfig() 读到的值打出来的小组件，模拟"别的组件读全局配置"
function ConfigProbe() {
  const config = useConfig();
  return (
    <code>
      size={config.size} · locale={config.locale} · inkTier={config.inkTier ?? "auto"}
    </code>
  );
}

const SIZES: ConfigSize[] = ["sm", "md", "lg"];

export default function ConfigProviderDemo() {
  const [size, setSize] = useState<ConfigSize>("md");
  const [locale, setLocale] = useState("zh-CN");

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">没有 provider：拿到默认值</p>
        <ConfigProbe />
      </div>

      <div className="demo__block">
        <p className="demo__caption">外层 provider 的值会传给所有后代</p>
        <div className="demo__row">
          <MButton onClick={() => setSize(SIZES[(SIZES.indexOf(size) + 1) % SIZES.length]!)}>
            size → {size}
          </MButton>
          <MButton onClick={() => setLocale(locale === "zh-CN" ? "en-US" : "zh-CN")}>
            locale → {locale}
          </MButton>
        </div>
        <MConfigProvider size={size} locale={locale} inkTier={2}>
          <ConfigProbe />
        </MConfigProvider>
      </div>

      <div className="demo__block">
        <p className="demo__caption">嵌套：内层只改自己传了的字段，其余继承外层</p>
        <MConfigProvider size={size} locale={locale}>
          <MConfigProvider size="sm">
            <ConfigProbe />
          </MConfigProvider>
        </MConfigProvider>
      </div>

      <p className="demo__hint">
        theme 属性会写到 html 的 data-theme（light / dark / system），和左下角的转暗按钮、MDarkMode
        作用的是同一个属性，这里不演示以免互相覆盖。
      </p>
    </div>
  );
}
