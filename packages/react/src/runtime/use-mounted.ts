import { useEffect, useState } from "react";

/**
 * 是否已经挂载。服务端和水合首帧都是 false。
 *
 * 用它把"只有客户端才算得出来的东西"挡在水合之后：量出来的尺寸、
 * 走素材登记表的 data 属性、传送到 body 的浮层。服务端和首帧渲染朴素版，
 * 两边输出一致，水合才不会报不匹配。
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
