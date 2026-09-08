/**
 * 转场：
 *  - startInkViewTransition：用 View Transitions API 做整页墨迹擦入，样式见 transition.css；
 *    不支持的浏览器直接执行 update。
 *  - MInkTransition 组件（components/ink-transition）：Vue <Transition> 的墨迹版，进入擦入、离开擦出。
 */
import { wipeMaskUrl, type WipeMaskOptions } from "../reveal/mask";
import "./transition.css";

export interface InkViewTransitionOptions extends WipeMaskOptions {
  /** 毫秒，默认 800；写入 --m-ink-vt-duration */
  duration?: number;
  /** 强制跳过动画；未传则跟随 prefers-reduced-motion */
  reducedMotion?: boolean;
}

interface ViewTransitionLike {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
}

type DocumentWithViewTransition = Document & {
  startViewTransition?: (update: () => void | Promise<void>) => ViewTransitionLike;
};

export function supportsViewTransition(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof (document as DocumentWithViewTransition).startViewTransition === "function"
  );
}

/** 把遮罩与时长写到 :root，transition.css 的 ::view-transition-new(root) 读它们 */
export function prepareInkViewTransition(options: InkViewTransitionOptions = {}): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty(
    "--m-ink-vt-mask",
    `url("${wipeMaskUrl({ ...options, direction: options.direction ?? "right" })}")`,
  );
  root.style.setProperty("--m-ink-vt-duration", `${options.duration ?? 800}ms`);
  const dir = options.direction ?? "right";
  root.style.setProperty(
    "--m-ink-vt-size",
    dir === "right" || dir === "left" ? "200% 100%" : "100% 200%",
  );
  root.style.setProperty(
    "--m-ink-vt-from",
    { right: "100% 0%", left: "0% 0%", down: "0% 100%", up: "0% 0%" }[dir],
  );
  root.style.setProperty(
    "--m-ink-vt-to",
    { right: "0% 0%", left: "100% 0%", down: "0% 0%", up: "0% 100%" }[dir],
  );
}

/**
 * 执行一次带墨迹擦入的 DOM 更新。返回在动画结束后 resolve 的 Promise。
 */
export async function startInkViewTransition(
  update: () => void | Promise<void>,
  options: InkViewTransitionOptions = {},
): Promise<void> {
  const reduced =
    options.reducedMotion ??
    (typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true);
  const doc =
    typeof document !== "undefined" ? (document as DocumentWithViewTransition) : undefined;
  if (reduced || !doc?.startViewTransition) {
    await update();
    return;
  }
  prepareInkViewTransition(options);
  doc.documentElement.classList.add("m-ink-vt");
  try {
    const transition = doc.startViewTransition(update);
    await transition.finished;
  } finally {
    doc.documentElement.classList.remove("m-ink-vt");
  }
}
