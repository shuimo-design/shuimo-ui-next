import { useCallback, type CSSProperties } from "react";
import {
  createReadingStroke,
  READING_STROKE_SEED,
  READING_STROKE_THICKNESS,
  readingStrokeAria,
  readingStrokeClasses,
  readingStrokeStyle,
  type ReadingStrokeProps as CoreReadingStrokeProps,
} from "@shuimo-design/core";
import { useController } from "../../runtime";

export interface MReadingStrokeProps extends CoreReadingStrokeProps {
  /** 进度跨过整数百分点时调一次，参数是 0–1 的进度 */
  onChange?: (progress: number) => void;
  className?: string;
  style?: CSSProperties;
}

export function MReadingStroke(props: MReadingStrokeProps) {
  const {
    seed = READING_STROKE_SEED,
    position = "top",
    target,
    thickness = READING_STROKE_THICKNESS,
    color,
    zIndex,
  } = props;

  // 目标解析、滚动监听、进度换算、量视口宽度全在 core 的控制器里，Vue 那边用的是同一份
  const [controller, state] = useController(createReadingStroke, {
    target,
    onChange: props.onChange,
  });

  // ref 回调的身份必须稳定：变了 React 会先 ref(null) 再 ref(node)，控制器会白白重来一遍
  const ref = useCallback((el: HTMLElement | null) => controller.attach(el), [controller]);

  const ink = readingStrokeStyle({
    seed,
    thickness,
    width: state.width,
    color,
    zIndex,
    progress: state.progress,
  });

  return (
    <div
      ref={ref}
      className={[
        ...readingStrokeClasses({ position, masked: state.width > 0, progress: state.progress }),
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ ...ink, ...props.style } as CSSProperties}
      {...readingStrokeAria(state.progress)}
    >
      <div className="m-reading-stroke__bar" />
    </div>
  );
}
