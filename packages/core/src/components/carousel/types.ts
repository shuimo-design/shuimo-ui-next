/** 滚动方向：horizontal 左右翻，vertical 上下翻 */
export type CarouselDirection = "horizontal" | "vertical";
/** 指示器：dots 底部（竖向时在右侧）一排墨点；none 不显示 */
export type CarouselIndicator = "dots" | "none";
/** 翻页箭头：hover 悬停 / 聚焦时浮现；always 一直显示；none 不显示 */
export type CarouselArrows = "hover" | "always" | "none";

/**
 * 用 `items` 数组声明的一张幻灯片。
 *
 * `Node` 由各框架收窄成自己的可渲染类型（Vue 是 VNodeChild，React 是 ReactNode），
 * core 自己不碰 render 的返回值，只做透传。
 */
export interface CarouselItem<Node = unknown> {
  /** 渲染用的 key，也是过渡的身份 */
  key: string | number;
  /** 图片地址；给了就渲染一张铺满的图 */
  src?: string;
  /** 图片的替代文字 */
  alt?: string;
  /** 自定义整张内容，优先于 src */
  render?: () => Node;
}

export interface CarouselProps {
  /** 幻灯片数据；不传则从子组件 MCarouselItem 上按书写顺序收集 */
  items?: readonly CarouselItem[];
  /** 自动播放：true 每 4000ms 翻一张，传数字指定毫秒；悬停、聚焦时暂停，减弱动效时不播 */
  autoplay?: boolean | number;
  /** 循环：最后一张再往后回到第一张，默认 true */
  loop?: boolean;
  /** 滚动方向，默认 horizontal */
  direction?: CarouselDirection;
  /** 容器高度，数字按 px；不传由当前那张撑开 */
  height?: string | number;
  /** 指示器，默认 dots */
  indicator?: CarouselIndicator;
  /** 翻页箭头，默认 hover */
  arrows?: CarouselArrows;
  /** 指示器墨点的随机种子，默认 1 */
  seed?: number;
}

export interface CarouselEmits {
  /** 当前张变化：新下标、旧下标 */
  change: [current: number, previous: number];
}

export interface CarouselSlots {
  /** 放 MCarouselItem（语法糖；传了 items 就不看这里） */
  default?: () => unknown;
}

export interface CarouselItemProps {
  /** 图片地址；给了就渲染一张铺满的图 */
  src?: string;
  /** 图片的替代文字 */
  alt?: string;
}

export interface CarouselItemSlots {
  /** 这一张的内容，优先于 src */
  default?: () => unknown;
}
