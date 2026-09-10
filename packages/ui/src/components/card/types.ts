export type CardShadow = "always" | "hover" | "never";
export type CardFrame = "plain" | "double" | "brush";

export interface CardProps {
  /** 标题（也可用 header 插槽） */
  title?: string;
  /** 阴影：always 常显、hover 悬停时出现、never 不要 */
  shadow?: CardShadow;
  /** 画边框，默认 true；false 时 frame 不生效 */
  bordered?: boolean;
  /**
   * 框型。开了 ink 引擎时三种都是一笔画出来的笔触框，只是粗细不同：plain 细一笔、double 中等一笔（默认）、brush 粗一笔带飞白；
   * 没开引擎时 plain 单线、double 双线（外 1px + 内 1px 隔 3px）、brush 退回 double
   */
  frame?: CardFrame;
  /** 内容区内边距，数字按 px，默认 20px */
  padding?: number | string;
  /** 笔触随机种子：笔触边框、标题下的分隔线、毛边纸缘都用它，同一页多张卡传不同值就不会一模一样 */
  seed?: number;
}

export interface CardSlots {
  /** 内容 */
  default?: () => unknown;
  /** 头部（替代 title） */
  header?: () => unknown;
  /** 头部右侧 */
  extra?: () => unknown;
  /** 顶部封面（图片区），裁在边框内 */
  cover?: () => unknown;
  /** 底部 */
  footer?: () => unknown;
  /** 印：盖在卡片右下角，不占内容流，微微探出框外 4px、歪 6°；放一枚 MStamp 就是落款章。插槽为空不渲染任何节点 */
  seal?: () => unknown;
}
