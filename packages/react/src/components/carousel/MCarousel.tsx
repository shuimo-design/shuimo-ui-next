import {
  Children,
  isValidElement,
  useCallback,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  CAROUSEL_LABELS,
  CAROUSEL_TRANSITION,
  carouselArrowDisabled,
  carouselClasses,
  carouselDirection,
  carouselDotClasses,
  carouselDotLabel,
  carouselInterval,
  carouselSlideClass,
  carouselSlideLabel,
  carouselStyle,
  createCarousel,
  isVerticalCarousel,
  normalizeCarouselIndex,
  type CarouselItem,
  type CarouselProps as CoreCarouselProps,
  type CarouselStepDirection,
} from "@shuimo-design/core";
import { IconChevronLeft, IconChevronRight } from "../../icons";
import { useController } from "../../runtime";
import { MTransition } from "../../transition";
import { MCarouselItem, type MCarouselItemProps } from "./MCarouselItem";

/** React 这边的一张：render 返回 ReactNode */
export type ReactCarouselItem = CarouselItem<ReactNode>;

export interface MCarouselProps extends Omit<CoreCarouselProps, "items"> {
  /** 幻灯片数据；不传则从子组件 MCarouselItem 上按书写顺序收集 */
  items?: readonly ReactCarouselItem[];
  /** 受控的当前张（从 0 起）；不传就由组件自己记（配合 defaultCurrent） */
  current?: number;
  defaultCurrent?: number;
  onCurrentChange?: (current: number) => void;
  /** 当前张变化：新下标、旧下标 */
  onChange?: (current: number, previous: number) => void;
  /** 放 MCarouselItem（语法糖；传了 items 就不看这里） */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * 从 children 里按**书写顺序**收集 MCarouselItem 的配置。
 *
 * 全程在渲染期完成：读的是元素上的 props。effect 的执行顺序在 Fragment / Suspense /
 * 并发切片下不保证跟 DOM 一致，服务端更是没有 DOM —— 所以顺序不能靠子组件登记。
 * `Children.toArray` 给每个元素配的 key 带有 ".$" 前缀，这里只认使用者自己写的 key，没写的按书写位置顶上。
 */
function collectCarouselItems(children: ReactNode): ReactCarouselItem[] {
  const items: ReactCarouselItem[] = [];
  for (const node of Children.toArray(children)) {
    if (!isValidElement(node) || node.type !== MCarouselItem) continue;
    const props = node.props as MCarouselItemProps;
    items.push({
      key: node.key?.startsWith(".$") ? node.key.slice(2) : items.length,
      src: props.src,
      alt: props.alt,
      render: props.children === undefined ? undefined : () => props.children,
    });
  }
  return items;
}

export function MCarousel(props: MCarouselProps) {
  const {
    autoplay = false,
    loop = true,
    direction = "horizontal",
    height,
    indicator = "dots",
    arrows = "hover",
    seed = 1,
    children,
  } = props;

  // 数据的来源：传了 items 就用传的，没传才从 children 收集
  const items = props.items ?? collectCarouselItems(children);
  const count = items.length;
  const vertical = isVerticalCarousel(direction);

  const controlled = props.current !== undefined;
  const [uncontrolled, setUncontrolled] = useState(props.defaultCurrent ?? 0);
  // 受控值可能越界（张数变了）：渲染一律用收进范围的下标
  const index = normalizeCarouselIndex(controlled ? props.current : uncontrolled, count);

  /**
   * 翻页的视觉方向：进来的从哪边滑入。
   * 用"渲染期派生状态"的写法（比较上一次的下标、在渲染里 setState），
   * 方向和下标落在同一轮渲染，过渡起手时读到的就是对的；放进 effect 就晚了一帧
   */
  const [seen, setSeen] = useState(index);
  const [stepDirection, setStepDirection] = useState<CarouselStepDirection>(1);
  if (seen !== index) {
    setSeen(index);
    setStepDirection(carouselDirection(seen, index, { count, loop }));
  }

  // 自动播放的计时器、悬停 / 聚焦暂停、翻页和键盘全在 core 的控制器里，Vue 那边用的是同一份
  const [carousel, state] = useController(createCarousel, {
    count,
    current: index,
    interval: carouselInterval(autoplay),
    loop,
    vertical,
    onChange: (next: number, previous: number) => {
      if (!controlled) setUncontrolled(next);
      props.onCurrentChange?.(next);
      props.onChange?.(next, previous);
    },
  });
  // ref 回调的身份必须稳定：变了 React 会先 ref(null) 再 ref(node)，控制器手里的根会来回换
  const rootRef = useCallback((el: HTMLElement | null) => carousel.setRoot(el), [carousel]);

  const showArrows = arrows !== "none" && count > 1;
  const showDots = indicator === "dots" && count > 1;

  return (
    <div
      ref={rootRef}
      className={[...carouselClasses({ direction, arrows, indicator }), props.className]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          ...carouselStyle({ height, direction: stepDirection, seed }),
          ...props.style,
        } as CSSProperties
      }
      role="region"
      aria-roledescription="carousel"
      aria-label={CAROUSEL_LABELS.region}
      tabIndex={0}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => carousel.onKeyDown(event.nativeEvent)}
    >
      {/* 自动播放时读屏器不播报每次切换；停下来（悬停、聚焦、没开 autoplay）才播报 */}
      <div className="m-carousel__track" aria-live={state.playing ? "off" : "polite"}>
        {items.map((item, i) => (
          <MTransition key={item.key} name={CAROUSEL_TRANSITION} in={i === index}>
            <div
              className={carouselSlideClass()}
              role="group"
              aria-roledescription="slide"
              aria-label={carouselSlideLabel(i, count)}
            >
              {item.render ? (
                item.render()
              ) : item.src ? (
                <img className="m-carousel__img" src={item.src} alt={item.alt} />
              ) : null}
            </div>
          </MTransition>
        ))}
      </div>
      {showArrows ? (
        <button
          type="button"
          className="m-carousel__arrow m-carousel__arrow--prev"
          aria-label={CAROUSEL_LABELS.prev}
          disabled={carouselArrowDisabled({ current: index, delta: -1, count, loop })}
          onClick={() => carousel.prev()}
        >
          <IconChevronLeft />
        </button>
      ) : null}
      {showArrows ? (
        <button
          type="button"
          className="m-carousel__arrow m-carousel__arrow--next"
          aria-label={CAROUSEL_LABELS.next}
          disabled={carouselArrowDisabled({ current: index, delta: 1, count, loop })}
          onClick={() => carousel.next()}
        >
          <IconChevronRight />
        </button>
      ) : null}
      {showDots ? (
        <div className="m-carousel__dots" role="group" aria-label={CAROUSEL_LABELS.dots}>
          {items.map((item, i) => (
            <button
              key={item.key}
              type="button"
              className={carouselDotClasses(i === index).join(" ")}
              aria-label={carouselDotLabel(i)}
              aria-current={i === index ? "true" : undefined}
              onClick={() => carousel.goTo(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
