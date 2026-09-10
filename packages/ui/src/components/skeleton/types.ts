export type SkeletonItemVariant = "text" | "h1" | "h3" | "circle" | "rect" | "image" | "button";

export interface SkeletonProps {
  /** 是否显示骨架；为 false 时渲染 default 插槽里的真实内容 */
  loading?: boolean;
  /** 占位块上扫过一道淡墨晕（纯 CSS 动画，减弱动效时自动关掉） */
  animated?: boolean;
  /** 段落行数 */
  rows?: number;
  /** 段落左边画一个圆形头像占位 */
  avatar?: boolean;
  /** 第一行短一些当标题 */
  title?: boolean;
  /** loading 变 true 后延迟多少毫秒才露出骨架，请求很快回来就不会闪一下 */
  throttle?: number;
}

export interface SkeletonSlots {
  /** 真实内容，loading 为 false 时渲染 */
  default?: () => unknown;
  /** 自定义骨架排布，用 MSkeletonItem 拼 */
  template?: () => unknown;
}

export interface SkeletonItemProps {
  /** 占位块形状：text 文字行、h1 / h3 标题、circle 圆、rect 矩形、image 带图片记号的矩形、button 按钮 */
  variant?: SkeletonItemVariant;
}
