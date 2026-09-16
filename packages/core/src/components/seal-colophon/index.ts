/**
 * 落款的无框架部分：印文默认值、递给 MStamp 的那几个 props、class 派生。
 *
 * 这个组件没有状态也没有交互，印章的几何全在 MStamp 里；这里只定"印文取署名前两个字"、
 * "种子默认固定"这两条规则，两个壳各自渲染一枚 MStamp，参数一字不差。
 */
import type { StampProps } from "../stamp/types";
import type { SealColophonProps } from "./types";

export type {
  SealColophonAlign,
  SealColophonProps,
  SealColophonSlots,
  StampMode,
  StampShape,
} from "./types";

/** 没传 seed 时盖的那一枚：固定值，服务端和客户端才是同一枚章 */
export const SEAL_COLOPHON_SEED = 7;
/** 印章默认高度 px；正文 14px、行距略大时，两个字的章压在末字右下正好 */
export const SEAL_COLOPHON_SEAL_SIZE = 40;

/** 印文：显式 seal > 署名前两个字（按码点数，生僻字不会被劈开） */
export function sealColophonSealText(author: string, seal: string | undefined): string {
  if (seal !== undefined && seal !== "") return seal;
  return Array.from(author.trim()).slice(0, 2).join("");
}

/** 递给 MStamp 的 props。没传的字段照样递 undefined，默认值归 generateStamp 管 */
export function sealColophonStampProps(props: SealColophonProps): StampProps {
  return {
    text: sealColophonSealText(props.author, props.seal),
    shape: props.sealShape,
    mode: props.sealMode,
    size: props.sealSize ?? SEAL_COLOPHON_SEAL_SIZE,
    seed: props.seed ?? SEAL_COLOPHON_SEED,
  };
}

export function sealColophonClasses(props: SealColophonProps): string[] {
  return [
    "m-seal-colophon",
    `m-seal-colophon--${props.align ?? "right"}`,
    ...(props.vertical ? ["m-seal-colophon--vertical"] : []),
  ];
}
