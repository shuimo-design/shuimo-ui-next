export interface PrinterProps {
  /** 要逐字打出的文字；换行按原样保留 */
  text?: string;
  /** 每个字的间隔 ms，默认 80；0 或负数直接整段显示 */
  speed?: number;
  /** 打完后停一停再从头打，默认 false */
  loop?: boolean;
  /** 循环时打完到重打之间停多久 ms，默认 1200 */
  pause?: number;
  /** 是否显示闪烁的墨点光标，默认 true */
  cursor?: boolean;
  /** 挂载后自动开始，默认 true；关掉后要自己调 restart() */
  autoplay?: boolean;
}

export interface PrinterEmits {
  /** 一段文字全部打完时触发；循环时每一轮都会触发 */
  end: [];
}

/** 控制台打印的三档：建议（黄）、信息（灰）、异常（红） */
export type PrinterLevel = "suggest" | "info" | "error";

export interface ConsolePrinter {
  suggest: (...content: unknown[]) => void;
  info: (...content: unknown[]) => void;
  error: (...content: unknown[]) => void;
}
