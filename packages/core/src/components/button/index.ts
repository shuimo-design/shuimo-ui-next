/**
 * 按钮的无框架部分：类型、笔触参数、以及"props → class / 墨迹绑定"的纯派生。
 * Vue 和 React 的按钮各自只剩模板和事件绑定，这里的东西两边一字不差地共用。
 */
import { inkScaleUrl } from "../../ink/assets/scale";
import { inkShapeUrl } from "../../ink/assets/shape";
import { inkVarBindings, type InkVarBindings } from "../../ink/registry";
import type { BrushBorderControllerOptions } from "../../ink/stroke";
import type { ButtonProps, ButtonType } from "./types";

export type { ButtonProps, ButtonType } from "./types";

/** 文字型按钮没有色块也没有边框 */
export function isSolidButton(type: ButtonType = "default"): boolean {
  return type !== "text";
}

/**
 * 文字型按钮不落笔；其余类型套一圈深墨笔触边框，对应旧库的手绘 border-image。
 * 旧框四角是收住的、不出头，所以把拐角出头压到最小。
 */
export function buttonBrush(solid: boolean): BrushBorderControllerOptions {
  return { strokeWidth: 3, seed: 3, overshoot: 0.5, wobble: 0.6, enabled: solid };
}

export function buttonClasses(props: ButtonProps): string[] {
  const { type = "default", disabled = false, loading = false } = props;
  return [
    "m-button",
    `m-button--${type}`,
    ...(disabled ? ["m-button--disabled"] : []),
    ...(loading ? ["m-button--loading"] : []),
  ];
}

/** 禁用或加载中时吞掉点击 */
export function buttonInert(props: ButtonProps): boolean {
  return props.disabled === true || props.loading === true;
}

/** 旧库色块上那层鱼鳞纹，固定瓦片，整个模块只生成一次 */
const scale = inkScaleUrl();

export interface ButtonInk extends InkVarBindings {
  style: Record<string, string>;
}

/**
 * 色块本身也撕成毛边：按按钮实际尺寸生成遮罩（8px 分桶缓存），色块边缘在笔触框下若隐若现。
 * 鱼鳞纹瓦片全局一张、毛边遮罩按尺寸分桶：走素材登记，同一张图在样式表里只写一次、
 * 元素上只挂一个属性；登记不了（还没挂载、或服务端）才内联。
 */
export function buttonInk(o: {
  solid: boolean;
  width: number;
  height: number;
  registered: boolean;
}): ButtonInk {
  const shape =
    o.solid && o.width && o.height
      ? inkShapeUrl(o.width, o.height, { seed: 3, raggedness: 0.4, corner: 0.06 })
      : undefined;
  const bindings = inkVarBindings(
    {
      "--m-button-scale": o.solid ? scale.url : undefined,
      "--m-button-shape": shape?.url,
    },
    o.registered,
  );
  return {
    attrs: bindings.attrs,
    style: {
      ...bindings.style,
      // 文字型按钮不铺鱼鳞纹；"none" 不是图，仍旧内联
      ...(o.solid ? {} : { "--m-button-scale": "none" }),
      "--m-button-scale-size": `${scale.width}px ${scale.height}px`,
      ...(shape ? { "--m-button-shape-pad": `${shape.padding}px` } : {}),
    },
  };
}
