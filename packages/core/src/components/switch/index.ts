/**
 * 开关的无框架部分：值映射（activeValue / inactiveValue ↔ 布尔的 checked）、class 派生，
 * 以及轨道那"一抹"和滑钮外那圈手画方框的墨迹素材。
 * Vue 和 React 的开关各自只剩模板和事件绑定，这里的东西两边一字不差地共用。
 */
import { brushLineUrl } from "../../ink/assets/line";
import { brushPolygonUrl } from "../../ink/assets/polygon";
import type { SwitchValue } from "./types";

export type { SwitchProps, SwitchValue } from "./types";

/** 轨道长度 / 滑钮边长，要和 switch.css 里的默认变量一致；用户改了变量，遮罩会按 100% 跟着拉伸 */
const TRACK_LENGTH = 56;
const CORE_SIZE = 18;
/** 方框比墨块每边多出 2px，像旧版那张手绘边框浮在色块外面 */
const FRAME_OUT = 2;

// 轨道是一抹：起笔按住、向右越写越细，收笔飞白。按轨道实际长度生成，通用长线横向硬压会糊成发丝
// 画幅两端只留 3px：默认留白是按笔宽算的，56px 的短线会被吃掉一大半
const line = brushLineUrl({ seed: 5, length: TRACK_LENGTH, thickness: 10, taper: true, endPad: 3 });
// 滑钮外那圈手画的方框：四边各一笔，拐角出头
const frame = brushPolygonUrl(
  [
    [-FRAME_OUT, -FRAME_OUT],
    [CORE_SIZE + FRAME_OUT, -FRAME_OUT],
    [CORE_SIZE + FRAME_OUT, CORE_SIZE + FRAME_OUT],
    [-FRAME_OUT, CORE_SIZE + FRAME_OUT],
  ],
  CORE_SIZE,
  CORE_SIZE,
  { seed: 11, strokeWidth: 2, roughness: 0.6, flyingWhite: 0.08, overshoot: 1.5 },
);

/**
 * 两张遮罩都不含随机参数以外的输入，整个模块只生成一次；返回的是同一个对象引用，
 * 每个开关都内联这一份变量即可（几十字节，不值得走素材登记）。
 */
const INK_STYLE: Record<string, string> = {
  "--m-switch-line-mask": `url("${line.url}")`,
  "--m-switch-line-band": `${line.height}px`,
  "--m-switch-frame-mask": `url("${frame.url}")`,
  "--m-switch-frame-pad": `${frame.padding}px`,
};

export function switchInk(): Record<string, string> {
  return INK_STYLE;
}

/** 绑定值等于 activeValue 才算打开；非布尔的 activeValue（"night" / 1）走同一条路 */
export function switchChecked<T extends SwitchValue>(value: T | undefined, activeValue: T) {
  return value === activeValue;
}

/** 点一下之后"将要变成"的值；类型跟着 activeValue 走，壳层能原样写回 v-model */
export function switchNextValue<T extends SwitchValue>(
  checked: boolean,
  activeValue: T,
  inactiveValue: T,
): T {
  return checked ? inactiveValue : activeValue;
}

/** 禁用或加载中都不响应点击 */
export function switchInert(o: { disabled?: boolean; loading?: boolean }): boolean {
  return o.disabled === true || o.loading === true;
}

export function switchClasses(o: {
  checked: boolean;
  disabled?: boolean;
  loading?: boolean;
}): string[] {
  return [
    "m-switch",
    ...(o.checked ? ["m-switch--checked"] : []),
    ...(o.disabled ? ["m-switch--disabled"] : []),
    ...(o.loading ? ["m-switch--loading"] : []),
  ];
}
