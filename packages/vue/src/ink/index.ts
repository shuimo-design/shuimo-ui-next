/**
 * 墨迹引擎的 Vue 门面：素材生成、控制器、引擎本体全在 @shuimo-design/core，
 * 这里只补三样 Vue 才有的东西 —— 两个组合式函数和一个指令。
 */
export * from "@shuimo-design/core/ink";
export { useBrushBorder } from "./use-brush-border";
export { useInkReveal, vInkReveal } from "./use-ink-reveal";
