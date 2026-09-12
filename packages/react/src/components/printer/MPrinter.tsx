import { useEffect, useImperativeHandle, type CSSProperties, type Ref } from "react";
import {
  createTypewriter,
  printerClasses,
  type PrinterProps as CorePrinterProps,
} from "@shuimo-design/core";
import { useController } from "../../runtime";

/** 命令式的两个口子：ref 拿到的就是它 */
export interface MPrinterHandle {
  /** 从头再打一遍 */
  restart(): void;
  /** 跳到结尾，直接显示全文 */
  finish(): void;
}

export interface MPrinterProps extends CorePrinterProps {
  /** 一段文字全部打完时触发；循环时每一轮都会触发 */
  onEnd?: () => void;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<MPrinterHandle>;
}

export function MPrinter(props: MPrinterProps) {
  const { text = "", cursor = true } = props;

  // 定时器、码点切分、循环、结束回调全在 core 的控制器里，这里只负责喂参数和拿快照
  const [controller, state] = useController(createTypewriter, {
    text,
    speed: props.speed,
    loop: props.loop,
    pause: props.pause,
    autoplay: props.autoplay,
    onEnd: props.onEnd,
  });

  // 每次渲染之后提醒控制器对一次印文：换了就从头再打。换没换由 core 自己比，壳里不留状态
  useEffect(() => {
    controller.refresh();
  });

  useImperativeHandle(
    props.ref,
    () => ({ restart: () => controller.restart(), finish: () => controller.finish() }),
    [controller],
  );

  return (
    <span
      className={[...printerClasses(state.done), props.className].filter(Boolean).join(" ")}
      style={props.style}
      aria-label={text}
    >
      <span className="m-printer__text" aria-hidden="true">
        {state.shown}
      </span>
      {cursor ? <span className="m-printer__cursor" aria-hidden="true" /> : null}
    </span>
  );
}
