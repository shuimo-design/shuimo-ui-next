/**
 * 弹窗的无框架部分：笔触参数、四角回纹与题头小景的素材、根元素上的变量。
 * 行为（滚动锁、模态栈、ESC、焦点陷阱）在 overlay/modal.ts，抽屉和确认框共用。
 */
import { inkLatticeUrl } from "../../ink/assets/lattice";
import { inkSceneSvg } from "../../ink/assets/scene";
import { inkSplashUrl } from "../../ink/assets/splash";
import type { BrushBorderControllerOptions } from "../../ink/stroke";
import { sanitizeId } from "../../runtime/id";
import type { DialogProps } from "./types";

export type { DialogEmits, DialogProps, DialogSlots, ModalMask } from "./types";

/** 过渡类名前缀，CSS 里写死的就是这套；两个框架必须产出同一串类名 */
export const DIALOG_TRANSITION = "m-dialog";

/**
 * 纸框：5px 一笔，边缘晕成干笔毛边、粗细缓慢起伏（旧版底图就是这样的软边）。
 * 拐角留空给回纹：四角各是一套老图描下来的图案，实线在角饰第一根条处停笔，
 * 每个角的两条边各自留（[横边, 竖边]，px）——
 * 左上的上边线整段藏在山下面，左边线从横带底沿（26px）起笔；
 * 右上的上边线停在竖杠（右 17.9px）、右边线从横带底（17.5px）起笔；
 * 左下、右下的下边线在粗竖杠（离侧边 18px）处停笔、侧边线在长横线（底上 17.5px）处停笔；
 * 沿线洒少许溅点。
 */
export function dialogBrush(seed: number): BrushBorderControllerOptions {
  return {
    seed,
    strokeWidth: 5,
    roughness: 0.6,
    flyingWhite: 0.1,
    overshoot: 0,
    wobble: 0.8,
    bleed: { scale: 2.5, blur: 0.6 },
    cornerGap: { tl: [40, 26], tr: [17.9, 17.5], br: [18, 17.5], bl: [18, 17.5] },
    specks: 1,
  };
}

/**
 * 题头小景是内联 SVG，滤镜 / 渐变 id 要全页唯一：组件 id 保证同一个应用里不撞；
 * 页面上有多个应用时 useId 会重复，再把 seed 编进去 —— 同 seed 撞了也是同一份定义，画出来一样。
 */
export function dialogScene(seed: number, uid: string): string {
  return inkSceneSvg({ seed, id: `m-dialog-scene-${seed}-${sanitizeId(uid)}` });
}

const px = (value: number | string | undefined) =>
  typeof value === "number" ? `${value}px` : value;

/** 四角回纹是 SVG 遮罩，通过变量交给 m.ink 层；宽高覆盖也走变量，方便用户用 CSS 改 */
export function dialogStyle(
  props: Pick<DialogProps, "seed" | "width" | "height">,
): Record<string, string> {
  const seed = props.seed ?? 1;
  const style: Record<string, string> = {
    "--m-modal-splash": `url("${inkSplashUrl({ seed })}")`,
  };
  for (const corner of ["tl", "tr", "br", "bl"] as const) {
    style[`--m-modal-lattice-${corner}`] =
      `url("${inkLatticeUrl({ seed, corner, size: 64, strokeWidth: 2 })}")`;
  }
  const w = px(props.width);
  const h = px(props.height);
  if (w) style["--m-dialog-w"] = w;
  if (h) style["--m-dialog-h"] = h;
  return style;
}
