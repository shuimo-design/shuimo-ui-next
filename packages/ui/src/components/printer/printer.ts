/** 控制台打印：带彩色署名徽章的 console.log / console.error，组件内部报错和调试都用它 */
import type { ConsolePrinter, PrinterLevel } from "./types";

// 控制台样式吃不到 CSS 变量，只能写死颜色
const COLORS: Record<PrinterLevel, string> = {
  suggest: "#ebb10d",
  info: "#474b4c",
  error: "#f03f24",
};

function print(level: PrinterLevel, name: string, content: unknown[]) {
  const method = level === "error" ? console.error : console.log;
  method(
    `%c ${name} `,
    `background:${COLORS[level]};border-radius:5px;padding:5px 7px;color:white;`,
    ...content,
  );
}

export function createPrinter(name = "水墨UI"): ConsolePrinter {
  return {
    suggest: (...content) => print("suggest", name, content),
    info: (...content) => print("info", name, content),
    error: (...content) => print("error", name, content),
  };
}
