/**
 * id 的加工。core 自己**不生成** id —— 生成交给各框架的 useId()，
 * 它们在服务端和客户端是一致的，跨框架的 id 永远不会出现在同一棵树里。
 */

/**
 * 去掉框架 useId 里的分隔符。React 19 给的是 `«r1»`、React 18 是 `:R1:`，
 * 这些字符在 CSS 选择器和 `url(#id)` 里是非法的，必须洗掉。
 */
export function sanitizeId(raw: string): string {
  return raw.replace(/[^\w-]/g, "-");
}
