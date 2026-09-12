/**
 * 步骤条的无框架部分：class 派生、状态推断、节点里那几张墨迹素材、连接线的笔触参数。
 * 序号和"是不是最后一步"由两个壳从 children 顺序数出来再传进来（见 context/steps.ts 的说明）。
 */
import { inkBlobUrl } from "../../ink/assets/blob";
import { inkEnsoUrl } from "../../ink/assets/enso";
import { inkMarkUrl } from "../../ink/assets/mark";
import { type StepsContextValue } from "../../context/steps";
import type { BrushLineControllerOptions } from "../divider";
import type { StepStatus, StepsProps } from "./types";

export type {
  StepProps,
  StepSlots,
  StepStatus,
  StepsDirection,
  StepsProps,
  StepsSlots,
} from "./types";
export {
  STEPS_CONTEXT_DEFAULT,
  STEP_INDEX_DEFAULT,
  type StepIndexContextValue,
  type StepsContextValue,
} from "../../context/steps";

export function stepsClasses(props: StepsProps): string[] {
  const { direction = "horizontal", simple = false } = props;
  return ["m-steps", `m-steps--${direction}`, ...(simple ? ["m-steps--simple"] : [])];
}

export function stepClasses(o: { status: StepStatus; last: boolean }): string[] {
  return ["m-step", `m-step--${o.status}`, ...(o.last ? ["m-step--last"] : [])];
}

/**
 * 这一步是什么状态：自己传了 status 就听自己的；
 * 否则看序号和 MSteps 的 active 的关系 —— 在前面的算完成、正好是它的用整组的 status、在后面的算等待。
 * 不在 MSteps 里（group 是 undefined）时永远是等待：单独一步没有"进行到哪"可言。
 */
export function stepStatus(o: {
  own: StepStatus | undefined;
  index: number;
  group: StepsContextValue | undefined;
}): StepStatus {
  if (o.own) return o.own;
  if (!o.group) return "wait";
  if (o.index < o.group.active) return "finish";
  if (o.index === o.group.active) return o.group.status;
  return "wait";
}

/** 最后一步不画到下一步的连接线 */
export function stepIsLast(index: number, count: number): boolean {
  return index >= count - 1;
}

/** 节点里显示的序号，从 1 起。不叫 stepNumber：那个名字被数字输入框的"步进值"占了 */
export function stepOrdinal(index: number): number {
  return index + 1;
}

/** 只有正在进行的那一步标 aria-current */
export function stepAriaCurrent(status: StepStatus): "step" | undefined {
  return status === "process" ? "step" : undefined;
}

export function stepIsVertical(group: StepsContextValue | undefined): boolean {
  return group?.direction === "vertical";
}

/** 连接线的种子基数；每步加上自己的序号，几段等长的线才不会一模一样 */
const LINE_SEED = 2;

/**
 * 节点后那段连接线的笔触参数。方向由壳补上（它是响应式的，两个框架各自的读法不同）。
 * 照老库的线画：笔直不抖（抖了像手写的歪线），细而干，靠飞白的断口和丝缕出枯笔的质感。
 */
export function stepLineOptions(index: number): Omit<BrushLineControllerOptions, "vertical"> {
  return { thickness: 2, wobble: 0, roughness: 0.35, flyingWhite: 0.4, seed: LINE_SEED + index };
}

/** 勾、叉是一笔写出的记号，不开 ink 引擎也能用；墨团和一笔圆只在 m.ink 层出场。都是固定素材，只生成一次 */
const CHECK = inkMarkUrl("check", { seed: 2, strokeWidth: 3 });
const CROSS = inkMarkUrl("cross", { seed: 2, strokeWidth: 3 });
const BLOB = inkBlobUrl({ seed: 4, size: 36, radius: 0.4, raggedness: 0.08 });
const ENSO = inkEnsoUrl({ seed: 3, size: 40, strokeWidth: 3, gap: 0.6 });

/** 四张素材挂在 .m-step 上，节点里的 ::before / ::after 拿它们当遮罩 */
export function stepStyle(): Record<string, string> {
  return {
    "--m-step-check": `url("${CHECK}")`,
    "--m-step-cross": `url("${CROSS}")`,
    "--m-step-blob": `url("${BLOB}")`,
    "--m-step-enso": `url("${ENSO}")`,
  };
}
