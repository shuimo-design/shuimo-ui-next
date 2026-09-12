/**
 * 标签的无框架部分：类型、class 派生、三段底图与关闭叉的墨迹绑定。
 * Vue 和 React 的标签各自只剩模板和事件绑定，这里的东西两边一字不差地共用。
 */
import { inkMarkUrl } from "../../ink/assets/mark";
import { inkTagFrame } from "../../ink/assets/tag";
import { inkVarBindings, type InkVarBindings } from "../../ink/registry";
import type { TagProps } from "./types";

export type { TagProps, TagSize, TagType } from "./types";

/** 关闭按钮的无障碍名称 */
export const TAG_CLOSE_LABEL = "关闭";

export function tagClasses(props: TagProps): string[] {
  const { type = "default", size = "md", disabled = false } = props;
  return ["m-tag", `m-tag--${type}`, `m-tag--${size}`, ...(disabled ? ["m-tag--disabled"] : [])];
}

/** 禁用时关闭按钮不响应（原生 disabled 已经挡住鼠标，键盘和程序派发的事件还要这道守卫） */
export function tagCloseInert(props: TagProps): boolean {
  return props.disabled === true;
}

/**
 * 底图是旧库三段手绘 SVG：左右收口按高度等比，中段横向平铺。
 * 手绘路径没有随机量，整个模块只生成一次。
 */
const frame = inkTagFrame();

export interface TagInk extends InkVarBindings {
  style: Record<string, string>;
}

/**
 * 三段底图每个标签都一样、叉号按种子分桶：走素材登记，同一张图在样式表里只写一次，
 * 元素上只挂一个短属性；一页几十个标签不再各自内联一份几十 KB 的 data URL。
 *
 * `registered` 服务端和水合首帧必须是 false（内联），挂载后才升级成属性，否则两边输出对不上。
 * 收口宽高比和 color 一律内联：它们是几个字符的数字/颜色，登记反而更贵。
 */
export function tagInk(o: { seed?: number; color?: string; registered: boolean }): TagInk {
  const bindings = inkVarBindings(
    {
      "--m-tag-left": frame.left,
      "--m-tag-body": frame.body,
      "--m-tag-right": frame.right,
      "--m-tag-cross": inkMarkUrl("cross", { seed: o.seed ?? 1, strokeWidth: 3 }),
    },
    o.registered,
  );
  return {
    attrs: bindings.attrs,
    style: {
      ...bindings.style,
      "--m-tag-cap-l": String(frame.leftRatio),
      "--m-tag-cap-r": String(frame.rightRatio),
      ...(o.color ? { "--m-tag-color": o.color } : {}),
    },
  };
}
