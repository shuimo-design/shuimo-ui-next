import {
  useCallback,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  IMAGE_ERROR_TEXT,
  IMAGE_PREVIEW_LABELS,
  IMAGE_PREVIEW_TRANSITION,
  createImagePreview,
  imageClasses,
  imageIsComplete,
  imageLoading,
  imagePreviewCounter,
  imagePreviewHasMany,
  imagePreviewImgStyle,
  imagePreviewList,
  imagePreviewStart,
  imagePreviewStyle,
  imagePreviewable,
  imageSized,
  imageStatus,
  imageStyle,
  imageTriggerAttrs,
  resolvePortalTarget,
  type ImageProps as CoreImageProps,
} from "@shuimo-design/core";
import {
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconMinus,
  IconPlus,
  IconRestore,
  IconRotate,
} from "../../icons";
import { useController, useMounted } from "../../runtime";
import { MTransition } from "../../transition";
import { MSkeletonItem } from "../skeleton";

export interface MImageProps extends CoreImageProps {
  /** 图片加载完成 */
  onLoad?: (event: SyntheticEvent<HTMLImageElement, Event>) => void;
  /** 图片加载失败 */
  onError?: (event: SyntheticEvent<HTMLImageElement, Event>) => void;
  /** 预览打开 */
  onShow?: () => void;
  /** 预览关闭 */
  onClose?: () => void;
  /** 加载中的占位（对应 Vue 的 placeholder 插槽）；不给就是一块骨架 */
  renderPlaceholder?: () => ReactNode;
  /** 加载失败时的内容（对应 Vue 的 error 插槽）；不给就显示「加载失败」 */
  renderError?: () => ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MImage(props: MImageProps) {
  const {
    src,
    alt,
    fit,
    width,
    height,
    lazy = false,
    preview = true,
    previewSrcList,
    initialIndex,
    zIndex,
    seed = 1,
    renderPlaceholder,
    renderError,
  } = props;

  // 记"哪个地址成功 / 失败了"而不是布尔：换了地址自然回到加载中，不用再补一个重置的副作用
  const [loadedSrc, setLoadedSrc] = useState<string | undefined>(undefined);
  const [failedSrc, setFailedSrc] = useState<string | undefined>(undefined);
  const status = imageStatus({ src, loadedSrc, failedSrc });
  const previewable = imagePreviewable({ preview, status });
  const sized = imageSized({ width, height });

  function onLoad(event: SyntheticEvent<HTMLImageElement, Event>) {
    setLoadedSrc(src);
    props.onLoad?.(event);
  }
  function onError(event: SyntheticEvent<HTMLImageElement, Event>) {
    setFailedSrc(src);
    props.onError?.(event);
  }
  /** 缓存命中的图在监听挂上之前就加载完了，load 不会再来，挂上时问一次 */
  const imgRef = useCallback(
    (el: HTMLImageElement | null) => {
      if (imageIsComplete(el)) setLoadedSrc(src);
    },
    [src],
  );

  /* ── 预览层 ─────────────────────────────────────────────── */
  const list = imagePreviewList(src, previewSrcList);
  const start = imagePreviewStart(list, src, initialIndex);
  // 开合、翻页、缩放、旋转、滚轮、方向键全在 core 的控制器里；滚动锁 / ESC / 焦点由它里面的模态层管
  const [viewer, state] = useController(createImagePreview, {
    count: list.length,
    onShow: () => props.onShow?.(),
    onClose: () => props.onClose?.(),
  });
  // ref 回调的身份必须稳定：变了 React 会先 ref(null) 再 ref(node)，控制器手里的面板会来回换
  const panelRef = useCallback((el: HTMLElement | null) => viewer.setPanel(el), [viewer]);

  const many = imagePreviewHasMany(list.length);
  const mounted = useMounted();
  // 浮层在服务端一律不渲染：createPortal 在服务端会直接抛错，首帧也要和服务端一致
  const target = mounted ? resolvePortalTarget(true) : null;

  // 开着才有节点：MTransition 关着时返回 null，离场动画播完再卸
  const layer = target
    ? createPortal(
        <MTransition name={IMAGE_PREVIEW_TRANSITION} in={state.open}>
          <div
            className="m-image-preview"
            style={imagePreviewStyle({ zIndex, seed }) as CSSProperties}
          >
            <div className="m-image-preview__mask" onClick={() => viewer.close()} />
            <div
              ref={panelRef}
              className="m-image-preview__panel"
              role="dialog"
              aria-modal="true"
              aria-label={IMAGE_PREVIEW_LABELS.dialog}
              tabIndex={-1}
              onKeyDown={(event: KeyboardEvent<HTMLElement>) => viewer.onKeyDown(event.nativeEvent)}
            >
              <img
                className="m-image-preview__img"
                src={list[state.index]}
                alt={alt}
                style={imagePreviewImgStyle(state) as CSSProperties}
                draggable={false}
              />
              {many ? (
                <button
                  type="button"
                  className="m-image-preview__arrow m-image-preview__arrow--prev"
                  aria-label={IMAGE_PREVIEW_LABELS.prev}
                  onClick={() => viewer.prev()}
                >
                  <IconChevronLeft />
                </button>
              ) : null}
              {many ? (
                <button
                  type="button"
                  className="m-image-preview__arrow m-image-preview__arrow--next"
                  aria-label={IMAGE_PREVIEW_LABELS.next}
                  onClick={() => viewer.next()}
                >
                  <IconChevronRight />
                </button>
              ) : null}
              <div
                className="m-image-preview__toolbar"
                role="toolbar"
                aria-label={IMAGE_PREVIEW_LABELS.dialog}
              >
                <button
                  type="button"
                  className="m-image-preview__tool"
                  aria-label={IMAGE_PREVIEW_LABELS.zoomOut}
                  onClick={() => viewer.zoomOut()}
                >
                  <IconMinus />
                </button>
                <button
                  type="button"
                  className="m-image-preview__tool"
                  aria-label={IMAGE_PREVIEW_LABELS.zoomIn}
                  onClick={() => viewer.zoomIn()}
                >
                  <IconPlus />
                </button>
                <button
                  type="button"
                  className="m-image-preview__tool"
                  aria-label={IMAGE_PREVIEW_LABELS.rotate}
                  onClick={() => viewer.rotate()}
                >
                  <IconRotate />
                </button>
                <button
                  type="button"
                  className="m-image-preview__tool"
                  aria-label={IMAGE_PREVIEW_LABELS.reset}
                  onClick={() => viewer.reset()}
                >
                  <IconRestore />
                </button>
                {many ? (
                  <span className="m-image-preview__counter" aria-live="polite">
                    {imagePreviewCounter(state.index, list.length)}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                className="m-image-preview__close"
                aria-label={IMAGE_PREVIEW_LABELS.close}
                onClick={() => viewer.close()}
              >
                {/* 牌顶的墨渍和牌底的坠子只在 m.ink 层显示 */}
                <span className="m-image-preview__close-splash" aria-hidden="true" />
                <IconClose />
                <span className="m-image-preview__close-tassel" aria-hidden="true" />
              </button>
            </div>
          </div>
        </MTransition>,
        target,
      )
    : null;

  return (
    <>
      <div
        className={[...imageClasses({ fit, status, previewable, sized }), props.className]
          .filter(Boolean)
          .join(" ")}
        style={{ ...imageStyle({ width, height }), ...props.style } as CSSProperties}
      >
        <img
          ref={imgRef}
          className="m-image__img"
          src={src}
          alt={alt}
          loading={imageLoading(lazy)}
          {...imageTriggerAttrs(previewable)}
          onLoad={onLoad}
          onError={onError}
          onClick={() => previewable && viewer.open(start)}
          onKeyDown={(event: KeyboardEvent<HTMLImageElement>) =>
            previewable && viewer.onTriggerKeyDown(event.nativeEvent, start)
          }
        />
        {status === "loading" ? (
          <div className="m-image__placeholder" aria-hidden="true">
            {renderPlaceholder ? renderPlaceholder() : <MSkeletonItem variant="image" />}
          </div>
        ) : null}
        {status === "error" ? (
          <div className="m-image__error" role="img" aria-label={alt}>
            {renderError ? renderError() : IMAGE_ERROR_TEXT}
          </div>
        ) : null}
      </div>
      {layer}
    </>
  );
}
