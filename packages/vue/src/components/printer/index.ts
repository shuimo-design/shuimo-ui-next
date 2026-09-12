export { default as MPrinter } from "./MPrinter.vue";
// 控制台彩色打印和打字机控制器都在 core，两个框架共用同一份
export { createPrinter } from "@shuimo-design/core";
export type { ConsolePrinter, PrinterEmits, PrinterLevel, PrinterProps } from "@shuimo-design/core";
