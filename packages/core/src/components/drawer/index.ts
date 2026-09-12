/**
 * 抽屉的无框架部分。行为（滚动锁、模态栈、ESC、焦点陷阱）和弹窗共用 overlay/modal.ts，
 * 外观（纸框、四角回纹、挂牌）和弹窗共用 internal/modal-ink.css，这里只剩方向相关的东西。
 */
import { inkLatticeUrl } from "../../ink/assets/lattice";
import { inkSplashUrl } from "../../ink/assets/splash";
import type { BrushBorderControllerOptions } from "../../ink/stroke";
import type { DrawerDirection, DrawerProps } from "./types";

export type { DrawerDirection, DrawerEmits, DrawerProps, DrawerSlots } from "./types";

/** 过渡类名前缀，CSS 里写死的就是这套 */
export const DRAWER_TRANSITION = "m-drawer";

/**
 * 纸框、四角回纹、挂牌都和弹窗同一套；只有题头小景抽屉不要。
 * 5px 一笔、边缘晕成干笔毛边；四角留空给回纹，实线在角饰第一根条处停笔（[横边, 竖边]，px）。
 * 留空的数值和弹窗一模一样：回纹那张图往框外探 12px、框角点落在框线的角上，
 * 两边关系和弹窗一致，所以 cornerGap 不用动。左上角也按回纹留空，不用像弹窗那样给山脚让路。
 */
export function drawerBrush(seed: number): BrushBorderControllerOptions {
  return {
    seed,
    strokeWidth: 5,
    roughness: 0.6,
    flyingWhite: 0.1,
    overshoot: 0,
    wobble: 0.8,
    bleed: { scale: 2.5, blur: 0.6 },
    cornerGap: { tl: [19.5, 26], tr: [17.9, 17.5], br: [18, 17.5], bl: [18, 17.5] },
    specks: 1,
  };
}

export function drawerClasses(direction: DrawerDirection, masked: boolean): string[] {
  return ["m-drawer", `m-drawer--${direction}`, ...(masked ? ["m-drawer--masked"] : [])];
}

export function drawerStyle(props: Pick<DrawerProps, "seed" | "size">): Record<string, string> {
  const seed = props.seed ?? 1;
  const style: Record<string, string> = {
    "--m-modal-splash": `url("${inkSplashUrl({ seed })}")`,
  };
  for (const corner of ["tl", "tr", "br", "bl"] as const) {
    style[`--m-modal-lattice-${corner}`] =
      `url("${inkLatticeUrl({ seed, corner, size: 64, strokeWidth: 2 })}")`;
  }
  if (props.size !== undefined) {
    style["--m-drawer-size"] = typeof props.size === "number" ? `${props.size}px` : props.size;
  }
  return style;
}
