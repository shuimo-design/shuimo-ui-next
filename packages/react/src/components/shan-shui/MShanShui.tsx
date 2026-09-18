import { useCallback, useEffect, type CSSProperties, type ReactNode } from "react";
import {
  createShanShui,
  SHAN_SHUI_HEIGHT,
  SHAN_SHUI_SEED,
  shanShuiClasses,
  shanShuiLayers,
  shanShuiParallaxMode,
  shanShuiScene,
  shanShuiStyle,
  shanShuiTier,
  type ShanShuiProps as CoreShanShuiProps,
  type ShanShuiReadyPayload,
} from "@shuimo-design/core";
import { useController } from "../../runtime";

export interface MShanShuiProps extends CoreShanShuiProps {
  /** 覆盖在画面上的标题内容，居中 */
  children?: ReactNode;
  /** 全部图层解码完成、画面淡入时调一次 */
  onReady?: (payload: ShanShuiReadyPayload) => void;
  className?: string;
  style?: CSSProperties;
}

export function MShanShui(props: MShanShuiProps) {
  const {
    seed = SHAN_SHUI_SEED,
    tier: tierProp,
    height = SHAN_SHUI_HEIGHT,
    layers: layersProp = 3,
    sun = true,
    geese = true,
    boat = true,
    parallax: parallaxProp = "scroll",
    palette = "ink",
    children,
  } = props;
  const layers = shanShuiLayers(layersProp);

  // 检测特效档位、等遮罩图解码完再淡入、给图层挂视差 —— 全在 core 的控制器里，Vue 那边用的是同一份
  const [controller, state] = useController(createShanShui, {
    seed,
    tier: tierProp,
    layers,
    sun,
    geese,
    boat,
    parallax: parallaxProp,
    onReady: props.onReady,
  });

  // ref 回调的身份必须稳定：变了 React 会先 ref(null) 再 ref(node)，控制器会白白重来一遍
  const ref = useCallback((el: HTMLElement | null) => controller.attach(el), [controller]);
  // 图层是条件渲染的，元素什么时候在树上只有壳知道；每轮渲染落地后告诉控制器一次，它自己比对有没有变
  useEffect(() => {
    controller.sync();
  });

  const tier = shanShuiTier(tierProp, state.detectedTier);
  const parallax = shanShuiParallaxMode(parallaxProp, tier);
  const scene = shanShuiScene({ seed, tier, layers, sun, geese, boat });

  return (
    <div
      ref={ref}
      className={[
        ...shanShuiClasses({ ready: state.ready, palette, parallax, tier }),
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ ...shanShuiStyle({ height }), ...props.style } as CSSProperties}
      data-seed={seed}
    >
      <div className="m-shan-shui__scene" aria-hidden="true">
        {scene.map((layer) => (
          <div
            key={layer.key}
            className={`m-shan-shui__layer m-shan-shui__${layer.kind}`}
            data-depth={layer.depth}
            style={layer.style as CSSProperties}
          />
        ))}
      </div>
      <div className="m-shan-shui__content">{children}</div>
    </div>
  );
}
