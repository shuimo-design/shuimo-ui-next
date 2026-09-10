export interface LoadingProps {
  /** 转一圈的毫秒数，默认 2000 */
  speed?: number;
  /** 指示器边长（px），默认 40 */
  size?: number;
  /** 遮罩模式：铺满最近的定位父元素并把内容盖住（父元素要 position: relative，v-loading 指令会自动加） */
  mask?: boolean;
  /** 指示器下方的文字（也可用默认插槽） */
  text?: string;
  /** 墨点形状的随机种子 */
  seed?: number;
}

export interface LoadingSlots {
  /** 替换默认的墨点转圈指示器 */
  indicator?: () => unknown;
  /** 替代 text */
  default?: () => unknown;
}
