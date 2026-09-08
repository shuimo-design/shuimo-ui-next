import { onMounted, type Directive, type Ref } from "vue";
import { wipeMaskUrl, type WipeMaskOptions } from "./mask";
import "./reveal.css";

export { wipeMaskUrl, type WipeMaskOptions } from "./mask";

export interface InkRevealOptions extends WipeMaskOptions {
  /** 毫秒，默认 900 */
  duration?: number;
  delay?: number;
  easing?: string;
  /** 反向：把元素"擦掉" */
  reverse?: boolean;
  /** 作用在伪元素上（如笔触边框的 ::before） */
  pseudoElement?: string;
  /** 强制不做动画；未传则跟随 prefers-reduced-motion */
  reducedMotion?: boolean;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

const AXIS: Record<
  NonNullable<WipeMaskOptions["direction"]>,
  { size: string; from: string; to: string }
> = {
  right: { size: "200% 100%", from: "100% 0%", to: "0% 0%" },
  left: { size: "200% 100%", from: "0% 0%", to: "100% 0%" },
  down: { size: "100% 200%", from: "0% 100%", to: "0% 0%" },
  up: { size: "100% 200%", from: "0% 0%", to: "0% 100%" },
};

/**
 * 让元素以墨迹擦入的方式出现（或 reverse 擦掉）。返回 Animation 的 finished。
 * 动画期间给元素挂 mask；结束后清掉，不影响元素原有样式。
 */
export function revealElement(el: HTMLElement, options: InkRevealOptions = {}): Promise<void> {
  const reduced = options.reducedMotion ?? prefersReducedMotion();
  const direction = options.direction ?? "right";
  const axis = AXIS[direction];
  if (reduced || typeof el.animate !== "function") {
    if (options.reverse) el.style.visibility = "hidden";
    return Promise.resolve();
  }
  const url = wipeMaskUrl({ ...options, direction });
  const target = options.pseudoElement ? `${options.pseudoElement}` : "";
  const setVar = (name: string, value: string) => el.style.setProperty(name, value);
  // 通过 CSS 变量把遮罩交给 reveal.css（伪元素拿不到 inline style，只能靠变量）
  setVar("--m-ink-reveal-mask", `url("${url}")`);
  setVar("--m-ink-reveal-size", axis.size);
  el.setAttribute("data-ink-reveal", target ? "pseudo" : "self");
  const [from, to] = options.reverse ? [axis.to, axis.from] : [axis.from, axis.to];
  const animation = el.animate(
    [
      { maskPosition: from, WebkitMaskPosition: from } as Keyframe,
      { maskPosition: to, WebkitMaskPosition: to } as Keyframe,
    ],
    {
      duration: options.duration ?? 900,
      delay: options.delay ?? 0,
      easing: options.easing ?? "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "both",
      ...(target ? { pseudoElement: target } : {}),
    },
  );
  return animation.finished.then(
    () => {
      if (options.reverse) {
        el.style.visibility = "hidden";
      }
      animation.cancel();
      el.removeAttribute("data-ink-reveal");
      el.style.removeProperty("--m-ink-reveal-mask");
      el.style.removeProperty("--m-ink-reveal-size");
    },
    () => {},
  );
}

/** 挂载后自动擦入 */
export function useInkReveal(target: Ref<HTMLElement | null>, options: InkRevealOptions = {}) {
  onMounted(() => {
    if (target.value) void revealElement(target.value, options);
  });
}

/** v-ink-reveal / v-ink-reveal="{ duration: 600, direction: 'down' }" */
export const vInkReveal: Directive<HTMLElement, InkRevealOptions | undefined> = {
  mounted(el, binding) {
    void revealElement(el, binding.value ?? {});
  },
};
