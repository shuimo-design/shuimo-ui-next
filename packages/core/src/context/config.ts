/**
 * 全局配置（MConfigProvider 注入、组件用 useConfig 读）的上下文形状 + 默认值 + 合并规则。
 *
 * 原来整份放在 `packages/vue/src/internal/config.ts` 里，用 `ComputedRef<ConfigContext>` 传，
 * 那是 Vue 响应式的产物。搬到这里之后字段是纯值，容器各自负责把新值推下去：
 * Vue 用 provide 一个 computed，React 用 useMemo + Provider。
 */
import type { ConfigSize, ConfigTheme } from "../components/config-provider/types";
import type { InkTier } from "../ink/tier";

/** 全局配置的解析结果 */
export interface ConfigContext {
  /** 组件默认尺寸，组件自己没传 size 时用它 */
  size: ConfigSize;
  /** 语言标签（BCP 47），组件内置文案按它选 */
  locale: string;
  /** undefined = 跟随 ink 引擎自动探测 */
  inkTier?: InkTier;
  /** undefined = 没人接管 html 的 data-theme */
  theme?: ConfigTheme;
}

/** 没有 MConfigProvider 时所有组件共用这一份；引用恒定，服务端和客户端拿到的是同一个对象 */
export const DEFAULT_CONFIG: ConfigContext = { size: "md", locale: "zh-CN" };

/**
 * 外层配置 + 这一层传了的字段。**没传的字段要继承外层**，所以这里只挑 `!== undefined` 的合并 ——
 * 用 `{...parent, ...patch}` 会让 undefined 把外层的值抹掉，嵌套 provider 就串味了。
 */
export function mergeConfig(parent: ConfigContext, patch: Partial<ConfigContext>): ConfigContext {
  return {
    ...parent,
    ...(patch.size !== undefined ? { size: patch.size } : {}),
    ...(patch.locale !== undefined ? { locale: patch.locale } : {}),
    ...(patch.inkTier !== undefined ? { inkTier: patch.inkTier } : {}),
    ...(patch.theme !== undefined ? { theme: patch.theme } : {}),
  };
}
