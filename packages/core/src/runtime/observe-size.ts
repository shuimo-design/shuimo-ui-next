/**
 * 监听元素尺寸，替代 @vueuse/core 的 useElementSize。
 *
 * 和它的两处不同，都是有意的：
 * 1. **全库只开两个 ResizeObserver**（border-box、content-box 各一），不是每个调用一个。
 *    一页 50 个按钮原来就是 50 个观察器，现在是 1 个。
 * 2. **建立观察时同步回调一次当前尺寸**，不等下一帧。笔触边框第一帧就能落笔，少一次布局抖动。
 *
 * 服务端没有 ResizeObserver，直接返回空的退订函数，回调一次都不会触发。
 */

export interface SizeBox {
  readonly width: number;
  readonly height: number;
}

export type SizeBoxMode = "border-box" | "content-box";
type SizeListener = (box: SizeBox) => void;

interface Registry {
  observer: ResizeObserver | null;
  targets: WeakMap<Element, Set<SizeListener>>;
}

const registries: Record<SizeBoxMode, Registry> = {
  "border-box": { observer: null, targets: new WeakMap() },
  "content-box": { observer: null, targets: new WeakMap() },
};

function readEntry(entry: ResizeObserverEntry, mode: SizeBoxMode): SizeBox {
  const list = mode === "border-box" ? entry.borderBoxSize : entry.contentBoxSize;
  const size = Array.isArray(list) ? list[0] : (list as unknown as ResizeObserverSize | undefined);
  if (size) return { width: size.inlineSize, height: size.blockSize };
  // 老 Safari 没有 *BoxSize：contentRect 就是 content-box，border-box 只能拿 offset* 兜
  if (mode === "content-box") {
    return { width: entry.contentRect.width, height: entry.contentRect.height };
  }
  const el = entry.target as HTMLElement;
  return { width: el.offsetWidth, height: el.offsetHeight };
}

function readNow(el: Element, mode: SizeBoxMode): SizeBox {
  const node = el as HTMLElement;
  return mode === "border-box"
    ? { width: node.offsetWidth, height: node.offsetHeight }
    : { width: node.clientWidth, height: node.clientHeight };
}

export function observeSize(
  el: Element,
  listener: SizeListener,
  mode: SizeBoxMode = "content-box",
): () => void {
  if (typeof ResizeObserver === "undefined") return () => {};
  const registry = registries[mode];
  registry.observer ??= new ResizeObserver((entries) => {
    for (const entry of entries) {
      const set = registry.targets.get(entry.target);
      if (!set) continue;
      const box = readEntry(entry, mode);
      // oxlint-disable-next-line unicorn/no-useless-spread -- 先复制再遍历：回调里退订不能漏掉后面的
      for (const fn of [...set]) fn(box);
    }
  });
  let set = registry.targets.get(el);
  if (!set) {
    set = new Set();
    registry.targets.set(el, set);
    registry.observer.observe(el, { box: mode });
  }
  set.add(listener);
  listener(readNow(el, mode));
  return () => {
    set.delete(listener);
    if (set.size === 0) {
      registry.targets.delete(el);
      registry.observer?.unobserve(el);
    }
  };
}
