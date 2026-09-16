export type RateSize = "sm" | "md" | "lg";

export interface RateProps {
  /** 总格数，默认 5 */
  count?: number;
  /** 允许半格：值可以是 .5，指针落在一格左半边就是半格 */
  allowHalf?: boolean;
  /** 再点一次当前值就归零，默认 true */
  allowClear?: boolean;
  /** 禁用：不响应指针和键盘，退出 Tab 序列 */
  disabled?: boolean;
  /** 只读：只展示，不响应指针和键盘，仍可聚焦 */
  readonly?: boolean;
  /** 尺寸：sm / md / lg 对应 16 / 20 / 26px，默认 md */
  size?: RateSize;
  /** 每一档右侧显示的文字，按档位下标取；悬停预览时跟着预览值变 */
  texts?: string[];
  /** 每格墨团毛边的随机种子，默认 1；同一组里每格再按下标派生，各不相同 */
  seed?: number;
}

export interface RateEmits {
  /** 点击或键盘落定的新值 */
  change: [value: number];
  /** 悬停预览值变化；指针离开时为 0 */
  hoverChange: [value: number];
}

/** character 插槽 / renderCharacter 拿到的作用域 */
export interface RateCharacterScope {
  /** 这一格的下标，从 0 起 */
  index: number;
  /** 这一层要不要画成选中态。半格时同一格渲染两层：底层 false，左半覆盖层 true */
  active: boolean;
}

export interface RateSlots {
  /** 自定义每一格的图形；不给就是墨点 */
  character?: (scope: RateCharacterScope) => unknown;
}
