import { useEffect, useMemo, type ReactNode } from "react";
import {
  applyConfigTheme,
  mergeConfig,
  DEFAULT_CONFIG,
  type ConfigProviderProps as CoreConfigProviderProps,
} from "@shuimo-design/core";
import { MOverlayOutlet } from "../overlay-outlet";
import { ConfigProviderContext, useConfig } from "./context";

export interface MConfigProviderProps extends CoreConfigProviderProps {
  children?: ReactNode;
}

export function MConfigProvider(props: MConfigProviderProps) {
  // 不给默认值：没传的字段要继承外层 provider，给了默认值就分不清"没传"和"传了默认"
  const { size, locale, inkTier, theme, children } = props;

  const parent = useConfig();
  // 合并规则（只挑传了的字段盖到外层上）在 core，两个壳共用同一份。
  // 用 useMemo 稳住引用：每次渲染都换一个新对象的话，所有读配置的后代都会白重渲染一轮
  const config = useMemo(
    () => mergeConfig(parent, { size, locale, inkTier, theme }),
    [parent, size, locale, inkTier, theme],
  );

  // 主题写到 html[data-theme] 上。碰 document 的那一步在 core 里（壳里不许出现 document.），
  // 它自己会挡掉服务端；这里只负责"挂载后、theme 变了就再写一次"
  useEffect(() => applyConfigTheme(theme), [theme]);

  // 最外层的 provider 自带函数式弹层的渲染出口（MMessage.success / MConfirm.show 要它才弹得出来）。
  // 只有最外层出：嵌套的 provider 再出一个，同一条消息就会渲染两遍。
  // mergeConfig 每次都返回新对象，所以"父配置就是那份恒定的默认值"正好等价于"上面没有 provider"
  const root = parent === DEFAULT_CONFIG;

  return (
    <ConfigProviderContext value={config}>
      {children}
      {root ? <MOverlayOutlet /> : null}
    </ConfigProviderContext>
  );
}
