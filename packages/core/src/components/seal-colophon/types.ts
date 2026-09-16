import type { StampMode, StampShape } from "../../ink";

export type { StampMode, StampShape };

export type SealColophonAlign = "left" | "right";

export interface SealColophonProps {
  /** 署名 */
  author: string;
  /** 落款语，写在署名前面，如 "写于丙午年秋" */
  text?: string;
  /** 日期，原样显示在署名后面 */
  date?: string;
  /** 印文；默认取 author 的前两个字 */
  seal?: string;
  /** 印章外形，同 MStamp 的 shape；默认 auto 贴着印文 */
  sealShape?: StampShape;
  /** 阳文（朱文）还是阴文（白文），同 MStamp 的 mode；默认阳文 */
  sealMode?: StampMode;
  /** 印章高度（px），默认 40 */
  sealSize?: number;
  /** 整块靠左还是靠右，默认 right */
  align?: SealColophonAlign;
  /** 竖排落款（writing-mode: vertical-rl），印章落在末字下面 */
  vertical?: boolean;
  /** 印章的随机种子，默认固定，服务端和客户端盖的是同一枚 */
  seed?: number;
}

export interface SealColophonSlots {
  /** 替换整段落款文（落款语 + 署名 + 日期） */
  default?: () => unknown;
  /** 替换印章 */
  seal?: () => unknown;
}
