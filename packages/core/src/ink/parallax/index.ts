/**
 * 视差：指针 / 滚动 → 目标偏移，rAF 里做阻尼插值，只写 CSS transform。
 * 尊重 prefers-reduced-motion（强度归零）。
 */
export interface ParallaxLayerTarget {
  element: HTMLElement;
  /** 0 = 最远（几乎不动），1 = 最近（全幅移动） */
  depth: number;
}

export interface ParallaxOptions {
  /** 最近一层的最大位移，px。默认 24 */
  strength?: number;
  /** 阻尼系数 0–1，越小越"重"。默认 0.08 */
  damping?: number;
  /** 滚动联动：每滚动 1px 近景纵向位移多少。默认 0.05；0 关闭 */
  scrollFactor?: number;
  /** 指针事件监听目标，默认 window */
  pointerTarget?: Window | HTMLElement;
  /** 是否响应指针。默认 true */
  pointer?: boolean;
  /** 强制关闭动效；未传则跟随 prefers-reduced-motion */
  reducedMotion?: boolean;
  /**
   * 自定义"滚了多远"的读法，默认读 window.scrollY。
   * 页面在某个滚动容器里滚（不是 window）时，window.scrollY 永远是 0；传这个函数改成读容器或元素自己的位置。
   * 传了它，滚动事件改在捕获阶段监听，任何容器的滚动都收得到
   */
  scrollOffset?: () => number;
}

export interface ParallaxController {
  setLayers(layers: ParallaxLayerTarget[]): void;
  /** 手动设置归一化目标（-1..1），用于陀螺仪或自定义驱动 */
  setTarget(x: number, y: number): void;
  /** 当前插值后的归一化位置 */
  readonly current: { x: number; y: number };
  pause(): void;
  resume(): void;
  dispose(): void;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined"
    ? window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
    : true;
}

export function createParallax(options: ParallaxOptions = {}): ParallaxController {
  const strength = options.strength ?? 24;
  const damping = options.damping ?? 0.08;
  const scrollFactor = options.scrollFactor ?? 0.05;
  const reduced = options.reducedMotion ?? prefersReducedMotion();

  let layers: ParallaxLayerTarget[] = [];
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  let scrollY = 0;
  let frame = 0;
  let paused = false;
  let disposed = false;

  function apply() {
    for (const { element, depth } of layers) {
      const dx = current.x * strength * depth;
      const dy = current.y * strength * depth + scrollY * scrollFactor * depth;
      element.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
    }
  }

  function tick() {
    frame = 0;
    if (paused || disposed) return;
    const dx = target.x - current.x;
    const dy = target.y - current.y;
    current.x += dx * damping;
    current.y += dy * damping;
    apply();
    // 还没收敛就继续
    if (Math.abs(dx) > 0.0005 || Math.abs(dy) > 0.0005) schedule();
  }

  function schedule() {
    if (frame || paused || disposed || typeof requestAnimationFrame === "undefined") return;
    frame = requestAnimationFrame(tick);
  }

  const onPointerMove = (event: PointerEvent) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    target.x = (event.clientX / w) * 2 - 1;
    target.y = (event.clientY / h) * 2 - 1;
    schedule();
  };
  const onPointerLeave = () => {
    target.x = 0;
    target.y = 0;
    schedule();
  };
  const readScroll = options.scrollOffset ?? (() => window.scrollY);
  const onScroll = () => {
    scrollY = readScroll();
    apply();
  };
  /** 自定义读法时在捕获阶段听：scroll 事件不冒泡，只有这样才收得到内层容器的滚动 */
  const scrollListen: AddEventListenerOptions = {
    passive: true,
    capture: Boolean(options.scrollOffset),
  };

  const pointerTarget =
    options.pointerTarget ?? (typeof window !== "undefined" ? window : undefined);
  const listening = !reduced && typeof window !== "undefined";
  if (listening) {
    if (options.pointer !== false && pointerTarget) {
      pointerTarget.addEventListener("pointermove", onPointerMove as EventListener, {
        passive: true,
      });
      pointerTarget.addEventListener("pointerleave", onPointerLeave, { passive: true });
    }
    if (scrollFactor !== 0) window.addEventListener("scroll", onScroll, scrollListen);
  }

  return {
    current,
    setLayers(next) {
      layers = next;
      apply();
    },
    setTarget(x, y) {
      if (reduced) return;
      target.x = Math.max(-1, Math.min(1, x));
      target.y = Math.max(-1, Math.min(1, y));
      schedule();
    },
    pause() {
      paused = true;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    },
    resume() {
      paused = false;
      schedule();
    },
    dispose() {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      if (listening) {
        pointerTarget?.removeEventListener("pointermove", onPointerMove as EventListener);
        pointerTarget?.removeEventListener("pointerleave", onPointerLeave);
        window.removeEventListener("scroll", onScroll, scrollListen);
      }
      for (const { element } of layers) element.style.transform = "";
      layers = [];
    },
  };
}
