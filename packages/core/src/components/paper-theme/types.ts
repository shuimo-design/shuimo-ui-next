import type { PaperPreset } from "../../ink";

export type { PaperPreset };

export type PaperThemeSize = "sm" | "md" | "lg";

export interface PaperThemeProps {
  /** 展示哪几种纸，按给的顺序排；默认全部五种：raw 生宣、processed 熟宣、antique 古色、teaStained 茶染、moonWhite 月白 */
  presets?: PaperPreset[];
  /** 纸样尺寸：sm 24px、md 32px、lg 44px，默认 md */
  size?: PaperThemeSize;
  /** 把选择记到 localStorage（键 "shuimo-paper"），刷新后恢复，默认 true */
  storage?: boolean;
  /** 各种纸的显示名，覆盖默认中文名（生宣 / 熟宣 / 古色 / 茶染 / 月白） */
  labels?: Partial<Record<PaperPreset, string>>;
  /** 禁用：不可点、不可用键盘切换 */
  disabled?: boolean;
}

export interface PaperThemeEmits {
  /** 用户选了一种纸，参数是选中的预设 */
  change: [preset: PaperPreset];
}
