import { useCallback, type CSSProperties, type ReactNode } from "react";
import {
  createWatermark,
  resolveWatermark,
  watermarkClasses,
  watermarkStyle,
  WATERMARK_LAYER_CLASS,
  type WatermarkProps as CoreWatermarkProps,
} from "@shuimo-design/core";
import { useController } from "../../runtime";

export interface MWatermarkProps extends CoreWatermarkProps {
  /** 被水印覆盖的内容 */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MWatermark(props: MWatermarkProps) {
  const { content, image, font, rotate, gap, offset, width, height, zIndex, ink, seed, children } =
    props;

  // 归一化和 SVG 生成都是纯函数，服务端和客户端首帧算出同一张图
  const resolved = resolveWatermark({
    content,
    image,
    font,
    rotate,
    gap,
    offset,
    width,
    height,
    zIndex,
    ink,
    seed,
  });
  const layerStyle = watermarkStyle(resolved);

  // 防篡改：水印层被删、被改样式就贴回去，观察器在 core 的控制器里，Vue 那边用的是同一份
  const [controller] = useController(createWatermark, { style: layerStyle });

  // ref 回调的身份必须稳定：变了 React 会先 ref(null) 再 ref(node)，控制器会白白重来一遍
  const rootRef = useCallback((el: HTMLElement | null) => controller.attach(el), [controller]);
  const layerRef = useCallback((el: HTMLElement | null) => controller.setLayer(el), [controller]);

  return (
    <div
      ref={rootRef}
      className={[
        ...watermarkClasses({ image: resolved.image !== undefined, ink: resolved.ink }),
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={props.style}
    >
      {children}
      <div
        ref={layerRef}
        className={WATERMARK_LAYER_CLASS}
        style={layerStyle as CSSProperties}
        aria-hidden="true"
      />
    </div>
  );
}
