/**
 * 加载指示器的无框架部分：八团墨点的坐标、class 派生、速度与尺寸变量、无障碍文案。
 * 坐标算一次就是一串字符串，两个壳直接塞进 <polygon points>，不各算一遍。
 */
import { blobPoints } from "../../ink/assets/brush";
import { createRng } from "../../ink/random";
import type { LoadingProps } from "./types";

export type { LoadingProps } from "./types";

/** 墨点数量 */
const DOTS = 8;
/** 指示器画幅，墨点坐标都在这个盒子里；两个壳的 viewBox 用同一个值 */
export const LOADING_VIEW_BOX = "0 0 48 48";
/** 没有文字时给屏幕阅读器的兜底名称 */
const DEFAULT_LABEL = "加载中";

export interface LoadingDot {
  /** <polygon points> 的值 */
  points: string;
  /** fill-opacity，从笔尾到笔头由淡转浓 */
  opacity: string;
}

/**
 * 一笔转圈：八团毛边墨点沿圆周排开，从笔尾到笔头越来越大、越来越浓，
 * 转起来像一笔拖出的墨尾。形状由 seed 决定，同 seed 同图，服务端也算得出来。
 */
export function loadingDots(props: LoadingProps = {}): LoadingDot[] {
  const { seed = 1 } = props;
  const rng = createRng(seed * 13 + 5);
  return Array.from({ length: DOTS }, (_, i) => {
    const t = i / (DOTS - 1);
    const angle = (i / DOTS) * Math.PI * 2;
    return {
      points: blobPoints(
        24 + Math.cos(angle) * 15,
        24 + Math.sin(angle) * 15,
        2 + 3 * t,
        rng,
        0.18,
        32,
      ),
      opacity: (0.3 + 0.7 * t).toFixed(2),
    };
  });
}

export function loadingClasses(props: LoadingProps = {}): string[] {
  return ["m-loading", ...(props.mask ? ["m-loading--mask"] : [])];
}

export function loadingVars(props: LoadingProps = {}): Record<string, string> {
  const { speed = 2000, size = 40 } = props;
  return { "--m-loading-speed": `${speed}ms`, "--m-loading-size": `${size}px` };
}

/** 有文字就用文字当无障碍名称，没有就用兜底文案 */
export function loadingLabel(props: LoadingProps = {}): string {
  return props.text ?? DEFAULT_LABEL;
}
