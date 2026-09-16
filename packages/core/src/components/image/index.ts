/**
 * 图片的无框架部分。
 *
 * 图片本体只有纯派生：class、尺寸变量、加载状态的判定、预览列表和起始下标。
 * 预览层是一台状态机（开没开、看第几张、放大多少、转了几圈），加上滚轮和方向键，
 * 写成 createImagePreview 控制器；滚动锁、ESC、焦点存还、Tab 循环交给 overlay/modal.ts，
 * 和弹窗 / 抽屉是同一份。两个壳只渲染快照、绑几个按钮。
 */
import { inkSplashUrl } from "../../ink/assets/splash";
import { createModal, type ModalController } from "../../overlay/modal";
import { createStore } from "../../runtime/store";
import type { Controller } from "../../runtime/controller";
import type { ImageFit, ImageProps } from "./types";

export type { ImageEmits, ImageFit, ImageProps, ImageSlots } from "./types";

/** 过渡类名前缀，CSS 里写死的就是这套 */
export const IMAGE_PREVIEW_TRANSITION = "m-image-preview";

/** 加载失败时的默认文案 */
export const IMAGE_ERROR_TEXT = "加载失败";

/** 预览层和工具栏按钮的无障碍名字，两个壳共用这一份 */
export const IMAGE_PREVIEW_LABELS = {
  dialog: "图片预览",
  zoomIn: "放大",
  zoomOut: "缩小",
  rotate: "旋转",
  reset: "还原",
  prev: "上一张",
  next: "下一张",
  close: "关闭",
} as const;

/** 每次放大 / 缩小走多少，以及可到的两端 */
export const IMAGE_ZOOM_STEP = 0.2;
export const IMAGE_ZOOM_MIN = 0.2;
export const IMAGE_ZOOM_MAX = 5;
/** 每次旋转多少度 */
export const IMAGE_ROTATE_STEP = 90;

export type ImageStatus = "loading" | "loaded" | "error";

/**
 * 加载状态由"哪个地址加载成功了 / 失败了"推出来，而不是一个布尔：
 * 换了地址自然回到加载中，两个壳都不用再补一个重置的副作用。
 */
export function imageStatus(o: {
  src: string;
  loadedSrc: string | undefined;
  failedSrc: string | undefined;
}): ImageStatus {
  if (o.failedSrc === o.src) return "error";
  if (o.loadedSrc === o.src) return "loaded";
  return "loading";
}

/**
 * 图片在挂上监听之前就已经加载完（缓存命中、data URL 同步解码）的话，load 事件不会再来，
 * 挂载后拿元素问一次。naturalWidth 为 0 的 complete 是失败，不算加载完
 */
export function imageIsComplete(el: HTMLImageElement | null): boolean {
  return Boolean(el && el.complete && el.naturalWidth > 0);
}

/** 点了能打开预览：开了 preview 且图已经加载出来 */
export function imagePreviewable(o: { preview: boolean; status: ImageStatus }): boolean {
  return o.preview && o.status === "loaded";
}

export function imageClasses(o: {
  fit: ImageFit | undefined;
  status: ImageStatus;
  previewable: boolean;
  sized: boolean;
}): string[] {
  return [
    "m-image",
    `m-image--${o.status}`,
    ...(o.fit ? [`m-image--${o.fit}`] : []),
    ...(o.previewable ? ["m-image--previewable"] : []),
    ...(o.sized ? ["m-image--sized"] : []),
  ];
}

const px = (value: number | string | undefined) =>
  typeof value === "number" ? `${value}px` : value;

/** 宽高走变量，方便用户也用 CSS 改；两个都没给就按图片本身尺寸 */
export function imageStyle(props: Pick<ImageProps, "width" | "height">): Record<string, string> {
  const style: Record<string, string> = {};
  const w = px(props.width);
  const h = px(props.height);
  if (w) style["--m-image-w"] = w;
  if (h) style["--m-image-h"] = h;
  return style;
}

/** 给了宽或高才算定了尺寸，图片这时才撑满容器 */
export function imageSized(props: Pick<ImageProps, "width" | "height">): boolean {
  return props.width !== undefined || props.height !== undefined;
}

/** 原生 loading 属性：只有 lazy 时写 */
export function imageLoading(lazy: boolean): "lazy" | undefined {
  return lazy ? "lazy" : undefined;
}

/** 图片本体上的触发属性：能预览时进 Tab 序列并声明会开一个对话框。两个壳直接展开这一份 */
export interface ImageTriggerAttrs {
  tabindex?: 0;
  "aria-haspopup"?: "dialog";
}

export function imageTriggerAttrs(previewable: boolean): ImageTriggerAttrs {
  return previewable ? { tabindex: 0, "aria-haspopup": "dialog" } : {};
}

/** 预览要翻的列表：没给列表就只有自己 */
export function imagePreviewList(src: string, list: string[] | undefined): string[] {
  return list && list.length > 0 ? list : [src];
}

/** 打开时先看哪一张：initialIndex 优先，其次 src 在列表里的位置，都没有就第一张 */
export function imagePreviewStart(
  list: string[],
  src: string,
  initialIndex: number | undefined,
): number {
  const last = Math.max(0, list.length - 1);
  if (initialIndex !== undefined && Number.isFinite(initialIndex)) {
    return Math.min(last, Math.max(0, Math.floor(initialIndex)));
  }
  const found = list.indexOf(src);
  return found >= 0 ? found : 0;
}

/** 多张时才显示计数和翻页箭头 */
export function imagePreviewHasMany(count: number): boolean {
  return count > 1;
}

export function imagePreviewCounter(index: number, count: number): string {
  return `${index + 1} / ${count}`;
}

/** 预览层根上的变量：层级、挂牌的墨花 */
export function imagePreviewStyle(o: { zIndex?: number; seed: number }): Record<string, string> {
  const style: Record<string, string> = {
    "--m-modal-splash": `url("${inkSplashUrl({ seed: o.seed })}")`,
  };
  if (o.zIndex !== undefined) style["--m-image-preview-z"] = String(o.zIndex);
  return style;
}

/** 预览图的变换：先缩放再旋转，两个壳输出同一串 */
export function imagePreviewImgStyle(o: { scale: number; rotate: number }): Record<string, string> {
  return { transform: `scale(${o.scale}) rotate(${o.rotate}deg)` };
}

/** 缩放对齐到两位小数，免得 0.2 连加出 0.6000000000000001 */
export function clampImageZoom(scale: number): number {
  const clamped = Math.min(IMAGE_ZOOM_MAX, Math.max(IMAGE_ZOOM_MIN, scale));
  return Math.round(clamped * 100) / 100;
}

/** 列表里循环翻页：最后一张再下一张回到第一张 */
export function wrapImageIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

/** 回车 / 空格打开预览 */
export function imageTriggerKey(key: string): boolean {
  return key === "Enter" || key === " ";
}

/* ── 预览控制器 ─────────────────────────────────────────────── */

export interface ImagePreviewOptions {
  /** 预览列表长度 */
  count: number;
  /** 预览打开 */
  onShow: () => void;
  /** 预览关闭 */
  onClose: () => void;
}

export interface ImagePreviewSnapshot {
  /** 预览层开没开 */
  readonly open: boolean;
  /** 正在看列表里的第几张 */
  readonly index: number;
  readonly scale: number;
  /** 顺时针角度，只增不减，CSS 直接用 */
  readonly rotate: number;
}

export interface ImagePreviewController extends Controller<
  ImagePreviewSnapshot,
  ImagePreviewOptions
> {
  /** 预览面板的 ref 回调：焦点送进去、Tab 在里面循环、滚轮缩放都挂在它上面 */
  setPanel(el: HTMLElement | null): void;
  /** 打开并从第 index 张看起；变换归位 */
  open(index: number): void;
  close(): void;
  zoomIn(): void;
  zoomOut(): void;
  rotate(): void;
  /** 缩放和旋转归位 */
  reset(): void;
  /** 上一张 / 下一张，循环；切换时变换归位 */
  prev(): void;
  next(): void;
  /** 挂在面板的 keydown 上：← → 切图，Tab 在面板内循环。ESC 由模态层统一处理 */
  onKeyDown(event: KeyboardEvent): void;
  /** 挂在图片本体的 keydown 上：回车 / 空格打开 */
  onTriggerKeyDown(event: KeyboardEvent, index: number): void;
}

const SERVER_SNAPSHOT: ImagePreviewSnapshot = { open: false, index: 0, scale: 1, rotate: 0 };

export function createImagePreview(initial: ImagePreviewOptions): ImagePreviewController {
  const store = createStore<ImagePreviewSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  let panel: HTMLElement | null = null;

  function close(): void {
    if (!store.get().open) return;
    store.set({ open: false });
    modal.setOpen(false);
    options.onClose();
  }

  // 滚动锁、模态栈、ESC、焦点存还、Tab 循环全在模态层控制器里，和弹窗 / 抽屉是同一份
  const modal: ModalController = createModal({ closeOnEsc: true, onRequestClose: close });

  function zoomBy(delta: number): void {
    store.set({ scale: clampImageZoom(store.get().scale + delta) });
  }

  function show(index: number): void {
    store.set({ index: wrapImageIndex(index, options.count), scale: 1, rotate: 0 });
  }

  function open(index: number): void {
    if (store.get().open) return;
    show(index);
    store.set({ open: true });
    modal.setOpen(true);
    options.onShow();
  }

  /** 滚轮：往上滚放大、往下滚缩小。挂成非被动监听才能拦掉默认滚动 */
  function onWheel(event: WheelEvent): void {
    if (!store.get().open) return;
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? IMAGE_ZOOM_STEP : -IMAGE_ZOOM_STEP);
  }

  return {
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,

    update(next) {
      options = next;
    },

    connect() {
      modal.connect();
    },
    disconnect() {
      modal.disconnect();
      if (store.get().open) store.set({ open: false });
    },

    setPanel(el) {
      panel?.removeEventListener("wheel", onWheel);
      panel = el;
      panel?.addEventListener("wheel", onWheel, { passive: false });
      modal.setPanel(el);
    },

    open,
    close,

    zoomIn() {
      zoomBy(IMAGE_ZOOM_STEP);
    },
    zoomOut() {
      zoomBy(-IMAGE_ZOOM_STEP);
    },
    rotate() {
      store.set({ rotate: store.get().rotate + IMAGE_ROTATE_STEP });
    },
    reset() {
      store.set({ scale: 1, rotate: 0 });
    },
    prev() {
      show(store.get().index - 1);
    },
    next() {
      show(store.get().index + 1);
    },

    onKeyDown(event) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        if (!imagePreviewHasMany(options.count)) return;
        event.preventDefault();
        show(store.get().index + (event.key === "ArrowLeft" ? -1 : 1));
        return;
      }
      modal.trapFocus(event);
    },

    onTriggerKeyDown(event, index) {
      if (!imageTriggerKey(event.key)) return;
      event.preventDefault();
      open(index);
    },
  };
}
