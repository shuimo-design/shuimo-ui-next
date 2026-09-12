/**
 * @shuimo-design/core —— 水墨风组件库的无框架内核。
 *
 * 这里没有一行 Vue 或 React：墨迹生成、状态控制器、DOM 行为和全部样式都在这一层，
 * 上面的 @shuimo-design/vue 和 @shuimo-design/react 只负责模板和绑定。
 *
 * 样式从这一行进来（也是全库唯一的 CSS 入口，见 styles/index.css 的说明）。
 */
import "./styles/index.css";

export {
  createStore,
  FOCUSABLE_SELECTOR,
  focusables,
  isClient,
  observeSize,
  prefersReducedMotion,
  reflow,
  type Controller,
  type Listener,
  type SizeBox,
  type SizeBoxMode,
  type Store,
  type Unsubscribe,
} from "./runtime";
export { detectInkTier, type InkTier } from "./ink/tier";
export { ICONS, iconComponentName, type IconDef, type IconName, type IconShape } from "./icons";
export {
  buttonBrush,
  buttonClasses,
  buttonInert,
  buttonInk,
  isSolidButton,
  type ButtonInk,
  type ButtonProps,
  type ButtonType,
} from "./components/button";
export type { ButtonEmits, ButtonSlots } from "./components/button/types";
