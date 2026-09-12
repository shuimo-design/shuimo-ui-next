/** 单滑块是一个数，range 时是 [起点, 终点] */
export type SliderValue = number | [number, number];

export interface SliderProps {
  /** 最小值，默认 0 */
  min?: number;
  /** 最大值，默认 100 */
  max?: number;
  /** 步长，默认 1；值会对齐到步长格点 */
  step?: number;
  /** 禁用 */
  disabled?: boolean;
  /** 范围选择：v-model 是 [起点, 终点]，显示两个滑块 */
  range?: boolean;
  /** 在轨道上方显示 min、当前百分比、max 一行信息，默认 false */
  showInfo?: boolean;
  /** 拖动或悬停时在滑块上方显示当前值，默认 true */
  showTooltip?: boolean;
  /** 自定义气泡文字 */
  formatTooltip?: (value: number) => string;
}

export interface SliderEmits {
  /** 松手 / 键盘调整后的最终值 */
  change: [value: SliderValue];
  /** 拖动过程中每次值变化 */
  input: [value: SliderValue];
}
