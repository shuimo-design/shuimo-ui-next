/** 0 = 纯色纸、无动效；1 = SVG 山 + 视差；2 = 全部滤镜 + 落墨动画 */
export type InkTier = 0 | 1 | 2;

interface NavigatorHints {
  hardwareConcurrency?: number;
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

/** 按设备能力与用户偏好给出默认档位；SSR 阶段返回 0，水合后再升级 */
export function detectInkTier(): InkTier {
  if (typeof window === "undefined") return 0;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return 0;

  const nav = navigator as Navigator & NavigatorHints;
  if (nav.connection?.saveData) return 0;

  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  if (cores >= 8 && memory >= 8) return 2;
  return 1;
}
