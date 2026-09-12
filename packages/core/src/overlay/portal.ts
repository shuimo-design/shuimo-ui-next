/** 传送目标的解析：两个框架共用同一套 prop 语义（true → body，字符串 → 选择器，false → 原地） */
export function resolvePortalTarget(teleport: boolean | string | undefined): HTMLElement | null {
  if (teleport === false || typeof document === "undefined") return null;
  if (typeof teleport === "string") return document.querySelector<HTMLElement>(teleport);
  return document.body;
}
