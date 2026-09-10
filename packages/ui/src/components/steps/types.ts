export type StepStatus = "wait" | "process" | "finish" | "error";
export type StepsDirection = "horizontal" | "vertical";

export interface StepsProps {
  /** 当前步的序号，从 0 开始；序号小于它的步算完成，大于它的算等待 */
  active?: number;
  /** 排列方向，默认横向 */
  direction?: StepsDirection;
  /** 当前步的状态，默认 process；出错时传 error */
  status?: StepStatus;
  /** 紧凑版：节点和标题排成一行，不显示描述 */
  simple?: boolean;
}

export interface StepsSlots {
  /** 放 MStep */
  default?: () => unknown;
}

export interface StepProps {
  /** 标题；title 插槽优先 */
  title?: string;
  /** 描述，标题下面一行小字；description 插槽优先 */
  description?: string;
  /** 强制指定这一步的状态，不传则按序号和 MSteps 的 active 推断 */
  status?: StepStatus;
}

export interface StepSlots {
  /** 节点里的内容，替换掉序号 / 勾 / 叉 */
  icon?: () => unknown;
  /** 标题 */
  title?: () => unknown;
  /** 描述 */
  description?: () => unknown;
}
