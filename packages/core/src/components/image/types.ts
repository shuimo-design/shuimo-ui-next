export type ImageFit = "fill" | "contain" | "cover" | "none" | "scale-down";

export interface ImageProps {
  /** 图片地址 */
  src: string;
  /** 替代文字 */
  alt?: string;
  /** 图片如何填满容器，对应 CSS object-fit；默认按图片本身尺寸 */
  fit?: ImageFit;
  /** 容器宽度，数字按 px */
  width?: number | string;
  /** 容器高度，数字按 px */
  height?: number | string;
  /** 进入视口附近才加载（原生 loading="lazy"） */
  lazy?: boolean;
  /** 点击打开全屏预览，默认 true */
  preview?: boolean;
  /** 预览时可切换的图片列表；不传只预览自己 */
  previewSrcList?: string[];
  /** 打开预览时先显示列表里的第几张（从 0 起）；不传就找 src 在列表里的位置，找不到从第一张起 */
  initialIndex?: number;
  /** 预览层的 z-index，默认 900（和弹窗一层） */
  zIndex?: number;
  /** 预览层挂牌墨花的随机种子，默认 1 */
  seed?: number;
}

export interface ImageEmits {
  /** 图片加载完成 */
  load: [event: Event];
  /** 图片加载失败 */
  error: [event: Event];
  /** 预览打开 */
  show: [];
  /** 预览关闭 */
  close: [];
}

export interface ImageSlots {
  /** 加载中的占位；不给就是一块骨架 */
  placeholder?: () => unknown;
  /** 加载失败时的内容；不给就显示「加载失败」 */
  error?: () => unknown;
}
