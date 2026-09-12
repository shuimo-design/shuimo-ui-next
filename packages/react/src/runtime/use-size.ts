import { useCallback, useRef, useState } from "react";
import { observeSize, type SizeBox, type SizeBoxMode } from "@shuimo-design/core";

/**
 * 量元素尺寸。返回 [ref 回调, 尺寸]，尺寸的初值是 0×0 —— 服务端和水合首帧就是这个值，
 * 所以拿尺寸算出来的东西（毛边色块、笔触线）首帧一律不渲染，挂载后才补上。
 */
export function useSize(
  mode: SizeBoxMode = "border-box",
): [(el: HTMLElement | null) => void, SizeBox] {
  const [size, setSize] = useState<SizeBox>({ width: 0, height: 0 });
  const stop = useRef<(() => void) | undefined>(undefined);
  const ref = useCallback(
    (el: HTMLElement | null) => {
      stop.current?.();
      stop.current = undefined;
      if (!el) return;
      stop.current = observeSize(
        el,
        (box) =>
          setSize((prev) => (prev.width === box.width && prev.height === box.height ? prev : box)),
        mode,
      );
    },
    [mode],
  );
  return [ref, size];
}
