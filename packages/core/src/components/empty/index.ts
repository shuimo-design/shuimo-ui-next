/**
 * 空状态的无框架部分：插图选型、画幅参数和 class 派生。
 * 两个壳只剩三层标签和插槽。
 */
import { inkEnsoUrl } from "../../ink/assets/enso";
import { inkRidgeUrl } from "../../ink/assets/ridge";
import type { EmptyProps } from "./types";

export type { EmptyImage, EmptyProps } from "./types";

/** 说明文字的默认值 */
export const EMPTY_DESCRIPTION = "暂无数据";

/** 自定义插图（image 插槽 / imageSlot）优先于内置的 */
export interface EmptyFigureOptions extends Pick<EmptyProps, "image" | "imageSize" | "seed"> {
  /** 用了自定义插图 */
  custom?: boolean;
}

export function emptyClasses(o: EmptyFigureOptions): string[] {
  const { image = "enso", custom = false } = o;
  return ["m-empty", `m-empty--${custom ? "custom" : image}`];
}

/** 自定义插图和内置插图都占插图区，只有 image="none" 且没给插槽时整块不渲染 */
export function emptyHasFigure(o: EmptyFigureOptions): boolean {
  return o.custom === true || (o.image ?? "enso") !== "none";
}

/**
 * 素材按固定画幅生成、靠 mask 缩放到 imageSize，生成器按参数缓存：同一页面多个空状态共用一张。
 * 这里不走素材登记：一个页面上的空状态通常只有一两个，登记省不下什么，
 * 内联反而让服务端和客户端首帧的输出天然一致。
 */
export function emptyStyle(o: EmptyFigureOptions): Record<string, string> {
  const { image = "enso", imageSize = 120, seed = 1, custom = false } = o;
  const vars: Record<string, string> = { "--m-empty-image-size": `${imageSize}px` };
  if (custom) return vars;
  if (image === "enso") {
    vars["--m-empty-figure"] = `url("${inkEnsoUrl({ seed, size: 128, strokeWidth: 9 })}")`;
  } else if (image === "ridge") {
    vars["--m-empty-figure"] =
      `url("${inkRidgeUrl({ seed, width: 320, height: 128, layers: 3, opacity: 0.5, crest: true }).url}")`;
  }
  return vars;
}
