/**
 * 复选框的无框架部分：class 派生、勾选墨块与半选一横的墨迹素材、方框的笔触参数。
 * 组的取值规则（min / max 能不能再勾、勾完之后的新数组）在 context/checkbox.ts。
 * Vue 和 React 的复选框各自只剩模板和事件绑定，这里的东西两边一字不差地共用。
 */
import { brushLineUrl } from "../../ink/assets/line";
import { generateInkShape } from "../../ink/assets/shape";
import type { BrushBorderControllerOptions } from "../../ink/stroke";
import type { CheckboxGroupProps } from "./types";

export type { CheckboxGroupProps, CheckboxProps, CheckboxValue } from "./types";

/**
 * 方框是四边各一细笔的笔触边框，拐角只略出头，贴近旧版位图那种收得住的手画方框。
 * 参数不随 props 变，整个模块只有这一份。
 */
const BOX_BRUSH: BrushBorderControllerOptions = {
  strokeWidth: 2,
  seed: 11,
  overshoot: 0.6,
  wobble: 0.4,
  flyingWhite: 0.05,
};

export function checkboxBrush(): BrushBorderControllerOptions {
  return BOX_BRUSH;
}

/**
 * 勾选墨块与半选一横都按 4 倍画幅生成再缩到 10px 左右：
 * 素材库的晕染位移是按像素算的，直接画 10px 的形会被位移撕碎。
 */
const MARK_SCALE = 4;
const mark = generateInkShape(40, 36, { seed: 11, raggedness: 0.9, corner: 0.1 });
// 笔触线画幅两端各留 thickness * 1.5 + wobble 的余量（这里是 16px），72 长的画幅里笔画本身约 40px，缩后正好 10px
const bar = brushLineUrl({ seed: 11, length: 72, thickness: 10, flyingWhite: 0.04, wobble: 1 });

/**
 * 两张遮罩都不随 props 变，整个模块只生成一次；返回的是同一个对象引用，
 * 每个复选框内联这一份变量即可（几十字节，不值得走素材登记）。
 * 内联也意味着服务端和客户端首帧输出一致，水合不会报属性不匹配。
 */
const INK_STYLE: Record<string, string> = {
  "--m-checkbox-mark-mask": `url("${mark.url}")`,
  "--m-checkbox-mark-pad": `${mark.padding / MARK_SCALE}px`,
  "--m-checkbox-bar-mask": `url("${bar.url}")`,
  "--m-checkbox-bar-w": `${bar.width / MARK_SCALE}px`,
  "--m-checkbox-bar-band": `${bar.height / MARK_SCALE}px`,
};

export function checkboxInk(): Record<string, string> {
  return INK_STYLE;
}

export function checkboxClasses(o: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
}): string[] {
  return [
    "m-checkbox",
    ...(o.checked ? ["m-checkbox--checked"] : []),
    ...(o.indeterminate ? ["m-checkbox--indeterminate"] : []),
    ...(o.disabled ? ["m-checkbox--disabled"] : []),
  ];
}

/** 半选要报 mixed，无障碍树里才不是"没勾"（原生 input 没有半选态，只能靠 aria） */
export function checkboxAriaChecked(checked: boolean, indeterminate?: boolean): boolean | "mixed" {
  return indeterminate ? "mixed" : checked;
}

export function checkboxGroupClasses(props: CheckboxGroupProps): string[] {
  return ["m-checkbox-group", `m-checkbox-group--${props.direction ?? "horizontal"}`];
}

/** 有没有文字要显示：插槽 / children 优先，其次 label。数字 0 也是文字，所以比的是 undefined */
export function checkboxHasLabel(label: string | number | undefined, hasSlot: boolean): boolean {
  return hasSlot || label !== undefined;
}
