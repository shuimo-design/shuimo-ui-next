export type SwitchValue = string | number | boolean;

export interface SwitchProps {
  /** 禁用 */
  disabled?: boolean;
  /** 加载中：滑钮缓慢旋转且不可操作 */
  loading?: boolean;
  /** 打开时 v-model 取的值，默认 true */
  activeValue?: SwitchValue;
  /** 关闭时 v-model 取的值，默认 false */
  inactiveValue?: SwitchValue;
  /** 打开态文字（显示在开关左侧） */
  activeText?: string;
  /** 关闭态文字（显示在开关右侧） */
  inactiveText?: string;
  /** 受控：点击只发 change，不自己改 v-model，由外部决定要不要切换 */
  controlled?: boolean;
  /** 原生 name */
  name?: string;
}

export interface SwitchEmits {
  /** 用户切换后，参数是（将要变成的）新值 */
  change: [value: SwitchValue];
}

export interface SwitchSlots {
  /** 替代 activeText */
  active?: () => unknown;
  /** 替代 inactiveText */
  inactive?: () => unknown;
}
