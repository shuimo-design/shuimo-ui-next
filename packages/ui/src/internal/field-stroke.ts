import type { BrushBorderOptions } from "../ink/stroke";

/**
 * 表单控件（输入框、数字框等）共用的笔触边框参数。
 * 旧站的输入框边框是一条很细、近乎平直、拐角略出头的线，比按钮那种粗而抖的笔触克制得多：
 * 笔宽压到 1.4px，手抖只留 0.3px，飞白几乎不要，拐角出头 3px 保留一点手绘感。
 */
export const FIELD_STROKE: BrushBorderOptions = {
  seed: 2,
  strokeWidth: 1.4,
  wobble: 0.3,
  roughness: 0.35,
  flyingWhite: 0.05,
  overshoot: 3,
};
