/**
 * 角标的无框架部分：显示文字的归一化、显隐判断、class 派生，以及朱砂小印的三张遮罩。
 * 两个壳只剩"数字变了重挂一次 sup"那几行状态桥接。
 */
import { inkBlobUrl } from "../../ink/assets/blob";
import { inkPasteUrl } from "../../ink/assets/paste";
import { inkShapeUrl } from "../../ink/assets/shape";
import { inkVarBindings, type InkVarBindings } from "../../ink/registry";
import type { BadgeProps } from "./types";

export type { BadgeProps, BadgeType } from "./types";

/** 印面高度（px），外形遮罩按它和估出来的宽生成 */
const SEAL_HEIGHT = 20;

/** 显示的文字：小点和无值都是空串，数字超过 max 显示 "max+" */
export function badgeContent(props: BadgeProps): string {
  const { value, max = 99, dot = false } = props;
  if (dot || value === undefined) return "";
  if (typeof value === "number") return value > max ? `${max}+` : String(value);
  return value;
}

/** 要不要渲染这枚角标：hidden 一票否决，0 默认不显示 */
export function badgeVisible(props: BadgeProps): boolean {
  const { value, dot = false, hidden = false, showZero = false } = props;
  if (hidden) return false;
  if (dot) return true;
  if (value === undefined || value === "") return false;
  return value !== 0 || showZero;
}

/** `hasContent` 是"有没有被标注的内容"（Vue 的默认插槽 / React 的 children）：没有就独立成印 */
export function badgeClasses(props: BadgeProps, hasContent: boolean): string[] {
  const { type = "danger", dot = false } = props;
  return [
    "m-badge",
    `m-badge--${type}`,
    ...(dot ? ["m-badge--dot"] : []),
    ...(hasContent ? [] : ["m-badge--standalone"]),
  ];
}

/**
 * 印面外形按内容估宽分桶（1 位数是方印，2 位、"99+"、短文字依次加宽），不去量 DOM：
 * sup 每次变值都重挂，量完再出形会先闪一帧方块。估的宽只决定外形长宽比，
 * 遮罩最终拉到 ::after 的实际盒子上，差几个像素看不出来；inkShapeUrl 再按 8px 分桶缓存
 */
function sealWidth(text: string): number {
  let width = 10;
  // 12px 字号下数字和拉丁字母约 7px 宽，汉字约 12px
  for (const ch of text) width += /[\u2e80-\uffff]/.test(ch) ? 12 : 7;
  return Math.max(SEAL_HEIGHT, width);
}

export interface BadgeInk extends InkVarBindings {
  style: Record<string, string>;
}

/**
 * 三张遮罩走素材登记：外形按字数分桶、小点和印泥按种子固定，同一张图在样式表里只写一次，
 * 元素上只挂属性；登记不了（服务端、水合首帧）才内联。位移变量也一起写在这里。
 */
export function badgeInk(props: BadgeProps, registered: boolean): BadgeInk {
  const { dot = false, offset, seed = 1 } = props;
  const content = badgeContent(props);
  // 每档宽度换一个种子，同一页里 1 位数和 2 位数的印不会是同一枚拉宽
  const width = content ? sealWidth(content) : 0;
  const shape =
    dot || !content
      ? undefined
      : inkShapeUrl(width, SEAL_HEIGHT, {
          seed: seed * 5 + Math.round(width / 8),
          raggedness: 0.6,
          corner: 0.1,
        });
  // 小点：一滴洇开的朱砂，毛边和晕染都让生成器带上
  const dotMask = dot
    ? inkBlobUrl({ seed: seed + 2, size: 24, radius: 0.42, raggedness: 0.24, bleed: 1.3 })
    : undefined;
  // 印泥厚薄纹理，和外形遮罩 intersect
  const paste = inkPasteUrl({ seed });

  const bindings = inkVarBindings(
    {
      "--m-badge-shape": shape?.url,
      "--m-badge-dot": dotMask,
      "--m-badge-paste": paste.url,
    },
    registered,
  );
  return {
    attrs: bindings.attrs,
    style: {
      ...(offset
        ? { "--m-badge-offset-x": `${offset[0]}px`, "--m-badge-offset-y": `${offset[1]}px` }
        : {}),
      ...bindings.style,
      ...(shape ? { "--m-badge-shape-pad": `${shape.padding}px` } : {}),
      "--m-badge-paste-size": `${paste.size}px`,
    },
  };
}
