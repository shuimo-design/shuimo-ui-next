/** 按边开关 */
export interface BorderSides {
  top?: boolean;
  right?: boolean;
  bottom?: boolean;
  left?: boolean;
}

export interface BorderProps {
  /** 笔触种子，默认 1 */
  seed?: number;
  /** 笔宽 px，默认 2（旧版是一条 2px 上下的细手绘线） */
  strokeWidth?: number;
  /** 边缘噪声 0–1，默认 0.35 */
  roughness?: number;
  /** 飞白 0–1，默认 0.06 */
  flyingWhite?: number;
  /** 渲染标签，默认 div */
  tag?: string;
  /** 画不画边：true 四边全画、false 全不画，也可传对象按边指定；优先级低于 top / right / bottom / left。默认 true */
  border?: boolean | BorderSides;
  /** 单独控制上边，不传则听 border 的 */
  top?: boolean;
  /** 单独控制右边，不传则听 border 的 */
  right?: boolean;
  /** 单独控制下边，不传则听 border 的 */
  bottom?: boolean;
  /** 单独控制左边，不传则听 border 的 */
  left?: boolean;
  /** 内容蒙层：半透明纸色加背景模糊，压在远山或图片上时字更清楚。默认 false */
  mask?: boolean;
  /** 墨色，默认 --m-ink（无水墨引擎时退成 --m-border） */
  color?: string;
  /** 内边距，数字按 px；默认 0，内容贴边，笔触压在内容边缘上 */
  padding?: number | string;
}

export interface BorderSlots {
  default?: () => unknown;
}
