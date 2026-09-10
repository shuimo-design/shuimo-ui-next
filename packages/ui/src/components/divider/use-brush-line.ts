import { onMounted, watch, type Ref } from "vue";
import { useElementSize } from "@vueuse/core";
import { brushLineUrl } from "../../ink/assets/line";
import { applyInkVar } from "../../ink/registry";

/** 长度按 16px 分桶，同桶复用同一张线（brushLineUrl 内部有缓存） */
const BUCKET = 16;

export interface UseBrushLineOptions {
  thickness: number;
  vertical: () => boolean;
  seed?: number;
  /** 手抖幅度 px；默认按笔宽的三成，要笔直的线传 0 */
  wobble?: number;
  /** 边缘噪声 0–1 */
  roughness?: number;
  /** 飞白 0–1：越大越像枯笔，线里断口、丝缕越多 */
  flyingWhite?: number;
}

/**
 * 给一段线元素按实际长度生成笔触线，交给它自己的 CSS 变量：
 *  --m-brush-line-mask：mask 用的 data URL（走素材登记，同长度的线共用一条样式规则）；
 *  --m-brush-line-band：画幅在粗细方向上的尺寸（含晕染余量），内联。
 * 通用的 400px 线横向压到几十像素会糊成发丝、拉到上千像素又会把毛边放大成锯齿，所以每条线单独生成。
 */
export function useBrushLine(target: Ref<HTMLElement | null>, options: UseBrushLineOptions) {
  const { width, height } = useElementSize(target);

  function update() {
    const el = target.value;
    if (!el) return;
    const vertical = options.vertical();
    const raw = vertical ? height.value : width.value;
    // ResizeObserver 挂载瞬间会报一次 0：忽略，保留上一张
    if (raw <= 0) return;
    const length = Math.max(BUCKET, Math.ceil(raw / BUCKET) * BUCKET);
    const line = brushLineUrl({
      seed: options.seed ?? 1,
      length,
      thickness: options.thickness,
      vertical,
      wobble: options.wobble,
      roughness: options.roughness,
      flyingWhite: options.flyingWhite,
    });
    applyInkVar(el, "--m-brush-line-mask", line.url);
    el.style.setProperty("--m-brush-line-band", `${vertical ? line.width : line.height}px`);
  }

  onMounted(update);
  watch([width, height, () => options.vertical()], update);
}
