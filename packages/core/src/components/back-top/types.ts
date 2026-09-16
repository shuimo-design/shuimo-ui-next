export interface BackTopProps {
  /** 监听哪个滚动容器：CSS 选择器，或一个返回元素的函数；不传就是整页 */
  target?: string | (() => HTMLElement);
  /** 滚过多少 px 才出现，默认 200 */
  visibilityHeight?: number;
  /** 距视口右边的距离，数字按 px，默认 40 */
  right?: number | string;
  /** 距视口底部的距离，数字按 px，默认 40 */
  bottom?: number | string;
  /** 默认那枚印的随机种子，默认 1 */
  seed?: number;
}

export interface BackTopEmits {
  /** 点了按钮；随后滚回顶部 */
  click: [event: MouseEvent];
}

export interface BackTopSlots {
  /** 替换按钮内容；默认是一枚印文「顶」的小方印 */
  default?: () => unknown;
}
