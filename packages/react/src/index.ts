/**
 * @shuimo-design/react —— 水墨风 React 组件库。
 *
 * 逻辑、样式、墨迹生成全在 @shuimo-design/core，这一层只有 JSX 和绑定。
 * 样式要显式引一次：import "@shuimo-design/react/style.css"。
 */
export * from "./components/button";
export { MIcon } from "./icons";
export { useMounted, useSize } from "./runtime";
export { detectInkTier, type InkTier } from "@shuimo-design/core";
