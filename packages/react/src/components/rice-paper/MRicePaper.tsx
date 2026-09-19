import { useCallback, useEffect, type CSSProperties, type ReactNode } from "react";
import {
  createRicePaper,
  ricePaperBaseColor,
  ricePaperClasses,
  ricePaperRidges,
  ricePaperSeed,
  ricePaperShowLandscape,
  ricePaperStyle,
  ricePaperTier,
  type RicePaperProps as CoreRicePaperProps,
  type RicePaperReadyPayload,
} from "@shuimo-design/core";
import { useController } from "../../runtime";

export interface MRicePaperProps extends CoreRicePaperProps {
  /** 纸上的内容 */
  children?: ReactNode;
  /** 纹理（和洒金）解码完成、纸可以淡入时调一次 */
  onReady?: (payload: RicePaperReadyPayload) => void;
  className?: string;
  style?: CSSProperties;
}

export function MRicePaper(props: MRicePaperProps) {
  const {
    seed,
    tier: tierProp,
    paper,
    grain = 0.5,
    goldFlecks = false,
    fibers = 1,
    particles = 0.5,
    deckleEdge = false,
    landscape = true,
    parallax = true,
    layout = "auto",
    children,
  } = props;

  /*
   * 检测特效档位、从 --m-paper-rgb 读纸色、盯 data-theme 和系统深浅偏好、量尺寸、
   * 等纹理解码完再淡入、给远山挂视差 —— 全在 core 的控制器里，Vue 那边用的是同一份。
   */
  const [controller, state] = useController(createRicePaper, {
    seed,
    tier: tierProp,
    paper,
    grain,
    fibers,
    particles,
    goldFlecks,
    deckleEdge,
    landscape,
    parallax,
    onReady: props.onReady,
  });

  // ref 回调的身份必须稳定：变了 React 会先 ref(null) 再 ref(node)，控制器会白白重来一遍
  const ref = useCallback((el: HTMLElement | null) => controller.attach(el), [controller]);
  // 远山是条件渲染的，元素什么时候在树上只有壳知道；每轮渲染落地后告诉控制器一次，它自己比对有没有变
  useEffect(() => {
    controller.sync();
  });

  const resolvedSeed = ricePaperSeed(seed, state.fallbackSeed);
  const tier = ricePaperTier(tierProp, state.detectedTier);
  const baseColor = ricePaperBaseColor(paper, state.themePaper);
  const showLandscape = ricePaperShowLandscape(landscape, tier);
  // 远山的图只在挂载后生成：几百 KB 不进服务端 HTML，反正要等 ready 才淡入
  const ridges = showLandscape && state.mounted ? ricePaperRidges(resolvedSeed) : [];

  const ink = ricePaperStyle({
    tier,
    seed: resolvedSeed,
    baseColor,
    grain,
    fibers,
    particles,
    goldFlecks,
    deckleEdge,
    width: state.width,
    height: state.height,
  });

  return (
    <div
      ref={ref}
      className={[
        ...ricePaperClasses({ ready: state.ready, deckleEdge, layout, showLandscape, tier }),
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-seed={resolvedSeed}
      style={{ ...ink, ...props.style } as CSSProperties}
    >
      {showLandscape ? (
        <div className="m-rice-paper__landscape" aria-hidden="true">
          {ridges.map((ridge) => (
            <div
              key={ridge.key}
              className={`m-rice-paper__ridge ${ridge.className}`}
              style={ridge.style as CSSProperties}
            >
              <span className="m-rice-paper__ridge-wash" />
              <span className="m-rice-paper__ridge-line" />
            </div>
          ))}
        </div>
      ) : null}
      <div className="m-rice-paper__content">{children}</div>
    </div>
  );
}
