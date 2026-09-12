import { useImperativeHandle, type CSSProperties, type ReactNode, type Ref } from "react";
import {
  createScroll,
  scrollBarStyle,
  scrollClasses,
  scrollViewStyle,
  type ScrollExpose,
  type ScrollPosition,
  type ScrollProps as CoreScrollProps,
} from "@shuimo-design/core";
import { useController } from "../../runtime";

export interface MScrollProps extends CoreScrollProps {
  /** 要滚动的内容 */
  children?: ReactNode;
  /** 视口滚动时触发，参数是当前滚动位置 */
  onScroll?: (position: ScrollPosition) => void;
  ref?: Ref<ScrollExpose>;
  className?: string;
  style?: CSSProperties;
}

export function MScroll(props: MScrollProps) {
  const { height, maxHeight, always = false, minThumb = 20, children } = props;

  // 滚动监听、尺寸监听、滑块拖拽、滚完淡出的定时器全在 core 的控制器里，和 Vue 那边是同一份
  const [scroll, state] = useController(createScroll, { minThumb, onScroll: props.onScroll });

  useImperativeHandle(
    props.ref,
    () => ({ scrollTo: scroll.scrollTo, update: scroll.measure, view: scroll.view }),
    [scroll],
  );

  return (
    // 控制器的方法身份恒定（控制器本身存在 ref 里），直接当 ref 回调用；
    // 换成渲染期新建的箭头函数，React 每次渲染都会先 ref(null) 再 ref(node)，白白重装一遍监听
    <div
      ref={scroll.setRoot}
      className={[
        ...scrollClasses({ always, scrolling: state.scrolling, dragging: state.dragging }),
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={props.style}
    >
      <div
        ref={scroll.setView}
        className="m-scroll__view"
        style={scrollViewStyle({ height, maxHeight }) as CSSProperties}
      >
        <div ref={scroll.setContent} className="m-scroll__content">
          {children}
        </div>
      </div>
      {state.v.track > 0 ? (
        <div
          className="m-scroll__bar m-scroll__bar--v"
          style={scrollBarStyle(state.v, "v") as CSSProperties}
          aria-hidden="true"
        >
          <div ref={scroll.thumbRef("v")} className="m-scroll__thumb" />
        </div>
      ) : null}
      {state.h.track > 0 ? (
        <div
          className="m-scroll__bar m-scroll__bar--h"
          style={scrollBarStyle(state.h, "h") as CSSProperties}
          aria-hidden="true"
        >
          <div ref={scroll.thumbRef("h")} className="m-scroll__thumb" />
        </div>
      ) : null}
    </div>
  );
}
